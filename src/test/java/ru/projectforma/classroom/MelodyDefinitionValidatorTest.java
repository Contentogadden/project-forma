package ru.projectforma.classroom;

import static org.assertj.core.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class MelodyDefinitionValidatorTest {

    private MelodyDefinition definition(
        MelodyDefinition.CheckMode mode,
        List<Integer> allowed,
        int lastNote
    ) {
        return new MelodyDefinition(
            "Мотив",
            "Перенесите мотив",
            "Сохраните интервалы",
            90,
            List.of(60, 62, 64, 0, 0, 0, 0, 0),
            List.of(60, 62, 64, 0, 60, 62, 64, 0),
            List.of(4, 5, 6),
            allowed,
            lastNote,
            mode
        );
    }

    @Test
    void legacyDefinitionWithoutCheckModeIsAccepted() {
        assertThatCode(() ->
            MelodyDefinitionValidator.validate(definition(null, List.of(60, 62, 64), 0))
        ).doesNotThrowAnyException();
    }

    @Test
    void exactAnswerRequiresAvailableNotes() {
        assertThatThrownBy(() ->
            MelodyDefinitionValidator.validate(
                definition(MelodyDefinition.CheckMode.EXACT, List.of(60, 62), 0)
            )
        )
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Все ноты точного ответа");
    }

    @Test
    void duplicateAllowedNotesAreRejected() {
        assertThatThrownBy(() ->
            MelodyDefinitionValidator.validate(definition(null, List.of(60, 62, 64, 64), 0))
        )
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("доступные клавиши");
    }

    @Test
    void fixedRestCannotBeAnEndingNote() {
        assertThatThrownBy(() ->
            MelodyDefinitionValidator.validate(definition(null, List.of(60, 62, 64), 60))
        )
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Условие окончания невыполнимо");
    }

    @Test
    void transpositionNeedsAnActualAlternative() {
        assertThatThrownBy(() ->
            MelodyDefinitionValidator.validate(
                definition(MelodyDefinition.CheckMode.TRANSPOSE, List.of(60, 62, 64), 0)
            )
        )
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("мотив нельзя перенести");
        assertThatCode(() ->
            MelodyDefinitionValidator.validate(
                definition(MelodyDefinition.CheckMode.TRANSPOSE, List.of(60, 62, 64, 66), 0)
            )
        ).doesNotThrowAnyException();
    }
}
