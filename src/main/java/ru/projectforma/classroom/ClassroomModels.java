package ru.projectforma.classroom;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import ru.projectforma.account.Role;

public final class ClassroomModels {

    private ClassroomModels() {}

    public record Person(
        Long id,
        String username,
        String displayName,
        Role role,
        boolean enabled,
        long version
    ) {}

    public record GroupView(Long id, String name, Person teacher, List<Person> students) {}

    public record CreateUser(
        @NotBlank @Pattern(regexp = "[a-zA-Z0-9._-]{3,64}") String username,
        @NotBlank @Size(max = 120) String displayName,
        @NotBlank @Size(min = 12, max = 64) String password,
        @NotNull Role role
    ) {}

    public record UpdateUser(
        @Min(0) long version,
        @NotBlank @Size(max = 120) String displayName,
        @NotNull Role role,
        boolean enabled
    ) {}

    public record ResetPassword(
        @Min(0) long version,
        @NotBlank @Size(min = 12, max = 64) String password
    ) {}

    public record AuditView(
        Long id,
        String actor,
        String action,
        String detail,
        Instant createdAt
    ) {}

    public record GroupBody(
        @NotBlank @Size(max = 100) String name,
        @NotNull Long teacherId,
        @NotNull @Size(max = 100) Set<@NotNull Long> studentIds
    ) {}

    public record TemplateView(
        Long id,
        Long version,
        MelodyDefinition definition,
        Instant updatedAt
    ) {}

    public record UpdateTemplate(
        @NotNull Long version,
        @NotNull @Valid MelodyDefinition definition
    ) {}

    public record AssignBody(
        @NotNull Long version,
        @NotEmpty @Size(max = 100) Set<@NotNull Long> studentIds,
        @FutureOrPresent LocalDate dueDate
    ) {}

    public record EventView(
        Long id,
        String kind,
        List<Integer> notes,
        String comment,
        Instant createdAt
    ) {}

    public record WorkView(
        Long id,
        Long version,
        Person teacher,
        Person student,
        MelodyDefinition definition,
        List<Integer> notes,
        AssignedWork.Status status,
        String comment,
        LocalDate dueDate,
        Instant updatedAt,
        List<EventView> history
    ) {}

    public record AnswerBody(
        @NotNull Long version,
        @NotNull @Size(min = 8, max = 8) List<@NotNull Integer> notes,
        boolean submit
    ) {}

    public record ReviewBody(
        @NotNull Long version,
        @NotNull AssignedWork.Status status,
        @NotBlank @Size(max = 2000) String comment
    ) {}
}
