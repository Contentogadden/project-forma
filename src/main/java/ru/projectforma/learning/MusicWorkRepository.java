package ru.projectforma.learning;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MusicWorkRepository extends JpaRepository<MusicWork, Long> {
    Optional<MusicWork> findByAccountUsernameAndAssignmentId(String username, String assignmentId);
}
