package ru.projectforma.learning;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AssignmentServiceTest {

    private final AssignmentService service = new AssignmentService();

    @org.junit.jupiter.api.Test
    void catalogHasStableStylePlacementAndKeepsBasicsSeparate() {
        var tasks = service.catalog();
        org.assertj.core.api.Assertions.assertThat(tasks).allSatisfy(t -> {
            org.assertj.core.api.Assertions.assertThat(t.placement()).isNotNull();
            org.assertj.core.api.Assertions.assertThat(t.placement().focus()).isNotBlank();
        });
        var basics = tasks
            .stream()
            .filter(t -> t.placement().periodId().equals("basic"))
            .toList();
        org.assertj.core.api.Assertions.assertThat(basics)
            .hasSize(5)
            .allSatisfy(t ->
                org.assertj.core.api.Assertions.assertThat(t.placement().composerId()).isEqualTo(
                    "forma"
                )
            );
        var motive = tasks
            .stream()
            .filter(t -> t.id().equals("beethoven-motive"))
            .findFirst()
            .orElseThrow();
        org.assertj.core.api.Assertions.assertThat(motive.placement().periodId()).isEqualTo(
            "classical"
        );
        org.assertj.core.api.Assertions.assertThat(motive.placement().composerId()).isEqualTo(
            "beethoven"
        );
        org.assertj.core.api.Assertions.assertThat(motive.composer()).isEqualTo("Л. ван Бетховен");
    }

    @Test
    void providesACompleteCrossEraCatalog() {
        var assignments = service.catalog();
        assertThat(assignments).hasSize(295);
        assertThat(assignments).extracting(Assignment::id).doesNotHaveDuplicates();
        assertThat(assignments).allSatisfy(task -> {
            assertThat(task.material()).isNotBlank();
            assertThat(task.steps()).hasSizeGreaterThanOrEqualTo(3);
            assertThat(task.criteria()).hasSizeGreaterThanOrEqualTo(3);
            assertThat(task.hint()).isNotBlank();
        });
        assertThat(assignments)
            .extracting(Assignment::era)
            .contains("Барокко", "Классицизм", "Романтизм", "Модернизм");
        assertThat(assignments)
            .flatExtracting(Assignment::aspects)
            .contains("Мелодия", "Гармония", "Ритм", "Форма", "Тембр");
    }

    @Test
    void everyComposerHasAtLeastFourStyleExercises() {
        var groups = service
            .catalog()
            .stream()
            .filter(t -> !t.placement().composerId().equals("forma"))
            .collect(java.util.stream.Collectors.groupingBy(t -> t.placement().composerId()));
        assertThat(groups).hasSize(54);
        groups.forEach((id, tasks) ->
            assertThat(tasks.size()).isGreaterThanOrEqualTo(
                java.util.Set.of(
                    "bach",
                    "haydn",
                    "mozart",
                    "beethoven",
                    "schubert",
                    "chopin",
                    "brahms",
                    "debussy",
                    "stravinsky",
                    "webern"
                ).contains(id)
                    ? 4
                    : 2
            )
        );
    }
}
