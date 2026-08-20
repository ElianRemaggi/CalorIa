package com.caloria.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.google")
public record AppConfig(String clientId) {

    /**
     * Default value of app.google.client-id (see application.yml) used to signal
     * that GOOGLE_CLIENT_ID was never set. AuthService treats this as a trigger
     * for lenient, unverified token parsing, so it must never reach a live profile.
     */
    public static final String PLACEHOLDER_CLIENT_ID = "your-google-client-id.apps.googleusercontent.com";
}
