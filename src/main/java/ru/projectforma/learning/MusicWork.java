package ru.projectforma.learning;

import jakarta.persistence.*;
import java.time.Instant;
import ru.projectforma.account.UserAccount;

@Entity
@Table(
    name = "music_works",
    uniqueConstraints = @UniqueConstraint(columnNames = { "account_id", "assignment_id" })
)
public class MusicWork {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private UserAccount account;

    @Column(name = "assignment_id", nullable = false, length = 64)
    private String assignmentId;

    @Column(nullable = false, length = 6000)
    private String stateJson;

    @Column(nullable = false)
    private Instant updatedAt;

    protected MusicWork() {}

    MusicWork(UserAccount account, String assignmentId) {
        this.account = account;
        this.assignmentId = assignmentId;
    }

    void update(String stateJson) {
        this.stateJson = stateJson;
        this.updatedAt = Instant.now();
    }

    String stateJson() {
        return stateJson;
    }

    Instant updatedAt() {
        return updatedAt;
    }
}
