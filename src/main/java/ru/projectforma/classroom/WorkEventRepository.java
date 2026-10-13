package ru.projectforma.classroom;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkEventRepository extends JpaRepository<WorkEvent, Long> {
    List<WorkEvent> findByWorkIdOrderByIdAsc(Long id);
}
