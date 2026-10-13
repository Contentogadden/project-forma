package ru.projectforma.learning;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/student/practice")
public class PracticeHintController {

    public enum Kind {
        notes,
        intervals,
        chords,
        memory,
    }

    public record Request(
        @NotNull Kind kind,
        @NotNull @Size(min = 1, max = 8) List<@NotNull @Min(48) @Max(84) Integer> pitches,
        @Min(0) @Max(20) int errors,
        Boolean adultConsent
    ) {
        public Request(Kind kind, List<Integer> pitches, int errors) {
            this(kind, pitches, errors, false);
        }
    }

    public record Hint(String text, String source) {}

    public static String fallback(Kind kind) {
        return switch (kind) {
            case notes -> "Найдите ближайшую линию: на нижней линии — ми. Соседние ноты чередуют линию и промежуток. Считайте от неё вверх или вниз.";
            case intervals -> "Спойте нижний звук, затем верхний. Сравните расстояние: соседние ступени, скачок или октава. Прослушайте ещё раз медленнее.";
            case chords -> "Сосредоточьтесь на средней ноте аккорда. Сравните нижнюю терцию: в минорном трезвучии она уже, чем в мажорном.";
            case memory -> "Спойте первую фразу. Во второй сравнивайте ноты по очереди: первая с первой, вторая со второй. Не пытайтесь удержать сразу всю фразу.";
        };
    }

    private final String endpoint;
    private final String token;
    private final PracticeHintGateway gateway;

    @Autowired(required = false)
    private AiSettings settings;

    @Value("${GEMINI_API_KEY:}")
    private String geminiKey = "";

    @Value("${forma.ai.gemini-model:gemini-2.5-flash-lite}")
    private String geminiModel = "gemini-2.5-flash-lite";

    private final Semaphore slots = new Semaphore(2);
    private final Map<String, Long> lastCall = new ConcurrentHashMap<>();

    public PracticeHintController(
        ObjectMapper json,
        @Value("${forma.ai.hint-url:}") String endpoint,
        @Value("${forma.ai.token:}") String token
    ) {
        this.gateway = new PracticeHintGateway(json);
        this.endpoint = endpoint;
        this.token = token;
    }

    @PostMapping("/hint")
    public Hint hint(Principal principal, @Valid @RequestBody Request request) {
        Hint local = new Hint(fallback(request.kind()), "local");
        var credentials = settings == null ? null : settings.credentials();
        AiSettings.Provider provider =
            credentials == null ? AiSettings.Provider.GEMINI : credentials.provider();
        String apiKey = credentials == null ? geminiKey : credentials.key();
        String model = credentials == null ? geminiModel : credentials.model();
        if (credentials != null && !credentials.enabled()) return local;
        if (provider == AiSettings.Provider.GROQ && apiKey.isBlank()) return local;
        if (!Boolean.TRUE.equals(request.adultConsent())) return local;
        if (apiKey.isBlank() && (endpoint.isBlank() || token.isBlank())) return local;
        if (!allowRequest(principal.getName())) return local;
        if (!slots.tryAcquire()) return local;
        try {
            String text = gateway.request(provider, apiKey, model, endpoint, token, request);
            if (text.isBlank() || text.length() > 300) return local;
            return new Hint(text, "ai");
        } catch (Exception exception) {
            if (exception instanceof InterruptedException) Thread.currentThread().interrupt();
            return local;
        } finally {
            slots.release();
        }
    }

    private boolean allowRequest(String username) {
        long now = System.currentTimeMillis();
        lastCall.entrySet().removeIf(entry -> now - entry.getValue() > 60000);
        if (lastCall.size() > 1000) return false;
        Long before = lastCall.putIfAbsent(username, now);
        if (before != null && now - before < 10000) return false;
        lastCall.put(username, now);
        return true;
    }
}
