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
        "spring.datasource.url=jdbc:h2:mem:music-test;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
    }
)
@AutoConfigureMockMvc
class MusicWorkIntegrationTest {

    @Autowired
    MockMvc mvc;

    private static final String URL = "/api/student/music-work/melody-question";
    private static final String STATE = """
    {"version":1,"tempo":100,"notes":[60,62,64,67,64,62,62,60],
     "chords":["C","F","G","C"],"hits":[1,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2],
     "order":["A","B","A′"],"tone":"soft","registerChoice":-1,"heard":[]}
    """;

    @Test
    void savesMusicalEventsAndKeepsAccountsSeparate() throws Exception {
        mvc.perform(get(URL)).andExpect(status().isUnauthorized());
        mvc.perform(
            put(URL).with(user("student")).contentType(MediaType.APPLICATION_JSON).content(STATE)
        ).andExpect(status().isForbidden());
        mvc.perform(
            put(URL)
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(STATE)
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.state.notes[7]").value(60));
        mvc.perform(get(URL).with(user("student")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.state.tempo").value(100))
            .andExpect(jsonPath("$.updatedAt").exists());
        mvc.perform(get(URL).with(user("teacher"))).andExpect(status().isNoContent());
        mvc.perform(
            put(URL)
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(STATE.replace("100", "999"))
        ).andExpect(status().isBadRequest());
        mvc.perform(
            put("/api/student/music-work/unknown")
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(STATE)
        ).andExpect(status().isNotFound());
    }

    @Test
    void supportsEveryNewListeningExerciseAndKeepsAccountsSeparate() throws Exception {
        for (var task : java.util.stream.Stream.of(
            ListeningPractice.catalog(),
            TransformationPractice.catalog(),
            NewComposerPractice.catalog(),
            ExpandedComposerPractice.catalog(),
            ComposerPaths.catalog()
        )
            .flatMap(java.util.List::stream)
            .toList()) {
            String url = "/api/student/music-work/" + task.id();
            String state = STATE.replace(
                "\"registerChoice\":-1,\"heard\":[]",
                "\"registerChoice\":1,\"heard\":[0,1,2]"
            );
            mvc.perform(
                put(url)
                    .with(user("student"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(state)
            ).andExpect(status().isOk());
            mvc.perform(get(url).with(user("student")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state.heard.length()").value(3));
            mvc.perform(get(url).with(user("teacher"))).andExpect(status().isNoContent());
        }
    }

    @Test
    void supportsSavingPracticeForEveryNewComposer() throws Exception {
        for (String id : java.util.List.of(
            "baroque-bass",
            "bach-voices",
            "classical-period",
            "mozart-shadow",
            "schubert-distance",
            "chopin-rubato",
            "debussy-color",
            "webern-space",
            "bach-answer",
            "haydn-close",
            "mozart-turn",
            "beethoven-inversion",
            "schubert-minor",
            "chopin-neighbor",
            "brahms-thirds",
            "debussy-whole-tone",
            "stravinsky-ostinato",
            "webern-retrograde"
        )) {
            String state = STATE.replace(
                "\"registerChoice\":-1,\"heard\":[]",
                "\"registerChoice\":1,\"heard\":[0,1,2]"
            );
            mvc.perform(
                put("/api/student/music-work/" + id)
                    .with(user("student"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(state)
            )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state.registerChoice").value(1));
            mvc.perform(get("/api/student/music-work/" + id).with(user("student")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.state.heard.length()").value(3));
        }
    }
}
