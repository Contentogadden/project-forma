package ru.projectforma.learning;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ComposerPathsTest {

    @Test
    void extendsFortyComposersWithFourFormatsAndValidPitchAnswers() {
        assertThat(ComposerPaths.catalog())
            .hasSize(160)
            .extracting(Assignment::id)
            .doesNotHaveDuplicates();
        for (var c : ExpandedComposerPractice.data().composers()) {
            var paths = ComposerPaths.data()
                .stream()
                .filter(p -> p.composerId().equals(c.id()))
                .toList();
            assertThat(paths)
                .hasSize(4)
                .extracting(ComposerPaths.PathTask::kind)
                .containsExactly("dictation", "transpose", "retrograde", "recognize");
            for (var p : paths) {
                assertThat(p.notes())
                    .hasSize(8)
                    .allSatisfy(n -> assertThat(n == 0 || (n >= 60 && n <= 72)).isTrue());
                assertThat(p.reference()).hasSize(8);
            }
            assertThat(
                new AssignmentService()
                    .catalog()
                    .stream()
                    .filter(p -> p.placement().composerId().equals(c.id()))
                    .toList()
            ).hasSize(6);
        }
    }
}
