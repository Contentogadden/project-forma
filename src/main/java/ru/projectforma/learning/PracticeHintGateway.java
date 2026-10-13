package ru.projectforma.learning;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import tools.jackson.databind.ObjectMapper;

final class PracticeHintGateway {

    private final ObjectMapper json;
    private final HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2))
        .followRedirects(HttpClient.Redirect.NEVER)
        .build();

    PracticeHintGateway(ObjectMapper json) {
        this.json = json;
    }

    String request(
        AiSettings.Provider provider,
        String apiKey,
        String model,
        String endpoint,
        String token,
        PracticeHintController.Request exercise
    ) throws Exception {
        String context = json.writeValueAsString(
            Map.of(
                "kind",
                exercise.kind(),
                "pitches",
                exercise.pitches(),
                "errors",
                exercise.errors()
            )
        );
        if (provider == AiSettings.Provider.GROQ) return groq(apiKey, model, context);
        if (!apiKey.isBlank()) return gemini(apiKey, model, context);
        return privateProvider(endpoint, token, exercise);
    }

    private String groq(String apiKey, String model, String context) throws Exception {
        if (!AiSettings.validModel(AiSettings.Provider.GROQ, model)) return "";
        HttpRequest request = GroqHints.request(apiKey, model, context, json);
        var response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
        try (var input = response.body()) {
            byte[] bytes = input.readNBytes(8193);
            if (response.statusCode() != 200 || bytes.length > 8192) return "";
            return GroqHints.parse(new String(bytes, StandardCharsets.UTF_8), json);
        }
    }

    private String gemini(String apiKey, String model, String context) throws Exception {
        if (!model.matches("gemini-[a-zA-Z0-9.-]+")) return "";
        URI uri = URI.create(
            "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent"
        );
        HttpRequest request = requestBuilder(uri)
            .header("x-goog-api-key", apiKey)
            .POST(
                HttpRequest.BodyPublishers.ofString(
                    json.writeValueAsString(GeminiHints.payload(context))
                )
            )
            .build();
        String body = responseBody(request);
        if (body.isEmpty()) return "";
        return GeminiHints.parse(body, json);
    }

    private String privateProvider(
        String endpoint,
        String token,
        PracticeHintController.Request exercise
    ) throws Exception {
        URI uri = URI.create(endpoint);
        if (!"https".equals(uri.getScheme())) return "";
        var payload = Map.of(
            "instruction",
            "Дай одну короткую музыкальную подсказку на русском, не называя правильный ответ. Не оценивай талант ученика. Используй только эти ноты и вид упражнения. Максимум 300 символов. Верни JSON {hint: string}.",
            "exercise",
            exercise
        );
        HttpRequest request = requestBuilder(uri)
            .header("Authorization", "Bearer " + token)
            .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(payload)))
            .build();
        String body = responseBody(request);
        if (body.isEmpty()) return "";
        return json.readTree(body).path("hint").asText("").strip();
    }

    private HttpRequest.Builder requestBuilder(URI uri) {
        return HttpRequest.newBuilder(uri)
            .timeout(Duration.ofSeconds(4))
            .header("Content-Type", "application/json");
    }

    private String responseBody(HttpRequest request) throws Exception {
        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200 || response.body().length() > 8192) return "";
        return response.body();
    }
}
