package com.caloria.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

class GoogleClientIdGuardTest {

    @Test
    void verifyClientIdIsConfigured_withPlaceholder_throwsAndAbortsStartup() {
        GoogleClientIdGuard guard = new GoogleClientIdGuard(
                new AppConfig(AppConfig.PLACEHOLDER_CLIENT_ID));

        assertThatThrownBy(guard::verifyClientIdIsConfigured)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("GOOGLE_CLIENT_ID");
    }

    @Test
    void verifyClientIdIsConfigured_withRealClientId_doesNotThrow() {
        GoogleClientIdGuard guard = new GoogleClientIdGuard(
                new AppConfig("123-real.apps.googleusercontent.com"));

        assertThatCode(guard::verifyClientIdIsConfigured).doesNotThrowAnyException();
    }
}
