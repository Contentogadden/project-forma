package ru.projectforma.classroom;

import static ru.projectforma.classroom.ClassroomAccess.checkVersion;
import static ru.projectforma.classroom.ClassroomAccess.fail;

import jakarta.validation.Valid;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import ru.projectforma.account.*;
import ru.projectforma.classroom.ClassroomModels.*;

@RestController
@RequestMapping("/api/classroom")
@Transactional
public class StudyGroupController {

    private final StudyGroupRepository groups;
    private final AdminEventRepository audit;
    private final ClassroomAccess access;
    private final ClassroomViews views;

    public StudyGroupController(
        StudyGroupRepository groups,
        AdminEventRepository audit,
        ClassroomAccess access,
        ClassroomViews views
    ) {
        this.groups = groups;
        this.audit = audit;
        this.access = access;
        this.views = views;
    }

    @GetMapping("/groups")
    List<GroupView> groups(Authentication auth) {
        UserAccount actorAccount = access.actor(auth, Role.ADMIN, Role.TEACHER);
        return (
            actorAccount.getRole() == Role.ADMIN
                ? groups.findAll()
                : groups.findByTeacherId(actorAccount.getId())
        )
            .stream()
            .map(views::group)
            .toList();
    }

    private void fillGroup(StudyGroup group, GroupBody body) {
        group.name = body.name().strip();
        group.teacher = access.account(body.teacherId(), Role.TEACHER, false);
        group.students = new HashSet<>(
            body
                .studentIds()
                .stream()
                .map(id -> access.account(id, Role.STUDENT, false))
                .toList()
        );
    }

    @PostMapping("/groups")
    GroupView createGroup(Authentication auth, @Valid @RequestBody GroupBody body) {
        UserAccount admin = access.actor(auth, Role.ADMIN);
        StudyGroup group = new StudyGroup();
        fillGroup(group, body);
        groups.saveAndFlush(group);
        audit.save(
            new AdminEvent(
                admin.getUsername(),
                "GROUP_CREATED",
                group.name +
                    " · " +
                    group.teacher.getUsername() +
                    " · учеников: " +
                    group.students.size()
            )
        );
        return views.group(group);
    }

    @PutMapping("/groups/{id}")
    GroupView updateGroup(
        Authentication auth,
        @PathVariable Long id,
        @Valid @RequestBody GroupBody body
    ) {
        UserAccount admin = access.actor(auth, Role.ADMIN);
        StudyGroup group = groups
            .findById(id)
            .orElseThrow(() -> fail(HttpStatus.NOT_FOUND, "Группа не найдена"));
        fillGroup(group, body);
        groups.saveAndFlush(group);
        audit.save(
            new AdminEvent(
                admin.getUsername(),
                "GROUP_UPDATED",
                group.name +
                    " · " +
                    group.teacher.getUsername() +
                    " · учеников: " +
                    group.students.size()
            )
        );
        return views.group(group);
    }
}
