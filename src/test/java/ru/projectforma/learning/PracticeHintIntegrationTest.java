package ru.projectforma.learning;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
    properties = {
        "spring.datasource.url=jdbc:h2:mem:hint-test;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "forma.ai.hint-url=",
    }
)
@AutoConfigureMockMvc
class PracticeHintIntegrationTest {

    @Autowired
    MockMvc mvc;

    private final String body = "{\"kind\":\"intervals\",\"pitches\":[60,64],\"errors\":2}";

    @Test
    void hintsRequireSessionAndCsrfAndRejectInvalidPitches() throws Exception {
        mvc.perform(
            post("/api/student/practice/hint")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
        ).andExpect(status().isUnauthorized());
        mvc.perform(
            post("/api/student/practice/hint")
                .with(user("student"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
        ).andExpect(status().isForbidden());
        mvc.perform(
            post("/api/student/practice/hint")
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.source").value("local"));
        mvc.perform(
            post("/api/student/practice/hint")
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body.replace("60,64", "999,64"))
        ).andExpect(status().isBadRequest());
    }
}
