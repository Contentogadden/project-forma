package ru.projectforma.learning;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class PracticeHintTest {

    @Test
    void unconfiguredProviderReturnsHonestLocalHint() {
        var c = new PracticeHintController(new ObjectMapper(), "", "");
        for (var kind : PracticeHintController.Kind.values()) {
            var h = c.hint(
                () -> "student",
                new PracticeHintController.Request(kind, List.of(60, 64), 2)
            );
            assertEquals("local", h.source());
            assertFalse(h.text().isBlank());
        }
    }

    @Test
    void insecureProviderIsNotCalled() {
        var c = new PracticeHintController(new ObjectMapper(), "http://example.invalid", "test");
        assertEquals(
            "local",
            c
                .hint(
                    () -> "student",
                    new PracticeHintController.Request(
                        PracticeHintController.Kind.intervals,
                        List.of(60, 64),
                        2
                    )
                )
                .source()
        );
    }
}
