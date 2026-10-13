package ru.projectforma.content;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ArtControllerTest {

    @TempDir
    Path directory;

    @Test
    void selectsDistinctImagesWithoutExposingPathsAndServesThem() throws Exception {
        for (int i = 0; i < 8; i++) Files.write(
            directory.resolve("art " + i + ".jpeg"),
            new byte[] { 1, 2, 3 }
        );
        Files.writeString(directory.resolve("private.txt"), "not an image");
        var controller = new ArtController(directory.toString());
        var urls = controller.choose();
        assertEquals(6, urls.size());
        assertEquals(6, new HashSet<>(urls).size());
        for (String url : urls) {
            assertTrue(url.matches("/api/v1/art/[a-f0-9]{64}"));
            var response = controller.image(url.substring(url.lastIndexOf('/') + 1));
            assertEquals("image/jpeg", response.getHeaders().getContentType().toString());
            assertTrue(response.getBody().exists());
        }
        assertThrows(org.springframework.web.server.ResponseStatusException.class, () ->
            controller.image("0".repeat(64))
        );
    }

    @Test
    void missingFolderIsSafeAndNewFilesAreDiscovered() throws Exception {
        var controller = new ArtController(directory.toString());
        assertTrue(controller.choose().isEmpty());
        Files.write(directory.resolve("new.png"), new byte[] { 1 });
        assertEquals(1, controller.choose().size());
        assertTrue(new ArtController(directory.resolve("missing").toString()).choose().isEmpty());
    }
}
