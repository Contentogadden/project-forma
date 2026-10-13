package ru.projectforma.classroom;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

final class MelodyDefinitionValidator {

    private static final Set<Integer> PITCHES = Set.of(60, 62, 64, 65, 66, 67, 69, 71, 72);
    private static final int LAST_SLOT = 7;

    private MelodyDefinitionValidator() {}

    static void validate(MelodyDefinition definition) {
        validatePitches(definition);
        validateEditableNotes(definition);
        validateEnding(definition);
        if (definition.checkMode() == null) return;
        switch (definition.checkMode()) {
            case EXACT -> validateExactAnswer(definition);
            case TRANSPOSE -> validateTransposition(definition);
            default -> {
            }
        }
    }

    private static void validatePitches(MelodyDefinition definition) {
        boolean valid =
            PITCHES.containsAll(definition.allowed()) &&
            unique(definition.allowed()) &&
            unique(definition.editable()) &&
            playable(definition.initial()) &&
            playable(definition.reference()) &&
            definition
                .reference()
                .stream()
                .anyMatch(note -> note != 0) &&
            (definition.lastNote() == 0 || definition.allowed().contains(definition.lastNote()));
        if (!valid) throw invalid("Проверьте ноты, доступные клавиши и окончание");
    }

    private static boolean unique(List<Integer> values) {
        return values.stream().distinct().count() == values.size();
    }

    private static boolean playable(List<Integer> notes) {
        return notes.stream().allMatch(note -> note == 0 || PITCHES.contains(note));
    }

    private static void validateEditableNotes(MelodyDefinition definition) {
        for (int slot : definition.editable()) {
            int initialNote = definition.initial().get(slot);
            if (initialNote != 0 && !definition.allowed().contains(initialNote)) {
                throw invalid("Начальная нота должна быть доступна ученику");
            }
        }
    }

    private static void validateEnding(MelodyDefinition definition) {
        if (
            definition.lastNote() != 0 &&
            !definition.editable().contains(LAST_SLOT) &&
            definition.initial().get(LAST_SLOT) != definition.lastNote()
        ) {
            throw invalid("Условие окончания невыполнимо");
        }
    }

    private static void validateExactAnswer(MelodyDefinition definition) {
        for (int slot : definition.editable()) {
            if (!definition.allowed().contains(definition.reference().get(slot))) {
                throw invalid("Все ноты точного ответа должны быть доступны ученику");
            }
        }
        if (
            definition.lastNote() != 0 &&
            definition.reference().get(LAST_SLOT) != definition.lastNote()
        ) {
            throw invalid("Образец противоречит условию окончания");
        }
    }

    private static void validateTransposition(MelodyDefinition definition) {
        if (
            definition.editable().size() < 2 ||
            definition
                .editable()
                .stream()
                .anyMatch(slot -> definition.reference().get(slot) == 0)
        ) {
            throw invalid(
                "Для переноса задайте минимум две звучащие ноты образца в изменяемых долях"
            );
        }
        int firstSlot = definition.editable().stream().min(Integer::compareTo).orElseThrow();
        for (int startNote : definition.allowed()) {
            int shift = startNote - definition.reference().get(firstSlot);
            if (shift == 0) continue;
            var candidate = new ArrayList<>(definition.initial());
            for (int slot : definition.editable()) {
                candidate.set(slot, definition.reference().get(slot) + shift);
            }
            if (MelodyChecker.check(definition, candidate).passed()) return;
        }
        throw invalid(
            "С выбранными клавишами и окончанием мотив нельзя перенести. Расширьте набор нот или измените условие"
        );
    }

    private static ResponseStatusException invalid(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
