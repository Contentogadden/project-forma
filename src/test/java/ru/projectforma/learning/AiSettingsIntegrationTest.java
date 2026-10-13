package ru.projectforma.learning;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.file.Files;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
    properties = {
        "spring.datasource.url=jdbc:h2:mem:ai-settings-test;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
    }
)
@AutoConfigureMockMvc
class AiSettingsIntegrationTest {

    @Autowired
    MockMvc mvc;

    @DynamicPropertySource
    static void settings(DynamicPropertyRegistry r) throws Exception {
        var file = Files.createTempDirectory("forma-ai-test-").resolve("ai.properties");
        r.add("forma.ai.settings-file", file::toString);
    }

    @Test
    void onlyRealAdminsCanManageKeysAndSecretsNeverReturn() throws Exception {
        mvc.perform(get("/api/admin/ai-settings")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/ai-settings").with(user("student").roles("STUDENT"))).andExpect(
            status().isForbidden()
        );
        mvc.perform(get("/api/admin/ai-settings").with(user("teacher").roles("TEACHER"))).andExpect(
            status().isForbidden()
        );
        mvc.perform(get("/api/admin/ai-settings").with(user("student").roles("ADMIN"))).andExpect(
            status().isForbidden()
        );
        String body =
            "{\"key\":\"dummy-key-for-offline-tests-123\",\"enabled\":false,\"model\":\"gemini-2.5-flash-lite\"}";
        mvc.perform(
            put("/api/admin/ai-settings")
                .with(user("admin").roles("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
        ).andExpect(status().isForbidden());
        mvc.perform(
            put("/api/admin/ai-settings")
                .with(user("admin").roles("ADMIN"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.configured").value(true))
            .andExpect(jsonPath("$.key").doesNotExist());
        mvc.perform(get("/api/admin/ai-settings").with(user("admin").roles("ADMIN")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.key").doesNotExist());
        mvc.perform(
            delete("/api/admin/ai-settings").with(user("admin").roles("ADMIN")).with(csrf())
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.configured").value(false));
        mvc.perform(
            post("/api/admin/ai-settings/test").with(user("admin").roles("ADMIN")).with(csrf())
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.connected").value(false));
        String groq =
            "{\"provider\":\"GROQ\",\"key\":\"groq-dummy-key-offline-123\",\"enabled\":false,\"model\":\"openai/gpt-oss-20b\"}";
        mvc.perform(
            put("/api/admin/ai-settings")
                .with(user("admin").roles("ADMIN"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(groq)
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.provider").value("GROQ"))
            .andExpect(jsonPath("$.key").doesNotExist())
            .andExpect(jsonPath("$.groqKey").doesNotExist());
        mvc.perform(
            post("/api/student/practice/hint")
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"kind\":\"intervals\",\"pitches\":[60,64],\"errors\":1,\"adultConsent\":true}"
                )
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.source").value("local"));
        mvc.perform(
            delete("/api/admin/ai-settings").with(user("admin").roles("ADMIN")).with(csrf())
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.configured").value(false));
    }
}
