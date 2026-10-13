package ru.projectforma.classroom;

import jakarta.validation.constraints.*;
import java.util.List;

public record MelodyDefinition(
    @NotBlank @Size(max = 120) String title,
    @NotBlank @Size(max = 1500) String instruction,
    @NotNull @Size(max = 1000) String hint,
    @Min(50) @Max(160) int tempo,
    @NotNull @Size(min = 8, max = 8) List<@NotNull Integer> initial,
    @NotNull @Size(min = 8, max = 8) List<@NotNull Integer> reference,
    @NotNull @Size(min = 1, max = 8) List<@NotNull @Min(0) @Max(7) Integer> editable,
    @NotNull @Size(min = 1, max = 9) List<@NotNull Integer> allowed,
    @Min(0) @Max(72) int lastNote,
    CheckMode checkMode
) {
    public enum CheckMode {
        CONDITIONS,
        EXACT,
        TRANSPOSE,
    }

    public MelodyDefinition(
        String title,
        String instruction,
        String hint,
        int tempo,
        List<Integer> initial,
        List<Integer> reference,
        List<Integer> editable,
        List<Integer> allowed,
        int lastNote
    ) {
        this(
            title,
            instruction,
            hint,
            tempo,
            initial,
            reference,
            editable,
            allowed,
            lastNote,
            null
        );
    }
}
