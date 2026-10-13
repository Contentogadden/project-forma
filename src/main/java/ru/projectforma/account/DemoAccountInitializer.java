package ru.projectforma.account;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DemoAccountInitializer implements CommandLineRunner {

    private final UserAccountRepository accounts;
    private final PasswordEncoder encoder;
    private final boolean enabled;
    private final String adminPassword;
    private final String teacherPassword;
    private final String studentPassword;

    public DemoAccountInitializer(
        UserAccountRepository accounts,
        PasswordEncoder encoder,
        @Value("${forma.demo-accounts.enabled:true}") boolean enabled,
        @Value("${forma.demo-accounts.admin-password}") String adminPassword,
        @Value("${forma.demo-accounts.teacher-password}") String teacherPassword,
        @Value("${forma.demo-accounts.student-password}") String studentPassword
    ) {
        this.accounts = accounts;
        this.encoder = encoder;
        this.enabled = enabled;
        this.adminPassword = adminPassword;
        this.teacherPassword = teacherPassword;
        this.studentPassword = studentPassword;
    }

    @Override
    public void run(String... args) {
        if (!enabled) return;
        create("admin", "Администратор Forma", adminPassword, Role.ADMIN);
        create("teacher", "Анна Сергеевна", teacherPassword, Role.TEACHER);
        create("student", "Михаил Орлов", studentPassword, Role.STUDENT);
    }

    private void create(String username, String name, String password, Role role) {
        if (accounts.findByUsernameIgnoreCase(username).isEmpty()) accounts.save(
            new UserAccount(username, name, encoder.encode(password), role)
        );
    }
}
