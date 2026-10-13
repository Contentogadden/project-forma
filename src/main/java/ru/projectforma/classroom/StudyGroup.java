package ru.projectforma.classroom;

import jakarta.persistence.*;
import java.util.*;
import ru.projectforma.account.UserAccount;

@Entity
@Table(name = "study_groups")
public class StudyGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, length = 100)
    String name;

    @ManyToOne(optional = false)
    UserAccount teacher;

    @ManyToMany
    Set<UserAccount> students = new HashSet<>();

    protected StudyGroup() {}

    StudyGroup(String name, UserAccount teacher, Set<UserAccount> students) {
        this.name = name;
        this.teacher = teacher;
        this.students = students;
    }
}
