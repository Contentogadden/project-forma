package ru.projectforma.learning;

import java.net.URI;
import java.net.http.HttpRequest;
import java.time.Duration;
import java.util.*;
import tools.jackson.databind.ObjectMapper;

final class GroqHints {

    static final String ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

    static Map<String, Object> payload(String model, String context) {
        return Map.of(
            "model",
            model,
            "messages",
            List.of(
                Map.of(
                    "role",
                    "system",
                    "content",
                    "Помоги взрослому музыканту: одна подсказка по упражнению на русском, без правильного ответа и оценки способностей. До 300 символов. Верни JSON с полем hint."
                ),
                Map.of("role", "user", "content", context)
            ),
            "max_completion_tokens",
            512,
            "reasoning_effort",
            "low",
            "response_format",
            Map.of(
                "type",
                "json_schema",
                "json_schema",
                Map.of(
                    "name",
                    "music_hint",
                    "strict",
                    true,
                    "schema",
                    Map.of(
                        "type",
                        "object",
                        "properties",
                        Map.of("hint", Map.of("type", "string")),
                        "required",
                        List.of("hint"),
                        "additionalProperties",
                        false
                    )
                )
            )
        );
    }

    static HttpRequest request(String key, String model, String context, ObjectMapper json) {
        return HttpRequest.newBuilder(URI.create(ENDPOINT))
            .timeout(Duration.ofSeconds(6))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + key)
            .POST(
                HttpRequest.BodyPublishers.ofString(
                    json.writeValueAsString(payload(model, context))
                )
            )
            .build();
    }

    static String parse(String body, ObjectMapper json) {
        var choice = json.readTree(body).path("choices").path(0);
        if (!"stop".equals(choice.path("finish_reason").asText())) return "";
        var message = choice.path("message");
        if (
            !message.path("refusal").isMissingNode() && !message.path("refusal").isNull()
        ) return "";
        String content = message.path("content").asText("");
        if (content.isBlank()) return "";
        String text = json.readTree(content).path("hint").asText("").strip();
        return text.length() <= 300 ? text : "";
    }
}
