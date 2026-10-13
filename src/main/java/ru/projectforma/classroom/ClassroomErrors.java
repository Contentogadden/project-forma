package ru.projectforma.classroom;

import java.util.Map;
import org.springframework.dao.*;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice(
    assignableTypes = {
        AccountManagementController.class,
        StudyGroupController.class,
        TaskTemplateController.class,
        AssignedWorkController.class,
    }
)
public class ClassroomErrors {

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> response(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(
            Map.of("message", ObjectsMessage(e.getReason()))
        );
    }

    private String ObjectsMessage(String reason) {
        return reason == null ? "Не удалось выполнить запрос" : reason;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> invalid() {
        return ResponseEntity.badRequest().body(
            Map.of("message", "Проверьте обязательные поля, длину текста и значения нот.")
        );
    }

    @ExceptionHandler({
        OptimisticLockingFailureException.class,
        DataIntegrityViolationException.class,
    })
    ResponseEntity<?> conflict() {
        return ResponseEntity.status(409).body(
            Map.of("message", "Данные уже изменились или логин занят. Обновите список.")
        );
    }
}
