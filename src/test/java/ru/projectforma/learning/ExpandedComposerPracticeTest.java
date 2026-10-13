package ru.projectforma.learning;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ExpandedComposerPracticeTest {

    @Test
    void sharedCatalogAddsTenComposersAndTwentyTasksToEachEra() {
        var data = ExpandedComposerPractice.data();
        var tasks = ExpandedComposerPractice.catalog();
        assertThat(data.schemaVersion()).isEqualTo(1);
        assertThat(data.composers())
            .hasSize(40)
            .extracting(ExpandedComposerPractice.Composer::id)
            .doesNotHaveDuplicates();
        assertThat(tasks).hasSize(80).extracting(Assignment::id).doesNotHaveDuplicates();
        for (var era : data.periods().keySet()) {
            assertThat(
                data
                    .composers()
                    .stream()
                    .filter(c -> c.periodId().equals(era))
                    .toList()
            ).hasSize(10);
            assertThat(
                tasks
                    .stream()
                    .filter(t -> t.placement().periodId().equals(era))
                    .toList()
            ).hasSize(20);
        }
        for (var c : data.composers()) {
            assertThat(c.practice().notes())
                .hasSize(8)
                .allSatisfy(n -> assertThat(n).isBetween(60, 72));
            assertThat(c.practice().editable())
                .isNotEmpty()
                .doesNotHaveDuplicates()
                .allSatisfy(i -> assertThat(i).isBetween(0, 7));
            var own = tasks
                .stream()
                .filter(t -> t.placement().composerId().equals(c.id()))
                .toList();
            assertThat(own)
                .hasSize(2)
                .allSatisfy(t -> {
                    assertThat(t.composer()).isEqualTo(c.name());
                    assertThat(t.era()).isEqualTo(data.periods().get(c.periodId()));
                });
            assertThat(own)
                .extracting(Assignment::id)
                .containsExactly(c.practice().id(), c.listening().id());
        }
    }

    @Test
    void descriptionsAndReadyTasksAreLoadedFromTheSameResource() {
        for (var c : ExpandedComposerPractice.data().composers()) {
            var listening = ExpandedComposerPractice.catalog()
                .stream()
                .filter(t -> t.id().equals(c.listening().id()))
                .findFirst()
                .orElseThrow();
            assertThat(listening.prompt()).isEqualTo(c.listening().goal());
            assertThat(listening.hint()).isEqualTo(c.listening().hint());
            assertThat(listening.aspects()).containsExactly(c.listening().aspect());
            assertThat(listening.steps()).hasSize(4);
        }
        var all = new AssignmentService().catalog();
        for (var era : java.util.List.of("baroque", "classical", "romantic", "modern")) {
            assertThat(
                all
                    .stream()
                    .filter(t -> t.placement().periodId().equals(era))
                    .map(t -> t.placement().composerId())
                    .distinct()
                    .count()
            ).isGreaterThanOrEqualTo(12);
        }
    }
}
