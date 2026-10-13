package ru.projectforma.account;

import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {

    private final UserAccountRepository accounts;

    public DatabaseUserDetailsService(UserAccountRepository accounts) {
        this.accounts = accounts;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserAccount account = accounts
            .findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new UsernameNotFoundException("Unknown account"));
        return new AccountPrincipal(
            account.getUsername(),
            account.getPasswordHash(),
            account.getRole(),
            account.isEnabled(),
            account.getAuthVersion()
        );
    }
}
