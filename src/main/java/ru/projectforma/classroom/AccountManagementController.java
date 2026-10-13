package ru.projectforma.classroom;

import static ru.projectforma.classroom.ClassroomAccess.checkVersion;
import static ru.projectforma.classroom.ClassroomAccess.fail;

import jakarta.validation.Valid;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import ru.projectforma.account.*;
import ru.projectforma.classroom.ClassroomModels.*;

@RestController
@RequestMapping("/api/classroom")
@Transactional
public class AccountManagementController {

    private final UserAccountRepository accounts;
    private final StudyGroupRepository groups;
    private final TaskTemplateRepository templates;
    private final AssignedWorkRepository works;
    private final PasswordEncoder encoder;
    private final AdminEventRepository audit;
    private final ClassroomAccess access;
    private final ClassroomViews views;

    public AccountManagementController(
        UserAccountRepository accounts,
        StudyGroupRepository groups,
        TaskTemplateRepository templates,
        AssignedWorkRepository works,
        PasswordEncoder encoder,
        AdminEventRepository audit,
        ClassroomAccess access,
        ClassroomViews views
    ) {
        this.accounts = accounts;
        this.groups = groups;
        this.templates = templates;
        this.works = works;
        this.encoder = encoder;
        this.audit = audit;
        this.access = access;
        this.views = views;
    }

    @GetMapping("/users")
    List<Person> users(Authentication auth) {
        access.actor(auth, Role.ADMIN);
        return accounts
            .findAll()
            .stream()
            .map(views::person)
            .sorted(Comparator.comparing(Person::displayName))
            .toList();
    }

    @PostMapping("/users")
    Person createUser(Authentication auth, @Valid @RequestBody CreateUser body) {
        UserAccount admin = access.actor(auth, Role.ADMIN);
        if (
            body.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72
        ) throw fail(HttpStatus.BAD_REQUEST, "Пароль слишком длинный");
        String username = body.username().toLowerCase(Locale.ROOT);
        if (accounts.findByUsernameIgnoreCase(username).isPresent()) throw fail(
            HttpStatus.CONFLICT,
            "Этот логин уже занят"
        );
        UserAccount created = accounts.saveAndFlush(
            new UserAccount(
                username,
                body.displayName().strip(),
                encoder.encode(body.password()),
                body.role()
            )
        );
        audit.save(
            new AdminEvent(admin.getUsername(), "USER_CREATED", username + " · " + body.role())
        );
        return views.person(created);
    }

    @PutMapping("/users/{id}")
    Person updateUser(
        Authentication auth,
        @PathVariable Long id,
        @Valid @RequestBody UpdateUser body
    ) {
        UserAccount admin = access.actor(auth, Role.ADMIN);

        var administrators = accounts.lockActiveAdministrators();
        UserAccount target = accounts
            .findById(id)
            .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Пользователь не найден"));
        checkVersion(target.getVersion(), body.version());
        validateAdminAccess(admin, target, body, administrators.size());
        validateRoleChange(target, body);
        String before = target.getRole() + " / " + (target.isEnabled() ? "активен" : "отключён");
        target.updateProfile(body.displayName().strip(), body.role(), body.enabled());
        accounts.saveAndFlush(target);
        audit.save(
            new AdminEvent(
                admin.getUsername(),
                "USER_UPDATED",
                target.getUsername() +
                    " · " +
                    before +
                    " → " +
                    target.getRole() +
                    " / " +
                    (target.isEnabled() ? "активен" : "отключён")
            )
        );
        return views.person(target);
    }

    @PostMapping("/users/{id}/password")
    Person resetPassword(
        Authentication auth,
        @PathVariable Long id,
        @Valid @RequestBody ResetPassword body
    ) {
        UserAccount admin = access.actor(auth, Role.ADMIN);
        UserAccount target = accounts
            .findById(id)
            .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Пользователь не найден"));
        checkVersion(target.getVersion(), body.version());
        if (admin.getId().equals(id)) throw fail(
            HttpStatus.BAD_REQUEST,
            "Смена собственного пароля в этом разделе недоступна"
        );
        if (
            body.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72
        ) throw fail(HttpStatus.BAD_REQUEST, "Пароль слишком длинный");
        target.resetPassword(encoder.encode(body.password()));
        accounts.saveAndFlush(target);
        audit.save(
            new AdminEvent(
                admin.getUsername(),
                "PASSWORD_RESET",
                target.getUsername() + " · прежние сессии завершены"
            )
        );
        return views.person(target);
    }

    @GetMapping("/audit")
    List<AuditView> audit(Authentication auth) {
        access.actor(auth, Role.ADMIN);
        return audit
            .findTop100ByOrderByIdDesc()
            .stream()
            .map(e -> new AuditView(e.id, e.actor, e.action, e.detail, e.createdAt))
            .toList();
    }

    private void validateAdminAccess(
        UserAccount admin,
        UserAccount target,
        UpdateUser body,
        int activeAdministrators
    ) {
        if (
            admin.getId().equals(target.getId()) && (body.role() != Role.ADMIN || !body.enabled())
        ) throw fail(HttpStatus.BAD_REQUEST, "Нельзя отключить свой административный доступ");
        if (
            target.getRole() == Role.ADMIN &&
            target.isEnabled() &&
            (body.role() != Role.ADMIN || !body.enabled()) &&
            activeAdministrators < 2
        ) throw fail(HttpStatus.CONFLICT, "В школе должен оставаться активный администратор");
    }

    private void validateRoleChange(UserAccount target, UpdateUser body) {
        if (target.getRole() != body.role()) {
            boolean bound =
                groups
                    .findAll()
                    .stream()
                    .anyMatch(
                        group ->
                            group.teacher.getId().equals(target.getId()) ||
                            group.students.stream().anyMatch(s -> s.getId().equals(target.getId()))
                    ) ||
                !templates.findByTeacherIdOrderByUpdatedAtDesc(target.getId()).isEmpty() ||
                !works.findByTeacherIdOrderByUpdatedAtDesc(target.getId()).isEmpty() ||
                !works.findByStudentIdOrderByUpdatedAtDesc(target.getId()).isEmpty();
            if (bound) throw fail(
                HttpStatus.CONFLICT,
                "Роль связана с группами или учебными работами. Создайте отдельную учётную запись для другой роли."
            );
        }
    }
}
