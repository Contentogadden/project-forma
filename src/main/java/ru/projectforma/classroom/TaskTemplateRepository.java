package ru.projectforma.classroom;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskTemplateRepository extends JpaRepository<TaskTemplate, Long> {
    List<TaskTemplate> findByTeacherIdOrderByUpdatedAtDesc(Long teacherId);
}
