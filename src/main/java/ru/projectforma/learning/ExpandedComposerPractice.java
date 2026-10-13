package ru.projectforma.learning;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.springframework.core.io.ClassPathResource;
import tools.jackson.databind.ObjectMapper;

final class ExpandedComposerPractice {

    private static final Catalog DATA = load();
    private static final List<Assignment> TASKS = DATA.composers()
        .stream()
        .flatMap(c -> {
            var era = DATA.periods().get(c.periodId());
            var p = c.practice();
            var l = c.listening();
            return Stream.of(
                ComposerPractice.task(
                    p.id(),
                    p.title(),
                    c.periodId(),
                    era,
                    c.id(),
                    c.name(),
                    "Мелодия",
                    p.focus(),
                    p.goal(),
                    p.hint()
                ),
                ListeningPractice.task(
                    l.id(),
                    l.title(),
                    c.periodId(),
                    era,
                    c.id(),
                    c.name(),
                    l.aspect(),
                    l.focus(),
                    l.goal(),
                    l.hint()
                )
            );
        })
        .toList();

    static List<Assignment> catalog() {
        return TASKS;
    }

    static Catalog data() {
        return DATA;
    }

    private static Catalog load() {
        try (
            var input = new ClassPathResource("catalog/expanded-composers.json").getInputStream()
        ) {
            var catalog = new ObjectMapper().readValue(input, Catalog.class);
            if (catalog.schemaVersion() != 1) throw new IllegalStateException(
                "Unsupported composer catalog version"
            );
            return catalog;
        } catch (IOException e) {
            throw new IllegalStateException("Cannot load composer catalog", e);
        }
    }

    record Catalog(int schemaVersion, Map<String, String> periods, List<Composer> composers) {}

    record Composer(
        String id,
        String name,
        String periodId,
        String years,
        String article,
        String gesture,
        Practice practice,
        Listening listening
    ) {}

    record Practice(
        String id,
        String title,
        String focus,
        String goal,
        String hint,
        List<Integer> notes,
        List<Integer> editable
    ) {}

    record Listening(
        String id,
        String kind,
        String title,
        String focus,
        String goal,
        String hint,
        String aspect
    ) {}
}
