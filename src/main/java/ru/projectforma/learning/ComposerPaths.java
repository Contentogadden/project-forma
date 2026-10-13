package ru.projectforma.learning;

import java.io.IOException;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import tools.jackson.databind.ObjectMapper;

final class ComposerPaths {

    private static final List<PathTask> DATA = load();

    static List<PathTask> data() {
        return DATA;
    }

    static List<Assignment> catalog() {
        return DATA.stream()
            .map(p -> {
                var era = ExpandedComposerPractice.data().periods().get(p.periodId());
                return p.kind().equals("recognize")
                    ? ListeningPractice.task(
                          p.id(),
                          p.title(),
                          p.periodId(),
                          era,
                          p.composerId(),
                          p.composer(),
                          p.aspect(),
                          p.focus(),
                          p.goal(),
                          p.hint()
                      )
                    : ComposerPractice.task(
                          p.id(),
                          p.title(),
                          p.periodId(),
                          era,
                          p.composerId(),
                          p.composer(),
                          p.aspect(),
                          p.focus(),
                          p.goal(),
                          p.hint()
                      );
            })
            .toList();
    }

    private static List<PathTask> load() {
        try (var input = new ClassPathResource("catalog/composer-paths.json").getInputStream()) {
            return List.of(new ObjectMapper().readValue(input, PathTask[].class));
        } catch (IOException e) {
            throw new IllegalStateException("Cannot load composer learning paths", e);
        }
    }

    record PathTask(
        String id,
        String kind,
        String title,
        String focus,
        String goal,
        String hint,
        List<Integer> notes,
        List<Integer> reference,
        List<Integer> editable,
        String aspect,
        String composerId,
        String composer,
        String periodId
    ) {}
}
