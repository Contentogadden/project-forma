package ru.projectforma.learning;

import java.util.List;

final class NewComposerPractice {

    static List<Assignment> catalog() {
        return List.of(
            task(
                "vivaldi-return",
                "Возвращение начального мотива",
                "baroque",
                "Барокко",
                "vivaldi",
                "А. Вивальди",
                "Форма",
                "Возвращение мотива",
                "Найдите возвращение до–ми–соль после контраста ре–фа.",
                "Первые и последние три ноты совпадают.",
                true
            ),
            task(
                "vivaldi-down-sequence",
                "Секвенция вниз",
                "baroque",
                "Барокко",
                "vivaldi",
                "А. Вивальди",
                "Мелодия",
                "Нисходящая секвенция",
                "Продолжите соль–фа–ми как фа–ми–ре.",
                "Заполните ми и ре после заданного фа.",
                false
            ),
            task(
                "clementi-even",
                "Ровный ход гаммы",
                "classical",
                "Классицизм",
                "clementi",
                "М. Клементи",
                "Ритм",
                "Ровное движение по ступеням",
                "Найдите восходящую гамму до мажор с ровными вступлениями.",
                "Все ступени по порядку, без фа♯.",
                true
            ),
            task(
                "clementi-scale",
                "Гамма без пропусков",
                "classical",
                "Классицизм",
                "clementi",
                "М. Клементи",
                "Мелодия",
                "Диатонические ступени",
                "Заполните три пропуска гаммы до мажор.",
                "Ми, соль и си.",
                false
            ),
            task(
                "liszt-octaves",
                "Мелодия удваивается в октаву",
                "romantic",
                "Романтизм",
                "liszt",
                "Ф. Лист",
                "Тембр",
                "Октавное удвоение",
                "Найдите одновременное удвоение исходной мелодии на октаву ниже.",
                "Каждая пара звуков разделена 12 полутонами.",
                true
            ),
            task(
                "liszt-augmented",
                "Две большие терции",
                "romantic",
                "Романтизм",
                "liszt",
                "Ф. Лист",
                "Гармония",
                "Увеличенное трезвучие",
                "Постройте до–ми–соль♯, два шага по четыре полутона.",
                "Вставьте ми и соль♯.",
                false
            ),
            task(
                "ravel-arpeggio",
                "Созвучие раскрывается по нотам",
                "modern",
                "Модернизм",
                "ravel",
                "М. Равель",
                "Гармония",
                "Разложенный септаккорд",
                "Найдите восходящее и нисходящее арпеджио до–ми–соль–си.",
                "Нужен си, не си♭; порядок высот не меняется.",
                true
            ),
            task(
                "ravel-seventh",
                "Четыре звука созвучия",
                "modern",
                "Модернизм",
                "ravel",
                "М. Равель",
                "Гармония",
                "Большой мажорный септаккорд",
                "Заполните восходящее арпеджио до–ми–соль–си.",
                "Ми, соль и си; спуск уже дан.",
                false
            )
        );
    }

    private static Assignment task(
        String id,
        String title,
        String period,
        String era,
        String composerId,
        String composer,
        String aspect,
        String focus,
        String prompt,
        String hint,
        boolean listening
    ) {
        return listening
            ? ListeningPractice.task(
                  id,
                  title,
                  period,
                  era,
                  composerId,
                  composer,
                  aspect,
                  focus,
                  prompt,
                  hint
              )
            : ComposerPractice.task(
                  id,
                  title,
                  period,
                  era,
                  composerId,
                  composer,
                  aspect,
                  focus,
                  prompt,
                  hint
              );
    }
}
