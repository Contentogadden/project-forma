package ru.projectforma.content;

import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/art")
public class ArtController {

    private final Path directory;

    public ArtController(
        @Value("${forma.art.directory:${user.home}/Downloads/Frame Art}") String directory
    ) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    private record Entry(String id, Path path, String type) {}

    private List<Entry> scan() {
        if (!Files.isDirectory(directory)) return List.of();
        try (var paths = Files.list(directory)) {
            return paths
                .filter(p -> Files.isRegularFile(p, LinkOption.NOFOLLOW_LINKS))
                .map(p -> {
                    String name = p.getFileName().toString().toLowerCase(Locale.ROOT);
                    String type =
                        name.endsWith(".jpg") || name.endsWith(".jpeg")
                            ? "image/jpeg"
                            : name.endsWith(".png")
                              ? "image/png"
                              : name.endsWith(".webp")
                                ? "image/webp"
                                : null;
                    if (type == null) return null;
                    try {
                        String fingerprint =
                            p.getFileName() +
                            ":" +
                            Files.getLastModifiedTime(p).toMillis() +
                            ":" +
                            Files.size(p);
                        return new Entry(
                            HexFormat.of().formatHex(
                                MessageDigest.getInstance("SHA-256").digest(
                                    fingerprint.getBytes(StandardCharsets.UTF_8)
                                )
                            ),
                            p,
                            type
                        );
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    @GetMapping
    List<String> choose() {
        var entries = new ArrayList<>(scan());
        Collections.shuffle(entries);
        return entries
            .stream()
            .limit(6)
            .map(e -> "/api/v1/art/" + e.id())
            .toList();
    }

    @GetMapping("/{id:[a-f0-9]{64}}")
    ResponseEntity<FileSystemResource> image(@PathVariable String id) {
        var entry = scan()
            .stream()
            .filter(e -> e.id().equals(id))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(entry.type()))
            .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS))
            .body(new FileSystemResource(entry.path()));
    }
}
