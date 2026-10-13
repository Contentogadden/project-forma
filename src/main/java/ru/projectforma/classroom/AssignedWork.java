package ru.projectforma.classroom;

import jakarta.persistence.*;
import java.time.*;
import ru.projectforma.account.UserAccount;

@Entity
@Table(name = "assigned_works")
public class AssignedWork {

    public enum Status {
        NOT_STARTED,
        DRAFT,
        SUBMITTED,
        REVISION,
        ACCEPTED,
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Version
    Long version;

    @ManyToOne(optional = false)
    UserAccount teacher;

    @ManyToOne(optional = false)
    UserAccount student;

    @Column(nullable = false)
    Long templateId;

    @Column(nullable = false)
    Long templateVersion;

    @Column(nullable = false, length = 8000, updatable = false)
    String definition;

    @Column(nullable = false, length = 500)
    String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    Status status = Status.NOT_STARTED;

    @Column(length = 2000)
    String comment = "";

    LocalDate dueDate;

    @Column(nullable = false)
    Instant updatedAt = Instant.now();

    protected AssignedWork() {}

    AssignedWork(TaskTemplate template, UserAccount student, String notes, LocalDate dueDate) {
        this.teacher = template.teacher;
        this.student = student;
        this.templateId = template.id;
        this.templateVersion = template.version;
        this.definition = template.definition;
        this.notes = notes;
        this.dueDate = dueDate;
    }
}
