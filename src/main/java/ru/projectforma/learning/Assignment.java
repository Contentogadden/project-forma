package ru.projectforma.learning;

import java.util.List;

public record Assignment(
    String id,
    String title,
    String era,
    String composer,
    List<String> aspects,
    String level,
    int minutes,
    String prompt,
    String deliverable,
    String material,
    List<String> steps,
    List<String> criteria,
    String hint,
    Placement placement
) {
    public record Placement(String periodId, String periodName, String composerId, String focus) {}
}
