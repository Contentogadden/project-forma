package ru.projectforma.content;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ContentController.class)
@Import({ ContentService.class, ru.projectforma.learning.AssignmentService.class })
@AutoConfigureMockMvc(addFilters = false)
class ContentControllerTest {

    @Autowired
    MockMvc mvc;

    @Test
    void exposesTheLearningModel() throws Exception {
        mvc.perform(get("/api/v1/content/landing"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.epochs.length()").value(4))
            .andExpect(jsonPath("$.aspects.length()").value(5))
            .andExpect(jsonPath("$.composers.length()").value(54))
            .andExpect(
                jsonPath("$.composers[?(@.slug=='handel')].era").value(
                    org.hamcrest.Matchers.contains("Барокко")
                )
            )
            .andExpect(
                jsonPath("$.composers[?(@.slug=='messiaen')].era").value(
                    org.hamcrest.Matchers.contains("Модернизм")
                )
            )
            .andExpect(jsonPath("$.principles.length()").value(3))
            .andExpect(jsonPath("$.taskSeries.length()").value(3));
    }
}
