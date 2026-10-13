package ru.projectforma.security;

import org.springframework.context.annotation.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.*;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import ru.projectforma.account.UserAccountRepository;

@Configuration
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
        throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        SecurityContextRepository repository,
        UserAccountRepository accounts
    ) throws Exception {
        http.securityContext(context ->
            context.securityContextRepository(repository).requireExplicitSave(true)
        )
            .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
            .addFilterAfter(new AccountSessionFilter(accounts), SecurityContextHolderFilter.class)
            .authorizeHttpRequests(auth ->
                auth
                    .requestMatchers(
                        "/api/v1/content/**",
                        "/api/v1/assignments/**",
                        "/api/auth/csrf",
                        "/api/auth/login",
                        "/error"
                    )
                    .permitAll()
                    .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")
                    .requestMatchers("/api/teacher/**")
                    .hasAnyRole("ADMIN", "TEACHER")
                    .requestMatchers("/api/student/**")
                    .authenticated()
                    .requestMatchers("/api/classroom/**")
                    .authenticated()
                    .anyRequest()
                    .permitAll()
            )
            .exceptionHandling(errors ->
                errors.authenticationEntryPoint((request, response, ex) -> response.sendError(401))
            )
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .logout(logout -> logout.disable());
        return http.build();
    }
}
