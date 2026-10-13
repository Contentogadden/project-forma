package ru.projectforma.learning;

import jakarta.validation.constraints.*;
import java.util.List;

public record MusicState(
    @Min(1) @Max(1) int version,
    @Min(50) @Max(160) int tempo,
    @NotNull @Size(min = 8, max = 8) List<@NotNull @Min(0) @Max(84) Integer> notes,
    @NotNull @Size(min = 4, max = 4) List<@NotNull @Pattern(regexp = "C|F|G|Am|Dm") String> chords,
    @NotNull @Size(min = 16, max = 16) List<@NotNull @Min(0) @Max(2) Integer> hits,
    @NotNull @Size(min = 3, max = 3) List<@NotNull @Pattern(regexp = "A|B|A′") String> order,
    @NotNull @Pattern(regexp = "soft|reed|bell") String tone,
    @Min(-1) @Max(2) int registerChoice,
    @NotNull @Size(max = 3) List<@NotNull @Min(0) @Max(2) Integer> heard
) {}
