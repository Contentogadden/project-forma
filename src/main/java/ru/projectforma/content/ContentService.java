package ru.projectforma.content;

import java.util.LinkedHashMap;
import java.util.List;
import org.springframework.stereotype.Service;
import ru.projectforma.learning.AssignmentService;

@Service
public class ContentService {

    private final AssignmentService assignments;

    public ContentService(AssignmentService assignments) {
        this.assignments = assignments;
    }

    private List<LandingContent.Composer> composers() {
        var authors = new LinkedHashMap<String, LandingContent.Composer>();
        for (var task : assignments.catalog()) {
            var placement = task.placement();
            if (!placement.composerId().equals("forma")) authors.putIfAbsent(
                placement.composerId(),
                new LandingContent.Composer(
                    placement.composerId(),
                    task.composer(),
                    placement.periodName(),
                    placement.focus()
                )
            );
        }
        return List.copyOf(authors.values());
    }

    public LandingContent landing() {
        return new LandingContent(
            List.of(
                new LandingContent.Epoch("baroque", "Барокко", "1600—1750", "gold"),
                new LandingContent.Epoch("classicism", "Классицизм", "1750—1820", "coral"),
                new LandingContent.Epoch("romanticism", "Романтизм", "1820—1900", "blue"),
                new LandingContent.Epoch("modernism", "Модернизм", "1900—1975", "green")
            ),
            composers(),
            List.of(
                new LandingContent.MusicAspect(
                    "melody",
                    "Мелодия",
                    "Направление, жест и интонация.",
                    1
                ),
                new LandingContent.MusicAspect(
                    "harmony",
                    "Гармония",
                    "Напряжение, цвет и разрешение.",
                    2
                ),
                new LandingContent.MusicAspect("rhythm", "Ритм", "Пульс, движение и энергия.", 3),
                new LandingContent.MusicAspect("form", "Форма", "Память, контраст и развитие.", 4),
                new LandingContent.MusicAspect(
                    "timbre",
                    "Тембр",
                    "Материал, пространство и характер.",
                    5
                )
            ),
            new LandingContent.LearningTask(
                "Перепишите знакомую мелодию так, будто её гармонизировал Дебюсси",
                "Сравните две версии и объясните три решения через тембр, гармонию и форму.",
                "Исследование",
                List.of("Гармония", "Тембр", "Форма"),
                "Аудио + комментарий"
            ),
            List.of(
                new LandingContent.LearningPrinciple(
                    "А. Аренский",
                    "Правило закрепляется серией задач",
                    "Короткая модель → несколько вариантов → самостоятельная задача"
                ),
                new LandingContent.LearningPrinciple(
                    "Ю. Холопов",
                    "Гармонию нужно создавать, а не только распознавать",
                    "Слушание → анализ → письмо или игра на инструменте"
                ),
                new LandingContent.LearningPrinciple(
                    "С. Танеев",
                    "Материал познаётся через преобразование",
                    "Перестановка голосов выявляет устройство музыкальной ткани"
                )
            ),
            List.of(
                new LandingContent.LearningTask(
                    "Три гармонизации одной мелодии",
                    "Создайте нормативную, романтическую и модальную версии. Отметьте, что изменилось в ощущении формы.",
                    "Практика",
                    List.of("Гармония", "Форма"),
                    "Ноты + аудио"
                ),
                new LandingContent.LearningTask(
                    "Перестановка голосов",
                    "Поменяйте местами верхний и нижний голос короткого двухголосия и исправьте только необходимые интервалы.",
                    "Лаборатория",
                    List.of("Мелодия", "Гармония"),
                    "Партитура"
                ),
                new LandingContent.LearningTask(
                    "Почерк эпохи",
                    "Найдите в двух фрагментах по три признака эпохи и создайте четырёхтактовый ответ с теми же ограничениями.",
                    "Исследование",
                    List.of("Ритм", "Тембр", "Форма"),
                    "Аудио + заметка"
                )
            )
        );
    }
}
