package ru.projectforma.learning;

import jakarta.persistence.*;
import java.time.Instant;
import ru.projectforma.account.UserAccount;

@Entity
@Table(name = "study_attempts", indexes = @Index(columnList = "account_id,question_id"))
public class StudyAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private UserAccount account;

    @Column(name = "question_id", nullable = false, length = 64)
    private String questionId;

    @Column(nullable = false, length = 1000)
    private String answerJson;

    @Column(nullable = false)
    private boolean correct;

    @Column(nullable = false)
    private Instant checkedAt;

    protected StudyAttempt() {}

    StudyAttempt(
        UserAccount account,
        String questionId,
        String answerJson,
        boolean correct,
        Instant checkedAt
    ) {
        this.account = account;
        this.questionId = questionId;
        this.answerJson = answerJson;
        this.correct = correct;
        this.checkedAt = checkedAt;
    }
}
