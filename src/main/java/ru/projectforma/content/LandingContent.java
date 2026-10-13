package ru.projectforma.content;

import java.util.List;

public record LandingContent(
    List<Epoch> epochs,
    List<Composer> composers,
    List<MusicAspect> aspects,
    LearningTask featuredTask,
    List<LearningPrinciple> principles,
    List<LearningTask> taskSeries
) {
    public record Epoch(String slug, String name, String years, String accent) {}

    public record Composer(String slug, String name, String era, String contribution) {}

    public record MusicAspect(String slug, String name, String description, int order) {}

    public record LearningTask(
        String title,
        String prompt,
        String difficulty,
        List<String> aspects,
        String resultType
    ) {}

    public record LearningPrinciple(String author, String principle, String application) {}
}
