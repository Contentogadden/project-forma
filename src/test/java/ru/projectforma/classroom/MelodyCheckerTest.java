package ru.projectforma.classroom;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.Test;

class MelodyCheckerTest {

    private MelodyDefinition definition(MelodyDefinition.CheckMode mode) {
        return new MelodyDefinition(
            "Мотив",
            "Перенести",
            "",
            90,
            List.of(60, 62, 64, 0, 0, 0, 0, 0),
            List.of(60, 62, 64, 0, 60, 62, 64, 0),
            List.of(4, 5, 6),
            List.of(60, 62, 64, 65, 66, 67, 69, 71, 72),
            0,
            mode
        );
    }

    @Test
    void transpositionAcceptsAnyValidShiftButNotCopyOrWrongIntervals() {
        var d = definition(MelodyDefinition.CheckMode.TRANSPOSE);
        assertTrue(MelodyChecker.check(d, List.of(60, 62, 64, 0, 62, 64, 66, 0)).passed());
        assertTrue(MelodyChecker.check(d, List.of(60, 62, 64, 0, 65, 67, 69, 0)).passed());
        assertFalse(MelodyChecker.check(d, d.reference()).passed());
        assertFalse(MelodyChecker.check(d, List.of(60, 62, 64, 0, 62, 64, 65, 0)).passed());
    }

    @Test
    void exactChecksEditableNotesAndReportsWrongSlot() {
        var d = definition(MelodyDefinition.CheckMode.EXACT);
        assertTrue(MelodyChecker.check(d, d.reference()).passed());
        assertEquals(
            List.of(6),
            MelodyChecker.check(d, List.of(60, 62, 64, 0, 60, 62, 65, 0)).incorrectSlots()
        );
    }

    @Test
    void incompleteAndTamperedAnswersFail() {
        var d = definition(null);
        assertFalse(MelodyChecker.check(d, d.initial()).complete());
        assertFalse(MelodyChecker.check(d, List.of(72, 62, 64, 0, 60, 62, 64, 0)).passed());
        assertTrue(MelodyChecker.check(d, d.reference()).passed());
    }
}
