package ru.projectforma.learning;

import java.util.*;
import tools.jackson.databind.ObjectMapper;

final class GeminiHints {

    static Map<String, Object> payload(String context) {
        return Map.of(
            "systemInstruction",
            Map.of(
                "parts",
                List.of(
                    Map.of(
                        "text",
                        "Ты помощник по слуховой практике взрослых музыкантов. Дай одну краткую подсказку на русском, без правильного ответа. Не оценивай способности. Только музыкальный контекст. До 300 символов. Верни JSON с полем hint."
                    )
                )
            ),
            "contents",
            List.of(Map.of("role", "user", "parts", List.of(Map.of("text", context)))),
            "generationConfig",
            Map.of(
                "temperature",
                0.3,
                "maxOutputTokens",
                512,
                "responseMimeType",
                "application/json",
                "responseSchema",
                Map.of(
                    "type",
                    "OBJECT",
                    "properties",
                    Map.of("hint", Map.of("type", "STRING")),
                    "required",
                    List.of("hint")
                )
            )
        );
    }

    static String parse(String response, ObjectMapper json) {
        var root = json.readTree(response);
        var candidate = root.path("candidates").path(0);
        if (!"STOP".equals(candidate.path("finishReason").asText())) return "";
        StringBuilder text = new StringBuilder();
        for (var part : candidate.path("content").path("parts"))
            if (!part.path("thought").asBoolean(false)) text.append(part.path("text").asText(""));
        if (text.isEmpty()) return "";
        String hint = json.readTree(text.toString()).path("hint").asText("").strip();
        return hint.length() <= 300 ? hint : "";
    }
}
