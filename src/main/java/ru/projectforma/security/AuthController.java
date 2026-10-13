package ru.projectforma.security;

import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.*;
import org.springframework.security.core.context.*;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import ru.projectforma.account.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contextRepository;
    private final UserAccountRepository accounts;

    public AuthController(
        AuthenticationManager authenticationManager,
        SecurityContextRepository contextRepository,
        UserAccountRepository accounts
    ) {
        this.authenticationManager = authenticationManager;
        this.contextRepository = contextRepository;
        this.accounts = accounts;
    }

    @GetMapping("/csrf")
    Map<String, String> csrf(CsrfToken token) {
        return Map.of("headerName", token.getHeaderName(), "token", token.getToken());
    }

    @PostMapping("/login")
    Viewer login(
        @Valid @RequestBody LoginRequest body,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                    body.username(),
                    body.password()
                )
            );
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            if (request.getSession(false) != null) request.changeSessionId();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            contextRepository.saveContext(context, request, response);
            request.getSession().setMaxInactiveInterval(8 * 60 * 60);
            return viewer(authentication.getName());
        } catch (AuthenticationException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль");
        }
    }

    @GetMapping("/me")
    Viewer me(Authentication authentication) {
        if (
            authentication == null || !authentication.isAuthenticated()
        ) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return viewer(authentication.getName());
    }

    @PostMapping("/logout")
    void logout(
        Authentication authentication,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
    }

    private Viewer viewer(String username) {
        UserAccount account = accounts.findByUsernameIgnoreCase(username).orElseThrow();
        return new Viewer(account.getUsername(), account.getDisplayName(), account.getRole());
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

    public record Viewer(String username, String displayName, Role role) {}
}
