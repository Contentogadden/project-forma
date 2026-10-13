package ru.projectforma.classroom;

import static ru.projectforma.classroom.AssignedWork.Status.*;
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
public class AssignedWorkController {

    private final AssignedWorkRepository works;
    private final WorkEventRepository events;
    private final ObjectMapper json;
    private final ClassroomAccess access;
    private final ClassroomViews views;

    public AssignedWorkController(
        AssignedWorkRepository works,
        WorkEventRepository events,
        ObjectMapper json,
        ClassroomAccess access,
        ClassroomViews views
    ) {
        this.works = works;
        this.events = events;
        this.json = json;
        this.access = access;
        this.views = views;
    }

    @GetMapping("/works")
    List<WorkView> works(Authentication auth) {
        UserAccount actorAccount = access.actor(auth, Role.TEACHER, Role.STUDENT);
        return (
            actorAccount.getRole() == Role.TEACHER
                ? works.findByTeacherIdOrderByUpdatedAtDesc(actorAccount.getId())
                : works.findByStudentIdOrderByUpdatedAtDesc(actorAccount.getId())
        )
            .stream()
            .map(views::work)
            .toList();
    }

    @PostMapping("/works/{id}/check")
    MelodyChecker.Result checkAnswer(
        Authentication auth,
        @PathVariable Long id,
        @Valid @RequestBody AnswerBody body
    ) {
        AssignedWork work = access.ownWork(id, access.actor(auth, Role.STUDENT, Role.TEACHER));
        checkVersion(work.version, body.version());
        return MelodyChecker.check(
            json.readValue(work.definition, MelodyDefinition.class),
            body.notes()
        );
    }

    @PutMapping("/works/{id}/answer")
    WorkView answer(
        Authentication auth,
        @PathVariable Long id,
        @Valid @RequestBody AnswerBody body
    ) {
        AssignedWork work = access.ownWork(id, access.actor(auth, Role.STUDENT));
        checkVersion(work.version, body.version());
        if (work.status == SUBMITTED || work.status == ACCEPTED) throw fail(
            HttpStatus.CONFLICT,
            "Отправленный ответ нельзя изменять до возврата учителем"
        );
        MelodyDefinition definition = json.readValue(work.definition, MelodyDefinition.class);
        validateAnswer(definition, body);
        work.notes = json.writeValueAsString(body.notes());
        work.updatedAt = Instant.now();
        work.status = body.submit() ? SUBMITTED : work.status == REVISION ? REVISION : DRAFT;
        if (body.submit()) events.save(new WorkEvent(work, "SUBMITTED", ""));

        return views.work(works.saveAndFlush(work));
    }

    @PostMapping("/works/{id}/review")
    WorkView review(
        Authentication auth,
        @PathVariable Long id,
        @Valid @RequestBody ReviewBody body
    ) {
        AssignedWork work = access.ownWork(id, access.actor(auth, Role.TEACHER));
        checkVersion(work.version, body.version());
        if (
            work.status != SUBMITTED || (body.status() != ACCEPTED && body.status() != REVISION)
        ) throw fail(HttpStatus.CONFLICT, "Можно проверить только отправленную работу");
        work.status = body.status();
        work.comment = body.comment().strip();
        work.updatedAt = Instant.now();
        events.save(new WorkEvent(work, work.status.name(), work.comment));
        return views.work(works.saveAndFlush(work));
    }

    private void validateAnswer(MelodyDefinition definition, AnswerBody body) {
        for (int i = 0; i < 8; i++) {
            int note = body.notes().get(i);
            if (definition.editable().contains(i)) {
                if (
                    (note != 0 && !definition.allowed().contains(note)) ||
                    (body.submit() && note == 0)
                ) throw fail(HttpStatus.BAD_REQUEST, "Заполните изменяемые доли доступными нотами");
            } else if (note != definition.initial().get(i)) throw fail(
                HttpStatus.BAD_REQUEST,
                "Исходные ноты изменять нельзя"
            );
        }
    }
}
