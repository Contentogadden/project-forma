package ru.projectforma.classroom;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ru.projectforma.account.*;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(
    properties = {
        "spring.datasource.url=jdbc:h2:mem:classroom-test;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
    }
)
@AutoConfigureMockMvc
class ClassroomIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    @Autowired
    UserAccountRepository accounts;

    @Autowired
    StudyGroupRepository groups;

    private MelodyDefinition definition() {
        return new MelodyDefinition(
            "Вопрос и ответ",
            "Допишите окончание",
            "Сравните с образцом",
            90,
            List.of(60, 62, 64, 67, 64, 62, 0, 0),
            List.of(60, 62, 64, 67, 64, 62, 64, 62),
            List.of(6, 7),
            List.of(60, 62, 64, 65, 67),
            60
        );
    }

    private ClassroomModels.TemplateView create() throws Exception {
        String result = mvc
            .perform(
                post("/api/classroom/templates")
                    .with(user("teacher").roles("TEACHER"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(definition()))
            )
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
        return json.readValue(result, ClassroomModels.TemplateView.class);
    }

    private ClassroomModels.WorkView sendAnswer(
        ClassroomModels.WorkView w,
        List<Integer> notes,
        boolean submit
    ) throws Exception {
        String response = mvc
            .perform(
                put("/api/classroom/works/" + w.id() + "/answer")
                    .with(user("student"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            new ClassroomModels.AnswerBody(w.version(), notes, submit)
                        )
                    )
            )
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
        return json.readValue(response, ClassroomModels.WorkView.class);
    }

    @Test
    void completeMelodyWorkflowPreservesIssuedSnapshotAndSubmissionHistory() throws Exception {
        var t = create();
        var student = accounts.findByUsernameIgnoreCase("student").orElseThrow();
        String result = mvc
            .perform(
                post("/api/classroom/templates/" + t.id() + "/assign")
                    .with(user("teacher"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            new ClassroomModels.AssignBody(
                                t.version(),
                                Set.of(student.getId()),
                                null
                            )
                        )
                    )
            )
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
        var w = json.readValue(result, ClassroomModels.WorkView[].class)[0];
        assertEquals(AssignedWork.Status.NOT_STARTED, w.status());
        var original = definition();
        var changed = new MelodyDefinition(
            "Изменённый шаблон",
            original.instruction(),
            original.hint(),
            100,
            original.initial(),
            original.reference(),
            original.editable(),
            original.allowed(),
            60
        );
        mvc.perform(
            put("/api/classroom/templates/" + t.id())
                .with(user("teacher"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ClassroomModels.UpdateTemplate(t.version(), changed)
                    )
                )
        ).andExpect(status().isOk());
        mvc.perform(
            put("/api/classroom/templates/" + t.id())
                .with(user("teacher"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ClassroomModels.UpdateTemplate(t.version(), changed)
                    )
                )
        ).andExpect(status().isConflict());
        var answer = List.of(60, 62, 64, 67, 64, 62, 62, 60);
        var checkBody = json.writeValueAsString(
            new ClassroomModels.AnswerBody(w.version(), answer, false)
        );
        mvc.perform(
            post("/api/classroom/works/" + w.id() + "/check")
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(checkBody)
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.passed").value(true));
        mvc.perform(
            post("/api/classroom/works/" + w.id() + "/check")
                .with(user("student"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(checkBody)
        ).andExpect(status().isForbidden());
        mvc.perform(get("/api/classroom/works").with(user("student"))).andExpect(
            jsonPath("$[?(@.id == " + w.id() + ")].status").value(
                org.hamcrest.Matchers.hasItem("NOT_STARTED")
            )
        );
        var draft = sendAnswer(w, answer, false);
        assertEquals(AssignedWork.Status.DRAFT, draft.status());
        assertTrue(draft.history().isEmpty());
        assertEquals("Вопрос и ответ", draft.definition().title());
        assertEquals(90, draft.definition().tempo());
        mvc.perform(
            put("/api/classroom/works/" + w.id() + "/answer")
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ClassroomModels.AnswerBody(w.version(), answer, true)
                    )
                )
        ).andExpect(status().isConflict());
        var submitted = sendAnswer(draft, answer, true);
        assertEquals(AssignedWork.Status.SUBMITTED, submitted.status());
        assertEquals(1, submitted.history().size());
        mvc.perform(
            put("/api/classroom/works/" + w.id() + "/answer")
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ClassroomModels.AnswerBody(submitted.version(), answer, false)
                    )
                )
        ).andExpect(status().isConflict());
        String review = mvc
            .perform(
                post("/api/classroom/works/" + w.id() + "/review")
                    .with(user("teacher"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            new ClassroomModels.ReviewBody(
                                submitted.version(),
                                AssignedWork.Status.REVISION,
                                "Попробуйте ми перед до"
                            )
                        )
                    )
            )
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
        var returned = json.readValue(review, ClassroomModels.WorkView.class);
        assertEquals(2, returned.history().size());
        var revised = sendAnswer(returned, List.of(60, 62, 64, 67, 64, 62, 64, 60), true);
        assertEquals(answer, revised.history().getFirst().notes());
        assertEquals(3, revised.history().size());
        mvc.perform(
            post("/api/classroom/works/" + w.id() + "/review")
                .with(user("teacher"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ClassroomModels.ReviewBody(
                            revised.version(),
                            AssignedWork.Status.ACCEPTED,
                            "Принято"
                        )
                    )
                )
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ACCEPTED"))
            .andExpect(jsonPath("$.history.length()").value(4));
    }

    @Test
    void enforcesRolesOwnershipCsrfAndMusicalConstraints() throws Exception {
        mvc.perform(get("/api/classroom/works")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/classroom/users").with(user("student").roles("ADMIN"))).andExpect(
            status().isForbidden()
        );
        mvc.perform(
            post("/api/classroom/templates")
                .with(user("teacher"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(definition()))
        ).andExpect(status().isForbidden());
        mvc.perform(
            post("/api/classroom/templates")
                .with(user("student"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(definition()))
        ).andExpect(status().isForbidden());
        var outsider = accounts.save(
            new UserAccount("outsider", "Другой ученик", "not-used", Role.STUDENT)
        );
        accounts.save(new UserAccount("other-teacher", "Другой учитель", "not-used", Role.TEACHER));
        var t = create();
        mvc.perform(
            post("/api/classroom/templates/" + t.id() + "/assign")
                .with(user("teacher"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ClassroomModels.AssignBody(t.version(), Set.of(outsider.getId()), null)
                    )
                )
        ).andExpect(status().isForbidden());
        mvc.perform(
            put("/api/classroom/templates/" + t.id())
                .with(user("other-teacher"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ClassroomModels.UpdateTemplate(t.version(), definition())
                    )
                )
        ).andExpect(status().isNotFound());
        var student = accounts.findByUsernameIgnoreCase("student").orElseThrow();
        String result = mvc
            .perform(
                post("/api/classroom/templates/" + t.id() + "/assign")
                    .with(user("teacher"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            new ClassroomModels.AssignBody(
                                t.version(),
                                Set.of(student.getId()),
                                null
                            )
                        )
                    )
            )
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
        var w = json.readValue(result, ClassroomModels.WorkView[].class)[0];
        mvc.perform(get("/api/classroom/works").with(user("outsider"))).andExpect(
            jsonPath("$.length()").value(0)
        );
        mvc.perform(get("/api/classroom/works").with(user("other-teacher"))).andExpect(
            jsonPath("$.length()").value(0)
        );
        for (var invalid : List.of(
            List.of(72, 62, 64, 67, 64, 62, 62, 60),
            List.of(60, 62, 64, 67, 64, 62, 84, 60),
            List.of(60, 62, 64, 67, 64, 62, 0, 0)
        ))
            mvc.perform(
                put("/api/classroom/works/" + w.id() + "/answer")
                    .with(user("student"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            new ClassroomModels.AnswerBody(w.version(), invalid, true)
                        )
                    )
            ).andExpect(status().isBadRequest());
        mvc.perform(
            put("/api/classroom/works/" + w.id() + "/answer")
                .with(user("outsider"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ClassroomModels.AnswerBody(w.version(), definition().initial(), false)
                    )
                )
        ).andExpect(status().isNotFound());
        mvc.perform(
            post("/api/classroom/works/" + w.id() + "/review")
                .with(user("other-teacher"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ClassroomModels.ReviewBody(
                            w.version(),
                            AssignedWork.Status.ACCEPTED,
                            "Нет"
                        )
                    )
                )
        ).andExpect(status().isNotFound());
    }

    @Test
    void adminCreatesAccountsAndMaintainsGroupMembershipWithoutPasswordLeaks() throws Exception {
        var body = new ClassroomModels.CreateUser(
            "new.student",
            "Новый ученик",
            "LongPassword!123",
            Role.STUDENT
        );
        String result = mvc
            .perform(
                post("/api/classroom/users")
                    .with(user("admin"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(body))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.passwordHash").doesNotExist())
            .andReturn()
            .getResponse()
            .getContentAsString();
        var p = json.readValue(result, ClassroomModels.Person.class);
        assertNotEquals(body.password(), accounts.findById(p.id()).orElseThrow().getPasswordHash());
        mvc.perform(
            post("/api/classroom/users")
                .with(user("admin"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body))
        ).andExpect(status().isConflict());
        var teacher = accounts.findByUsernameIgnoreCase("teacher").orElseThrow();
        var g = new ClassroomModels.GroupBody("Новая группа", teacher.getId(), Set.of(p.id()));
        String created = mvc
            .perform(
                post("/api/classroom/groups")
                    .with(user("admin"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(g))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.students[0].id").value(p.id()))
            .andReturn()
            .getResponse()
            .getContentAsString();
        var group = json.readValue(created, ClassroomModels.GroupView.class);
        mvc.perform(
            put("/api/classroom/groups/" + group.id())
                .with(user("teacher"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(g))
        ).andExpect(status().isForbidden());
        mvc.perform(
            put("/api/classroom/groups/" + group.id())
                .with(user("admin"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    json.writeValueAsString(
                        new ClassroomModels.GroupBody("Новая группа", teacher.getId(), Set.of())
                    )
                )
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.students.length()").value(0));
    }

    @Test
    void allowsFixedRestsInMotiveWhileRequiringEditableResponseNotes() throws Exception {
        var d = new MelodyDefinition(
            "Мотив на новой высоте",
            "Перенесите мотив",
            "Сравните два тона",
            90,
            List.of(60, 62, 64, 0, 0, 0, 0, 0),
            List.of(60, 62, 64, 0, 60, 62, 64, 0),
            List.of(4, 5, 6),
            List.of(60, 62, 64, 65, 66, 67, 69, 71, 72),
            0
        );
        String created = mvc
            .perform(
                post("/api/classroom/templates")
                    .with(user("teacher"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json.writeValueAsString(d))
            )
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
        var t = json.readValue(created, ClassroomModels.TemplateView.class);
        var student = accounts.findByUsernameIgnoreCase("student").orElseThrow();
        String assigned = mvc
            .perform(
                post("/api/classroom/templates/" + t.id() + "/assign")
                    .with(user("teacher"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        json.writeValueAsString(
                            new ClassroomModels.AssignBody(
                                t.version(),
                                Set.of(student.getId()),
                                null
                            )
                        )
                    )
            )
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
        var w = json.readValue(assigned, ClassroomModels.WorkView[].class)[0];
        var submitted = sendAnswer(w, List.of(60, 62, 64, 0, 62, 64, 66, 0), true);
        assertEquals(AssignedWork.Status.SUBMITTED, submitted.status());
        assertEquals(0, submitted.notes().get(7));
    }
}
