package ru.projectforma.learning;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class GeminiHintsTest {

    @Test
    void parsesOnlyCompletedStructuredHints() {
        var json = new ObjectMapper();
        String hint = json.writeValueAsString(java.util.Map.of("hint", "Спойте нижний звук."));
        String response = json.writeValueAsString(
            java.util.Map.of(
                "candidates",
                java.util.List.of(
                    java.util.Map.of(
                        "finishReason",
                        "STOP",
                        "content",
                        java.util.Map.of("parts", java.util.List.of(java.util.Map.of("text", hint)))
                    )
                )
            )
        );
        assertEquals("Спойте нижний звук.", GeminiHints.parse(response, json));
        assertEquals("", GeminiHints.parse(response.replace("STOP", "MAX_TOKENS"), json));
        assertEquals("", GeminiHints.parse("{}", json));
    }

    @Test
    void requestsJsonWithoutToolsOrIdentity() {
        var p = GeminiHints.payload("{\"kind\":\"intervals\",\"pitches\":[60,64]}");
        assertTrue(p.containsKey("systemInstruction"));
        assertFalse(p.containsKey("tools"));
        assertFalse(p.containsKey("apiKey"));
    }
}
