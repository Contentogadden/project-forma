package ru.projectforma.learning;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import ru.projectforma.account.*;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/admin/ai-settings")
public class AiSettingsController {

    public record Update(
        String key,
        @NotNull Boolean enabled,
        @NotBlank @Size(max = 90) String model,
        AiSettings.Provider provider
    ) {
        @Override
        public String toString() {
            return "Update[key=REDACTED, enabled=" + enabled + ", model=" + model + "]";
        }
    }

    public record Connection(boolean connected, String message) {}

    private final AiSettings settings;
    private final UserAccountRepository accounts;
    private final ObjectMapper json;
    private final HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(3))
        .followRedirects(HttpClient.Redirect.NEVER)
        .build();
    private long lastTest;

    public AiSettingsController(
        AiSettings settings,
        UserAccountRepository accounts,
        ObjectMapper json
    ) {
        this.settings = settings;
        this.accounts = accounts;
        this.json = json;
    }

    private void admin(Authentication auth) {
        if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        var a = accounts
            .findByUsernameIgnoreCase(auth.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        if (!a.isEnabled() || a.getRole() != Role.ADMIN) throw new ResponseStatusException(
            HttpStatus.FORBIDDEN
        );
    }

    @GetMapping
    public AiSettings.Status status(Authentication auth) {
        admin(auth);
        return settings.status();
    }

    @PutMapping
    public AiSettings.Status save(Authentication auth, @Valid @RequestBody Update body) {
        admin(auth);
        try {
            return settings.save(body.key(), body.enabled(), body.model(), body.provider());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Проверьте ключ и модель.");
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Не удалось сохранить настройки."
            );
        }
    }

    @DeleteMapping
    public AiSettings.Status clear(Authentication auth) {
        admin(auth);
        try {
            return settings.clear();
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    @PostMapping("/test")
    public Connection test(Authentication auth) {
        admin(auth);
        var credentials = settings.credentials();
        String key = credentials.key(),
            model = credentials.model();
        boolean groq = credentials.provider() == AiSettings.Provider.GROQ;
        String name = groq ? "Groq" : "Gemini";
        if (key.isBlank()) return new Connection(false, "Сначала сохраните ключ.");
        synchronized (this) {
            long now = System.currentTimeMillis();
            if (now - lastTest < 10000) return new Connection(
                false,
                "Подождите 10 секунд перед повторной проверкой."
            );
            lastTest = now;
        }
        try {
            if (!AiSettings.validModel(credentials.provider(), model)) return new Connection(
                false,
                "Проверьте название модели."
            );
            var body = Map.of(
                "contents",
                java.util.List.of(Map.of("parts", java.util.List.of(Map.of("text", "Reply OK.")))),
                "generationConfig",
                Map.of("maxOutputTokens", 16)
            );
            var request = groq
                ? GroqHints.request(
                      key,
                      model,
                      "Проверка подключения: верни короткую подсказку о прослушивании.",
                      json
                  )
                : HttpRequest.newBuilder(
                      URI.create(
                          "https://generativelanguage.googleapis.com/v1beta/models/" +
                              model +
                              ":generateContent"
                      )
                  )
                      .timeout(Duration.ofSeconds(6))
                      .header("Content-Type", "application/json")
                      .header("x-goog-api-key", key)
                      .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)))
                      .build();
            var response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
            try (var input = response.body()) {
                byte[] bytes = input.readNBytes(8193);
                String responseBody = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
                if (
                    response.statusCode() == 200 &&
                    bytes.length <= 8192 &&
                    (groq
                        ? !GroqHints.parse(responseBody, json).isBlank()
                        : json.readTree(responseBody).path("candidates").size() > 0)
                ) return new Connection(true, name + " подключён.");
            }
            return new Connection(
                false,
                switch (response.statusCode()) {
                    case 400, 401, 403 -> "Ключ или доступ отклонён " +
                        name +
                        ". Проверьте ключ, модель и доступность API в регионе.";
                    case 404 -> "Модель недоступна. Проверьте её название.";
                    case 429 -> "Квота " + name + " исчерпана. Попробуйте позже.";
                    default -> name + " не подтвердил подключение. Попробуйте позже.";
                }
            );
        } catch (Exception e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            return new Connection(
                false,
                "Нет корректного ответа от " + name + ". Проверьте доступ к сети."
            );
        }
    }
}
