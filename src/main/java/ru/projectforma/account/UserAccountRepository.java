package ru.projectforma.account;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByUsernameIgnoreCase(String username);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
        "select a from UserAccount a where a.role = ru.projectforma.account.Role.ADMIN and a.enabled = true order by a.id"
    )
    List<UserAccount> lockActiveAdministrators();
}
