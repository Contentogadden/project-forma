package ru.projectforma.learning;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.io.IOException;
import java.time.Instant;
import java.util.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import ru.projectforma.account.UserAccountRepository;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/student/study")
public class StudyController {

    private final StudyAttemptRepository attempts;
    private final UserAccountRepository accounts;
    private final ObjectMapper json;
    private final Map<String, Rule> rules;

    public StudyController(
        StudyAttemptRepository attempts,
        UserAccountRepository accounts,
        ObjectMapper json
    ) throws IOException {
        this.attempts = attempts;
        this.accounts = accounts;
        this.json = json;
        try (var input = new ClassPathResource("study-checks.json").getInputStream()) {
            var catalog = json.readValue(input, Rule[].class);
            var loaded = new HashMap<String, Rule>();
            for (var rule : catalog) {
                if (
                    rule.answer() == null ||
                    rule.answer().isEmpty() ||
                    loaded.putIfAbsent(rule.id(), rule) != null
                ) throw new IllegalStateException("Invalid study rule catalog");
            }
            rules = Map.copyOf(loaded);
        }
    }

    @GetMapping("/progress")
    @Transactional(readOnly = true)
    public Progress progress(Authentication auth) {
        return new Progress(attempts.completed(auth.getName()));
    }

    @PostMapping("/check/{id}")
    @Transactional
    public Feedback check(
        @PathVariable String id,
        @Valid @RequestBody Answer submitted,
        Authentication auth
    ) {
        var rule = rules.get(id);
        if (rule == null) throw new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "Unknown study question"
        );
        var actual = submitted.answer();
        boolean unordered = rule.kind().equals("set") || rule.kind().equals("accents");
        int min = rule.kind().equals("notes") ? 60 : 0;
        int max = switch (rule.kind()) {
            case "choice" -> rule.choices() - 1;
            case "set" -> 11;
            case "accents" -> rule.length() - 1;
            case "notes" -> 72;
            default -> throw new IllegalStateException("Unknown study kind");
        };
        if (
            actual.stream().anyMatch(n -> n < min || n > max) ||
            (unordered && new HashSet<>(actual).size() != actual.size()) ||
            (!unordered && actual.size() != rule.answer().size())
        ) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid answer format");
        boolean correct = unordered
            ? new HashSet<>(actual).equals(new HashSet<>(rule.answer()))
            : actual.equals(rule.answer());
        var account = accounts
            .findByUsernameIgnoreCase(auth.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        var now = Instant.now();
        attempts.save(new StudyAttempt(account, id, json.writeValueAsString(actual), correct, now));
        return new Feedback(
            correct,
            correct ? rule.explanation() : "Пока не совпало. " + rule.hint(),
            now
        );
    }

    public record Answer(
        @NotNull @Size(min = 1, max = 32) List<@NotNull @Min(0) @Max(127) Integer> answer
    ) {}

    public record Progress(List<String> completed) {}

    public record Feedback(boolean ok, String text, Instant checkedAt) {}

    public record Rule(
        String id,
        String kind,
        List<Integer> answer,
        String explanation,
        String hint,
        int choices,
        int length
    ) {}
}
