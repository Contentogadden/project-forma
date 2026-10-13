package ru.projectforma.learning;

import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.Properties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AiSettings {

    public enum Provider {
        GEMINI,
        GROQ,
    }

    public record Status(
        boolean enabled,
        boolean configured,
        String model,
        Provider provider,
        boolean geminiConfigured,
        boolean groqConfigured,
        String geminiModel,
        String groqModel
    ) {}

    record Credentials(Provider provider, String key, String model, boolean enabled) {
        @Override
        public String toString() {
            return "Credentials[REDACTED]";
        }
    }

    private Provider provider = Provider.GEMINI;
    private String groqKey = "",
        groqModel = "openai/gpt-oss-20b";
    private final Path file;
    private String key, model;
    private boolean enabled;

    public AiSettings(
        @Value("${forma.ai.settings-file:${user.home}/.project-forma/ai.properties}") String file,
        @Value("${GEMINI_API_KEY:}") String environmentKey,
        @Value("${forma.ai.gemini-model:gemini-2.5-flash-lite}") String model
    ) throws IOException {
        this.file = Path.of(file).toAbsolutePath();
        this.key = environmentKey;
        this.model = model;
        this.enabled = !key.isBlank();
        if (Files.exists(this.file, LinkOption.NOFOLLOW_LINKS)) {
            if (Files.isSymbolicLink(this.file)) throw new IOException(
                "AI settings must not be a symlink"
            );
            Properties p = new Properties();
            try (var input = Files.newInputStream(this.file)) {
                p.load(input);
            }
            key = p.getProperty("key", "");
            enabled = Boolean.parseBoolean(p.getProperty("enabled", "false"));
            this.model = p.getProperty("model", model);
            provider = Provider.valueOf(p.getProperty("provider", "GEMINI"));
            groqKey = p.getProperty("groq.key", "");
            groqModel = p.getProperty("groq.model", "openai/gpt-oss-20b");
            Files.setPosixFilePermissions(this.file, PosixFilePermissions.fromString("rw-------"));
        }
    }

    public synchronized Status status() {
        return new Status(
            enabled,
            !configuredKey().isBlank(),
            model(),
            provider,
            !key.isBlank(),
            !groqKey.isBlank(),
            model,
            groqModel
        );
    }

    synchronized Credentials credentials() {
        return new Credentials(provider, configuredKey(), model(), enabled);
    }

    synchronized String activeKey() {
        return enabled ? configuredKey() : "";
    }

    synchronized String configuredKey() {
        return provider == Provider.GROQ ? groqKey : key;
    }

    synchronized String model() {
        return provider == Provider.GROQ ? groqModel : model;
    }

    public synchronized Status save(String replacement, boolean enabled, String model)
        throws IOException {
        return save(replacement, enabled, model, provider);
    }

    public synchronized Status save(
        String replacement,
        boolean enabled,
        String model,
        Provider selected
    ) throws IOException {
        if (selected == null) selected = provider;
        String old = selected == Provider.GROQ ? groqKey : key;
        String next = replacement == null || replacement.isBlank() ? old : replacement.strip();
        if (
            !next.isEmpty() && !next.matches("[A-Za-z0-9_.-]{20,256}")
        ) throw new IllegalArgumentException("Проверьте формат ключа.");
        if (!validModel(selected, model)) throw new IllegalArgumentException(
            "Проверьте название модели."
        );
        if (enabled && next.isBlank()) throw new IllegalArgumentException(
            "Сначала сохраните ключ."
        );
        String gKey = selected == Provider.GROQ ? next : groqKey,
            gModel = selected == Provider.GROQ ? model : groqModel;
        String mKey = selected == Provider.GEMINI ? next : key,
            mModel = selected == Provider.GEMINI ? model : this.model;
        persist(mKey, enabled, mModel, selected, gKey, gModel);
        key = mKey;
        this.model = mModel;
        groqKey = gKey;
        groqModel = gModel;
        provider = selected;
        this.enabled = enabled;
        return status();
    }

    static boolean validModel(Provider provider, String model) {
        return (
            model != null &&
            (provider == Provider.GROQ
                ? java.util.Set.of("openai/gpt-oss-20b", "openai/gpt-oss-120b").contains(model)
                : model.matches("gemini-[a-zA-Z0-9.-]{1,80}"))
        );
    }

    public synchronized Status clear() throws IOException {
        String mKey = provider == Provider.GEMINI ? "" : key,
            gKey = provider == Provider.GROQ ? "" : groqKey;
        persist(mKey, false, model, provider, gKey, groqModel);
        key = mKey;
        groqKey = gKey;
        enabled = false;
        return status();
    }

    private void persist(
        String key,
        boolean enabled,
        String model,
        Provider provider,
        String groqKey,
        String groqModel
    ) throws IOException {
        Path dir = file.getParent();
        if (!Files.exists(dir)) Files.createDirectories(
            dir,
            PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------"))
        );
        if (Files.isSymbolicLink(dir) || Files.isSymbolicLink(file)) throw new IOException(
            "AI settings must not be a symlink"
        );
        Path temp = Files.createTempFile(
            dir,
            ".ai-",
            ".tmp",
            PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------"))
        );
        try {
            Properties p = new Properties();
            p.setProperty("key", key);
            p.setProperty("enabled", Boolean.toString(enabled));
            p.setProperty("model", model);
            p.setProperty("provider", provider.name());
            p.setProperty("groq.key", groqKey);
            p.setProperty("groq.model", groqModel);
            try (var output = Files.newOutputStream(temp)) {
                p.store(output, "Project Forma server-only AI settings");
            }
            Files.move(
                temp,
                file,
                StandardCopyOption.ATOMIC_MOVE,
                StandardCopyOption.REPLACE_EXISTING
            );
        } finally {
            Files.deleteIfExists(temp);
        }
    }
}
