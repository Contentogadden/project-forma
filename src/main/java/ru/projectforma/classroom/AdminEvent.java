package ru.projectforma.classroom;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "admin_events")
public class AdminEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, length = 64)
    String actor;

    @Column(nullable = false, length = 40)
    String action;

    @Column(nullable = false, length = 400)
    String detail;

    @Column(nullable = false)
    Instant createdAt = Instant.now();

    protected AdminEvent() {}

    AdminEvent(String actor, String action, String detail) {
        this.actor = actor;
        this.action = action;
        this.detail = detail;
    }
}
