package ru.projectforma.classroom;

import java.util.*;

public final class MelodyChecker {

    private MelodyChecker() {}

    public record Result(
        boolean passed,
        boolean complete,
        String message,
        List<Integer> incorrectSlots
    ) {}

    public static Result check(MelodyDefinition definition, List<Integer> notes) {
        var missing = definition
            .editable()
            .stream()
            .filter(i -> notes.get(i) == 0)
            .toList();
        if (!missing.isEmpty()) return new Result(
            false,
            false,
            "Заполните выделенные доли и проверьте снова.",
            missing
        );
        var wrong = new TreeSet<Integer>();
        for (int slot = 0; slot < 8; slot++) {
            if (definition.editable().contains(slot)) {
                if (!definition.allowed().contains(notes.get(slot))) wrong.add(slot);
            } else if (!Objects.equals(notes.get(slot), definition.initial().get(slot))) {
                wrong.add(slot);
            }
        }
        if (!wrong.isEmpty()) return new Result(
            false,
            true,
            "Используйте разрешённые клавиши и сохраните исходные ноты.",
            List.copyOf(wrong)
        );
        if (definition.lastNote() != 0 && notes.get(7) != definition.lastNote()) wrong.add(7);
        var mode = definition.checkMode();
        if (mode == null) mode = MelodyDefinition.CheckMode.CONDITIONS;
        if (mode == MelodyDefinition.CheckMode.EXACT) {
            for (int slot : definition.editable()) {
                if (!Objects.equals(notes.get(slot), definition.reference().get(slot))) wrong.add(
                    slot
                );
            }
        } else if (mode == MelodyDefinition.CheckMode.TRANSPOSE) {
            var slots = definition.editable().stream().sorted().toList();
            int shift = notes.get(slots.getFirst()) - definition.reference().get(slots.getFirst());
            for (int slot : slots) {
                if (notes.get(slot) - definition.reference().get(slot) != shift) wrong.add(slot);
            }
            if (shift == 0) wrong.addAll(slots);
        }
        if (!wrong.isEmpty()) {
            String message = "Проверьте последнюю ноту: окончание должно соответствовать условию.";
            if (mode == MelodyDefinition.CheckMode.EXACT) {
                message = "Есть отличия от образца. Сравните выделенные доли на слух.";
            } else if (mode == MelodyDefinition.CheckMode.TRANSPOSE) {
                message =
                    "Начните с другой высоты и сохраните интервалы между нотами мотива. Проверьте также условие окончания.";
            }
            return new Result(false, true, message, List.copyOf(wrong));
        }
        String message = "Верно! Музыкальное условие выполнено.";
        if (mode == MelodyDefinition.CheckMode.CONDITIONS) {
            message =
                "Условия выполнены. Это свободный ответ: художественное качество автоматически не оценивается.";
        }
        return new Result(true, true, message, List.of());
    }
}
