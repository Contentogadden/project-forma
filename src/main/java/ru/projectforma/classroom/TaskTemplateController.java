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
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/classroom")
@Transactional
public class TaskTemplateController {

    private final TaskTemplateRepository templates;
    private final AssignedWorkRepository works;
    private final StudyGroupRepository groups;
    private final ObjectMapper json;
    private final ClassroomAccess access;
    private final ClassroomViews views;

    public TaskTemplateController(
        TaskTemplateRepository templates,
        AssignedWorkRepository works,
        StudyGroupRepository groups,
        ObjectMapper json,
        ClassroomAccess access,
        ClassroomViews views
    ) {
        this.templates = templates;
        this.works = works;
        this.groups = groups;
        this.json = json;
        this.access = access;
        this.views = views;
    }

    @GetMapping("/templates")
    List<TemplateView> templates(Authentication auth) {
        return templates
            .findByTeacherIdOrderByUpdatedAtDesc(access.actor(auth, Role.TEACHER).getId())
            .stream()
            .map(views::template)
            .toList();
    }

    @PostMapping("/templates")
    TemplateView createTemplate(
        Authentication auth,
        @Valid @RequestBody MelodyDefinition definition
    ) {
        UserAccount actorAccount = access.actor(auth, Role.TEACHER);
        MelodyDefinitionValidator.validate(definition);
        return views.template(
            templates.saveAndFlush(
                new TaskTemplate(actorAccount, json.writeValueAsString(definition))
            )
        );
    }

    @PutMapping("/templates/{id}")
    TemplateView updateTemplate(
        Authentication auth,
        @PathVariable Long id,
        @Valid @RequestBody UpdateTemplate body
    ) {
        TaskTemplate template = access.ownTemplate(id, access.actor(auth, Role.TEACHER));
        checkVersion(template.version, body.version());
        MelodyDefinitionValidator.validate(body.definition());
        template.definition = json.writeValueAsString(body.definition());
        template.updatedAt = Instant.now();
        return views.template(templates.saveAndFlush(template));
    }

    @PostMapping("/templates/{id}/assign")
    List<WorkView> assign(
        Authentication auth,
        @PathVariable Long id,
        @Valid @RequestBody AssignBody body
    ) {
        UserAccount teacher = access.actor(auth, Role.TEACHER);
        TaskTemplate template = access.ownTemplate(id, teacher);
        checkVersion(template.version, body.version());
        Set<Long> allowed = new HashSet<>();
        groups
            .findByTeacherId(teacher.getId())
            .forEach(group -> group.students.forEach(s -> allowed.add(s.getId())));
        if (!allowed.containsAll(body.studentIds())) throw fail(
            HttpStatus.FORBIDDEN,
            "Можно назначать только ученикам своих групп"
        );
        String notes = json.writeValueAsString(
            json.readValue(template.definition, MelodyDefinition.class).initial()
        );
        return body
            .studentIds()
            .stream()
            .sorted()
            .map(idStudent ->
                views.work(
                    works.saveAndFlush(
                        new AssignedWork(
                            template,
                            access.account(idStudent, Role.STUDENT),
                            notes,
                            body.dueDate()
                        )
                    )
                )
            )
            .toList();
    }
}
