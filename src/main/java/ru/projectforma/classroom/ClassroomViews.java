package ru.projectforma.classroom;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;
import ru.projectforma.account.UserAccount;
import ru.projectforma.classroom.ClassroomModels.*;
import tools.jackson.databind.ObjectMapper;

@Component
public class ClassroomViews {

    private final ObjectMapper json;
    private final WorkEventRepository events;

    public ClassroomViews(ObjectMapper json, WorkEventRepository events) {
        this.json = json;
        this.events = events;
    }

    Person person(UserAccount actorAccount) {
        return new Person(
            actorAccount.getId(),
            actorAccount.getUsername(),
            actorAccount.getDisplayName(),
            actorAccount.getRole(),
            actorAccount.isEnabled(),
            actorAccount.getVersion()
        );
    }

    GroupView group(StudyGroup group) {
        return new GroupView(
            group.id,
            group.name,
            person(group.teacher),
            group.students
                .stream()
                .map(this::person)
                .sorted(Comparator.comparing(Person::displayName))
                .toList()
        );
    }

    TemplateView template(TaskTemplate template) {
        return new TemplateView(
            template.id,
            template.version,
            json.readValue(template.definition, MelodyDefinition.class),
            template.updatedAt
        );
    }

    private List<Integer> notes(String encoded) {
        return Arrays.asList(json.readValue(encoded, Integer[].class));
    }

    WorkView work(AssignedWork work) {
        return new WorkView(
            work.id,
            work.version,
            person(work.teacher),
            person(work.student),
            json.readValue(work.definition, MelodyDefinition.class),
            notes(work.notes),
            work.status,
            work.comment,
            work.dueDate,
            work.updatedAt,
            events
                .findByWorkIdOrderByIdAsc(work.id)
                .stream()
                .map(e -> new EventView(e.id, e.kind, notes(e.notes), e.comment, e.createdAt))
                .toList()
        );
    }
}
