package ru.projectforma.learning;

import jakarta.validation.Valid;
import java.time.Instant;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import ru.projectforma.account.UserAccountRepository;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/student/music-work")
public class MusicWorkController {

    private static final Set<String> SUPPORTED = Set.of(
        "melody-question",
        "harmony-home",
        "rhythm-shift",
        "form-return",
        "timbre-register",
        "stravinsky-accent",
        "brahms-meter",
        "beethoven-motive",
        "baroque-bass",
        "bach-voices",
        "classical-period",
        "mozart-shadow",
        "schubert-distance",
        "chopin-rubato",
        "debussy-color",
        "webern-space",
        "bach-answer",
        "haydn-close",
        "mozart-turn",
        "beethoven-inversion",
        "schubert-minor",
        "chopin-neighbor",
        "brahms-thirds",
        "debussy-whole-tone",
        "stravinsky-ostinato",
        "webern-retrograde"
    );
    private final MusicWorkRepository works;
    private final UserAccountRepository accounts;
    private final ObjectMapper json;

    public MusicWorkController(
        MusicWorkRepository works,
        UserAccountRepository accounts,
        ObjectMapper json
    ) {
        this.works = works;
        this.accounts = accounts;
        this.json = json;
    }

    private void validateTask(String id) {
        if (
            !SUPPORTED.contains(id) &&
            java.util.stream.Stream.of(
                ListeningPractice.catalog(),
                TransformationPractice.catalog(),
                NewComposerPractice.catalog(),
                ExpandedComposerPractice.catalog(),
                ComposerPaths.catalog()
            )
                .flatMap(java.util.List::stream)
                .noneMatch(task -> task.id().equals(id))
        ) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<SavedWork> read(@PathVariable String id, Authentication auth) {
        validateTask(id);
        return works
            .findByAccountUsernameAndAssignmentId(auth.getName(), id)
            .map(work -> ResponseEntity.ok(view(work)))
            .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/{id}")
    @Transactional
    public SavedWork save(
        @PathVariable String id,
        @Valid @RequestBody MusicState state,
        Authentication auth
    ) {
        validateTask(id);
        var work = works
            .findByAccountUsernameAndAssignmentId(auth.getName(), id)
            .orElseGet(() ->
                new MusicWork(accounts.findByUsernameIgnoreCase(auth.getName()).orElseThrow(), id)
            );
        work.update(json.writeValueAsString(state));
        return view(works.save(work));
    }

    private SavedWork view(MusicWork work) {
        return new SavedWork(json.readValue(work.stateJson(), MusicState.class), work.updatedAt());
    }

    public record SavedWork(MusicState state, Instant updatedAt) {}
}
