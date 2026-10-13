package ru.projectforma.account;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "user_accounts",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_user_accounts_username",
        columnNames = "username"
    )
)
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String username;

    @Column(nullable = false, length = 120)
    private String displayName;

    @Column(nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Version
    @Column(nullable = false, columnDefinition = "bigint default 0")
    private long version;

    @Column(nullable = false, columnDefinition = "bigint default 0")
    private long authVersion;

    protected UserAccount() {}

    public UserAccount(String username, String displayName, String passwordHash, Role role) {
        this.username = username;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public long getVersion() {
        return version;
    }

    public long getAuthVersion() {
        return authVersion;
    }

    public void updateProfile(String name, Role role, boolean enabled) {
        if (this.role != role || this.enabled != enabled) authVersion++;
        this.displayName = name;
        this.role = role;
        this.enabled = enabled;
    }

    public void resetPassword(String hash) {
        this.passwordHash = hash;
        authVersion++;
    }
}
