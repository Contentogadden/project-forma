package ru.projectforma.classroom;

import jakarta.persistence.*;
import java.time.Instant;
import ru.projectforma.account.UserAccount;

@Entity
@Table(name = "task_templates")
public class TaskTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Version
    Long version;

    @ManyToOne(optional = false)
    UserAccount teacher;

    @Column(nullable = false, length = 8000)
    String definition;

    @Column(nullable = false)
    Instant updatedAt = Instant.now();

    protected TaskTemplate() {}

    TaskTemplate(UserAccount teacher, String definition) {
        this.teacher = teacher;
        this.definition = definition;
    }
}
