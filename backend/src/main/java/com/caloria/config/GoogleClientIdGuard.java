package com.caloria.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * AuthService falls back to unverified, lenient JWT parsing whenever
 * app.google.client-id still holds its placeholder value — accepting any
 * three-part token as a valid login. That fallback is fine for local dev,
 * but must never reach a live deploy, so this aborts startup under the
 * "prod" profile if GOOGLE_CLIENT_ID was never set.
 */
@Component
@Profile("prod")
@RequiredArgsConstructor
public class GoogleClientIdGuard {

    private final AppConfig appConfig;

    @PostConstruct
    public void verifyClientIdIsConfigured() {
        if (AppConfig.PLACEHOLDER_CLIENT_ID.equals(appConfig.clientId())) {
            throw new IllegalStateException(
                    "GOOGLE_CLIENT_ID is not set. Refusing to start with the 'prod' profile while it holds "
                            + "the placeholder value — AuthService would silently accept any well-formed JWT "
                            + "as a valid login.");
        }
    }
}
