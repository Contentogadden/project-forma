package ru.projectforma.classroom;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminEventRepository extends JpaRepository<AdminEvent, Long> {
    List<AdminEvent> findTop100ByOrderByIdDesc();
}
