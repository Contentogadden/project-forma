package ru.projectforma.classroom;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "work_events")
public class WorkEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(optional = false)
    AssignedWork work;

    @Column(nullable = false, length = 20)
    String kind;

    @Column(nullable = false, length = 500)
    String notes;

    @Column(nullable = false, length = 2000)
    String comment;

    @Column(nullable = false)
    Instant createdAt = Instant.now();

    protected WorkEvent() {}

    WorkEvent(AssignedWork work, String kind, String comment) {
        this.work = work;
        this.kind = kind;
        this.notes = work.notes;
        this.comment = comment;
    }
}
