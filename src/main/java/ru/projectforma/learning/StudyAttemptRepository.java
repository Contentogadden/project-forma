package ru.projectforma.learning;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudyAttemptRepository extends JpaRepository<StudyAttempt, Long> {
    @Query(
        "select distinct a.questionId from StudyAttempt a where lower(a.account.username)=lower(:username) and a.correct=true order by a.questionId"
    )
    List<String> completed(@Param("username") String username);
}
