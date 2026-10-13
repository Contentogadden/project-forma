package ru.projectforma.classroom;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignedWorkRepository extends JpaRepository<AssignedWork, Long> {
    List<AssignedWork> findByTeacherIdOrderByUpdatedAtDesc(Long id);
    List<AssignedWork> findByStudentIdOrderByUpdatedAtDesc(Long id);
}
