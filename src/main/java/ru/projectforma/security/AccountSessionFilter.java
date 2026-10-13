package ru.projectforma.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import ru.projectforma.account.*;

public class AccountSessionFilter extends OncePerRequestFilter {

    private final UserAccountRepository accounts;

    public AccountSessionFilter(UserAccountRepository accounts) {
        this.accounts = accounts;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest req,
        HttpServletResponse res,
        FilterChain chain
    ) throws ServletException, IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (
            req.getRequestURI().startsWith("/api/") &&
            auth != null &&
            auth.isAuthenticated() &&
            !(auth instanceof AnonymousAuthenticationToken)
        ) {
            var account = accounts.findByUsernameIgnoreCase(auth.getName());
            boolean valid = account.isPresent() && account.get().isEnabled();
            if (valid && auth.getPrincipal() instanceof AccountPrincipal principal) valid =
                principal.authVersion() == account.get().getAuthVersion();
            if (!valid) {
                SecurityContextHolder.clearContext();
                var session = req.getSession(false);
                if (session != null) session.invalidate();
                if (
                    !req.getRequestURI().startsWith("/api/v1/") &&
                    !req.getRequestURI().equals("/api/auth/login") &&
                    !req.getRequestURI().equals("/api/auth/csrf")
                ) {
                    res.sendError(401);
                    return;
                }
            }
        }
        chain.doFilter(req, res);
    }
}
