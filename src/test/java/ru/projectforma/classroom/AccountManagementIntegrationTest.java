package ru.projectforma.classroom;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import ru.projectforma.account.*;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(
    properties = {
        "spring.datasource.url=jdbc:h2:mem:account-admin-test;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
    }
)
@AutoConfigureMockMvc
class AccountManagementIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    @Autowired
    UserAccountRepository accounts;

    private static final String FIRST = "OriginalPassword!123",
        SECOND = "ReplacementPassword!456";

    private ClassroomModels.Person create() throws Exception {
        String username = "test-" + UUID.randomUUID().toString().substring(0, 8);
        String body = json.writeValueAsString(
            new ClassroomModels.CreateUser(username, "Учебный аккаунт", FIRST, Role.STUDENT)
        );
        String response = mvc
            .perform(
                post("/api/classroom/users")
                    .with(user("admin"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body)
            )
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
        return json.readValue(response, ClassroomModels.Person.class);
    }

    private MockHttpSession login(String username, String password) throws Exception {
        return (MockHttpSession) mvc
            .perform(
                post("/api/auth/login")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            new ru.projectforma.security.AuthController.LoginRequest(
                                username,
                                password
                            )
                        )
                    )
            )
            .andExpect(status().isOk())
            .andReturn()
            .getRequest()
            .getSession(false);
    }

    private ClassroomModels.Person update(ClassroomModels.Person p, Role role, boolean enabled)
        throws Exception {
        String response = mvc
            .perform(
                put("/api/classroom/users/" + p.id())
                    .with(user("admin"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            new ClassroomModels.UpdateUser(
                                p.version(),
                                p.displayName(),
                                role,
                                enabled
                            )
                        )
                    )
            )
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
        return json.readValue(response, ClassroomModels.Person.class);
    }

    @Test
    void blockingRevokesExistingSessionsAndReenablingDoesNotRestoreOldSession() throws Exception {
        var p = create();
        var session = login(p.username(), FIRST);
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk());
        var blocked = update(p, Role.STUDENT, false);
        assertFalse(blocked.enabled());
        mvc.perform(get("/api/student/music-work/melody-question").session(session)).andExpect(
            status().isUnauthorized()
        );
        assertTrue(session.isInvalid());
        mvc.perform(
            post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ru.projectforma.security.AuthController.LoginRequest(
                            p.username(),
                            FIRST
                        )
                    )
                )
        ).andExpect(status().isUnauthorized());
        var active = update(blocked, Role.STUDENT, true);
        assertTrue(active.enabled());
        assertNotNull(login(p.username(), FIRST));
    }

    @Test
    void passwordResetAndRoleChangeRevokeSessionsAndNeverExposePasswords() throws Exception {
        var p = create();
        var session = login(p.username(), FIRST);
        String response = mvc
            .perform(
                post("/api/classroom/users/" + p.id() + "/password")
                    .with(user("admin"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            new ClassroomModels.ResetPassword(p.version(), SECOND)
                        )
                    )
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.password").doesNotExist())
            .andExpect(jsonPath("$.passwordHash").doesNotExist())
            .andReturn()
            .getResponse()
            .getContentAsString();
        var reset = json.readValue(response, ClassroomModels.Person.class);
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isUnauthorized());
        mvc.perform(
            post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ru.projectforma.security.AuthController.LoginRequest(
                            p.username(),
                            FIRST
                        )
                    )
                )
        ).andExpect(status().isUnauthorized());
        var nextSession = login(p.username(), SECOND);
        var promoted = update(reset, Role.TEACHER, true);
        assertEquals(Role.TEACHER, promoted.role());
        mvc.perform(get("/api/classroom/templates").session(nextSession)).andExpect(
            status().isUnauthorized()
        );
        mvc.perform(get("/api/classroom/templates").session(login(p.username(), SECOND))).andExpect(
            status().isOk()
        );
        String audit = mvc
            .perform(get("/api/classroom/audit").with(user("admin")))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
        assertTrue(audit.contains("PASSWORD_RESET"));
        assertFalse(audit.contains(SECOND));
        assertFalse(audit.contains(FIRST));
        assertFalse(audit.contains("$2a$"));
    }

    @Test
    void rejectsNonAdminEditsStaleUpdatesAndLossOfOwnOrBoundRole() throws Exception {
        var p = create();
        var body = new ClassroomModels.UpdateUser(p.version(), "Другое имя", Role.STUDENT, true);
        mvc.perform(
            put("/api/classroom/users/" + p.id())
                .with(user("teacher"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body))
        ).andExpect(status().isForbidden());
        mvc.perform(
            post("/api/classroom/users/" + p.id() + "/password")
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(new ClassroomModels.ResetPassword(p.version(), SECOND))
                )
        ).andExpect(status().isForbidden());
        update(p, Role.STUDENT, false);
        mvc.perform(
            put("/api/classroom/users/" + p.id())
                .with(user("admin"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body))
        ).andExpect(status().isConflict());
        var admin = accounts.findByUsernameIgnoreCase("admin").orElseThrow();
        mvc.perform(
            put("/api/classroom/users/" + admin.getId())
                .with(user("admin"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ClassroomModels.UpdateUser(
                            admin.getVersion(),
                            admin.getDisplayName(),
                            Role.ADMIN,
                            false
                        )
                    )
                )
        ).andExpect(status().isBadRequest());
        var teacher = accounts.findByUsernameIgnoreCase("teacher").orElseThrow();
        mvc.perform(
            put("/api/classroom/users/" + teacher.getId())
                .with(user("admin"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ClassroomModels.UpdateUser(
                            teacher.getVersion(),
                            teacher.getDisplayName(),
                            Role.STUDENT,
                            true
                        )
                    )
                )
        ).andExpect(status().isConflict());
        mvc.perform(get("/api/classroom/audit").with(user("student"))).andExpect(
            status().isForbidden()
        );
    }
}
