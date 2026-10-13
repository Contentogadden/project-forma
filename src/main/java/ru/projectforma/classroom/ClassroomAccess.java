package ru.projectforma.classroom;

import java.util.Arrays;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import ru.projectforma.account.*;

@Component
public class ClassroomAccess {

    private final UserAccountRepository accounts;
    private final TaskTemplateRepository templates;
    private final AssignedWorkRepository works;

    public ClassroomAccess(
        UserAccountRepository accounts,
        TaskTemplateRepository templates,
        AssignedWorkRepository works
    ) {
        this.accounts = accounts;
        this.templates = templates;
        this.works = works;
    }

    static ResponseStatusException fail(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }

    UserAccount actor(Authentication auth, Role... roles) {
        if (auth == null) throw fail(HttpStatus.UNAUTHORIZED, "Войдите в учётную запись");
        UserAccount actorAccount = accounts
            .findByUsernameIgnoreCase(auth.getName())
            .orElseThrow(() -> fail(HttpStatus.UNAUTHORIZED, "Учётная запись не найдена"));
        if (!actorAccount.isEnabled()) throw fail(HttpStatus.FORBIDDEN, "Учётная запись отключена");
        if (roles.length > 0 && !Arrays.asList(roles).contains(actorAccount.getRole())) throw fail(
            HttpStatus.FORBIDDEN,
            "Недостаточно прав"
        );
        return actorAccount;
    }

    UserAccount account(Long id, Role role) {
        return account(id, role, true);
    }

    UserAccount account(Long id, Role role, boolean requireEnabled) {
        UserAccount actorAccount = accounts
            .findById(id)
            .orElseThrow(() -> fail(HttpStatus.BAD_REQUEST, "Пользователь не найден"));
        if (
            actorAccount.getRole() != role || (requireEnabled && !actorAccount.isEnabled())
        ) throw fail(HttpStatus.BAD_REQUEST, "Проверьте роль и доступ пользователя");
        return actorAccount;
    }

    TaskTemplate ownTemplate(Long id, UserAccount teacher) {
        TaskTemplate template = templates
            .findById(id)
            .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Шаблон не найден"));
        if (!template.teacher.getId().equals(teacher.getId())) throw fail(
            HttpStatus.NOT_FOUND,
            "Шаблон не найден"
        );
        return template;
    }

    AssignedWork ownWork(Long id, UserAccount actorAccount) {
        AssignedWork work = works
            .findById(id)
            .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Работа не найдена"));
        Long owner =
            actorAccount.getRole() == Role.TEACHER ? work.teacher.getId() : work.student.getId();
        if (!owner.equals(actorAccount.getId())) throw fail(
            HttpStatus.NOT_FOUND,
            "Работа не найдена"
        );
        return work;
    }

    static void checkVersion(Long stored, Long given) {
        if (!Objects.equals(stored, given)) throw fail(
            HttpStatus.CONFLICT,
            "Работа изменилась в другой вкладке. Обновите список и откройте её снова."
        );
    }
}
