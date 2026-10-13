package ru.projectforma.classroom;

import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ru.projectforma.account.*;

@Component
public class DemoClassroomInitializer {

    private final UserAccountRepository accounts;
    private final StudyGroupRepository groups;
    private final boolean enabled;

    public DemoClassroomInitializer(
        UserAccountRepository accounts,
        StudyGroupRepository groups,
        @Value("${forma.demo-accounts.enabled:true}") boolean enabled
    ) {
        this.accounts = accounts;
        this.groups = groups;
        this.enabled = enabled;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initialize() {
        if (!enabled || groups.count() != 0) return;
        var teacher = accounts.findByUsernameIgnoreCase("teacher");
        var student = accounts.findByUsernameIgnoreCase("student");
        if (
            teacher.isPresent() &&
            student.isPresent() &&
            teacher.get().getRole() == Role.TEACHER &&
            student.get().getRole() == Role.STUDENT
        ) groups.save(new StudyGroup("Учебная группа", teacher.get(), Set.of(student.get())));
    }
}
