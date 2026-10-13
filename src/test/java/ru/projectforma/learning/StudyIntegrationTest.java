package ru.projectforma.learning;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(
    properties = {
        "spring.datasource.url=jdbc:h2:mem:study-test;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
    }
)
@AutoConfigureMockMvc
class StudyIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    @Test
    void requiresAuthenticationAndCsrf() throws Exception {
        mvc.perform(get("/api/student/study/progress")).andExpect(status().isUnauthorized());
        mvc.perform(
            post("/api/student/study/check/interval-build")
                .with(user("student"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"answer\":[68]}")
        ).andExpect(status().isForbidden());
    }

    @Test
    void serverChecksAnswersAndKeepsProgressSeparate() throws Exception {
        mvc.perform(
            post("/api/student/study/check/interval-build")
                .with(user("teacher"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"answer\":[67]}")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.ok").value(false));
        mvc.perform(get("/api/student/study/progress").with(user("teacher"))).andExpect(
            jsonPath("$.completed").isEmpty()
        );
        mvc.perform(
            post("/api/student/study/check/interval-build")
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"answer\":[68]}")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.ok").value(true))
            .andExpect(jsonPath("$.checkedAt").exists());
        mvc.perform(get("/api/student/study/progress").with(user("student"))).andExpect(
            jsonPath("$.completed").isArray()
        );
    }

    @Test
    void everyCatalogRuleAcceptsItsAnswerAndRejectsWrongAnswers() throws Exception {
        StudyController.Rule[] rules;
        try (var input = new ClassPathResource("study-checks.json").getInputStream()) {
            rules = json.readValue(input, StudyController.Rule[].class);
        }
        for (var rule : rules) {
            mvc.perform(
                post("/api/student/study/check/" + rule.id())
                    .with(user("student"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(new StudyController.Answer(rule.answer())))
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));
            var wrong = new java.util.ArrayList<>(rule.answer());
            if (rule.kind().equals("choice")) wrong.set(0, (wrong.get(0) + 1) % rule.choices());
            else if (rule.kind().equals("notes")) wrong.set(
                0,
                wrong.get(0) == 72 ? 71 : wrong.get(0) + 1
            );
            else {
                int limit = rule.kind().equals("set") ? 12 : rule.length();
                for (int n = 0; n < limit; n++) if (!wrong.contains(n)) {
                    wrong.add(n);
                    break;
                }
            }
            mvc.perform(
                post("/api/student/study/check/" + rule.id())
                    .with(user("student"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(new StudyController.Answer(wrong)))
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(false));
        }
    }

    @Test
    void rejectsUnknownAndMalformedAnswersButAcceptsSetOrder() throws Exception {
        for (String body : java.util.List.of(
            "{}",
            "{\"answer\":[]}",
            "{\"answer\":[null]}",
            "{\"answer\":[128]}",
            "{\"answer\":[2,5,9,9]}"
        ))
            mvc.perform(
                post("/api/student/study/check/pc-transpose")
                    .with(user("student"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body)
            ).andExpect(status().isBadRequest());
        mvc.perform(
            post("/api/student/study/check/missing")
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"answer\":[0]}")
        ).andExpect(status().isNotFound());
        mvc.perform(
            post("/api/student/study/check/pc-transpose")
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"answer\":[9,2,5]}")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.ok").value(true));
    }
}
