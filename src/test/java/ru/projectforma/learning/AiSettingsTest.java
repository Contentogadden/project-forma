package ru.projectforma.learning;

import static org.assertj.core.api.Assertions.*;

import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class AiSettingsTest {

    @TempDir
    Path dir;

    @Test
    void providersKeepSeparateKeysAndRestoreAfterRestart() throws Exception {
        var file = dir.resolve("providers.properties");
        var s = new AiSettings(file.toString(), "", "gemini-2.5-flash-lite");
        s.save("gemini-dummy-key-123456789", true, "gemini-2.5-flash-lite");
        assertThatThrownBy(() ->
            s.save(null, true, "openai/gpt-oss-20b", AiSettings.Provider.GROQ)
        ).isInstanceOf(IllegalArgumentException.class);
        s.save("groq-dummy-key-123456789", true, "openai/gpt-oss-20b", AiSettings.Provider.GROQ);
        assertThat(s.status().geminiConfigured()).isTrue();
        assertThat(s.status().groqConfigured()).isTrue();
        var restored = new AiSettings(file.toString(), "", "gemini-2.5-flash-lite");
        assertThat(restored.credentials().provider()).isEqualTo(AiSettings.Provider.GROQ);
        assertThat(restored.activeKey()).isEqualTo("groq-dummy-key-123456789");
        restored.clear();
        assertThat(restored.status().groqConfigured()).isFalse();
        assertThat(restored.status().geminiConfigured()).isTrue();
        restored.save(null, true, "gemini-2.5-flash-lite", AiSettings.Provider.GEMINI);
        assertThat(restored.activeKey()).isEqualTo("gemini-dummy-key-123456789");
        assertThatThrownBy(() ->
            restored.save(
                "groq-dummy-key-123456789",
                true,
                "arbitrary-paid-model",
                AiSettings.Provider.GROQ
            )
        ).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void persistsPrivatelyAndSupportsReplacementAndRemoval() throws Exception {
        Path file = dir.resolve("settings/ai.properties");
        String key = "dummy-key-for-offline-tests-123";
        var s = new AiSettings(file.toString(), "", "gemini-2.5-flash-lite");
        s.save(key, true, "gemini-2.5-flash-lite");
        assertThat(s.status().toString()).doesNotContain(key);
        assertThat(Files.getPosixFilePermissions(file)).isEqualTo(
            PosixFilePermissions.fromString("rw-------")
        );
        var restored = new AiSettings(
            file.toString(),
            "ignored-environment-secret",
            "gemini-2.5-flash-lite"
        );
        assertThat(restored.activeKey()).isEqualTo(key);
        restored.save(null, false, "gemini-2.5-flash-lite");
        assertThat(restored.activeKey()).isEmpty();
        restored.save("replacement-key-for-tests-456", true, "gemini-2.5-flash-lite");
        assertThat(restored.activeKey()).isNotEqualTo(key);
        restored.clear();
        assertThat(
            new AiSettings(file.toString(), key, "gemini-2.5-flash-lite").status().configured()
        ).isFalse();
    }

    @Test
    void invalidInputsLeaveSettingsUnchanged() throws Exception {
        var s = new AiSettings(
            dir.resolve("ai.properties").toString(),
            "",
            "gemini-2.5-flash-lite"
        );
        assertThatThrownBy(() -> s.save(null, true, "gemini-2.5-flash-lite")).isInstanceOf(
            IllegalArgumentException.class
        );
        assertThatThrownBy(() -> s.save("bad\nkey", false, "gemini-2.5-flash-lite")).isInstanceOf(
            IllegalArgumentException.class
        );
        assertThatThrownBy(() -> s.save(null, false, "../other")).isInstanceOf(
            IllegalArgumentException.class
        );
        assertThat(s.status().configured()).isFalse();
    }
}
