package ru.projectforma.learning;

import static org.assertj.core.api.Assertions.*;

import java.util.Map;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

class GroqHintsTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void sendsStrictJsonAndServerSideBearerKey() {
        var tree = json.readTree(
            json.writeValueAsString(
                GroqHints.payload("openai/gpt-oss-20b", "{\"pitches\":[60,64]}")
            )
        );
        assertThat(
            tree.path("response_format").path("json_schema").path("strict").asBoolean()
        ).isTrue();
        assertThat(tree.path("model").asText()).isEqualTo("openai/gpt-oss-20b");
        assertThat(tree.path("tools").isMissingNode()).isTrue();
        var r = GroqHints.request("dummy-server-key", "openai/gpt-oss-20b", "notes", json);
        assertThat(r.uri().toString())
            .isEqualTo(GroqHints.ENDPOINT)
            .doesNotContain("dummy-server-key");
        assertThat(r.headers().firstValue("Authorization")).contains("Bearer dummy-server-key");
    }

    private String response(String reason, String hint) {
        return json.writeValueAsString(
            Map.of(
                "choices",
                java.util.List.of(
                    Map.of(
                        "finish_reason",
                        reason,
                        "message",
                        Map.of("content", json.writeValueAsString(Map.of("hint", hint)))
                    )
                )
            )
        );
    }

    @Test
    void parsesOnlyCompleteShortHints() {
        assertThat(GroqHints.parse(response("stop", "Сравните нижние звуки."), json)).isEqualTo(
            "Сравните нижние звуки."
        );
        assertThat(GroqHints.parse(response("length", "Обрезанный ответ"), json)).isEmpty();
        assertThat(GroqHints.parse(response("stop", "x".repeat(301)), json)).isEmpty();
        assertThat(GroqHints.parse("{}", json)).isEmpty();
    }
}
