package com.caloria.security;

import com.caloria.config.JwtConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    // Secret must be ≥32 bytes for HMAC-SHA256
    private static final String SECRET = "test-secret-key-padded-to-at-least-256-bits-long-abcde";
    private static final long EXPIRY_MS = 3_600_000L;
    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String EMAIL = "test@caloria.com";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(new JwtConfig(SECRET, EXPIRY_MS));
    }

    @Test
    void generateToken_returnsNonBlankTokenWithThreeParts() {
        String token = jwtService.generateToken(USER_ID, EMAIL);
        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    void extractUserId_roundTrip_returnsOriginalUUID() {
        String token = jwtService.generateToken(USER_ID, EMAIL);
        assertThat(jwtService.extractUserId(token)).isEqualTo(USER_ID);
    }

    @Test
    void extractEmail_roundTrip_returnsOriginalEmail() {
        String token = jwtService.generateToken(USER_ID, EMAIL);
        assertThat(jwtService.extractEmail(token)).isEqualTo(EMAIL);
    }

    @Test
    void isTokenValid_withValidToken_returnsTrue() {
        String token = jwtService.generateToken(USER_ID, EMAIL);
        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_withExpiredToken_returnsFalse() {
        JwtService shortLived = new JwtService(new JwtConfig(SECRET, -1000L));
        String token = shortLived.generateToken(USER_ID, EMAIL);
        assertThat(jwtService.isTokenValid(token)).isFalse();
    }

    @Test
    void isTokenValid_withTamperedSignature_returnsFalse() {
        String token = jwtService.generateToken(USER_ID, EMAIL);
        // Replace the signature part with garbage
        String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "invalidsignatureXXX";
        assertThat(jwtService.isTokenValid(tampered)).isFalse();
    }

    @Test
    void isTokenValid_withGarbageString_returnsFalse() {
        assertThat(jwtService.isTokenValid("not.a.jwt")).isFalse();
    }

    @Test
    void isTokenValid_withEmptyString_returnsFalse() {
        assertThat(jwtService.isTokenValid("")).isFalse();
    }

    @Test
    void isTokenValid_signedWithDifferentSecret_returnsFalse() {
        JwtService other = new JwtService(new JwtConfig(
            "completely-different-secret-that-is-also-256-bits-long-zzz", EXPIRY_MS));
        String token = other.generateToken(USER_ID, EMAIL);
        assertThat(jwtService.isTokenValid(token)).isFalse();
    }

    @Test
    void extractUserId_twoDistinctUsers_neverCollide() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        String t1 = jwtService.generateToken(id1, "a@test.com");
        String t2 = jwtService.generateToken(id2, "b@test.com");
        assertThat(jwtService.extractUserId(t1)).isNotEqualTo(jwtService.extractUserId(t2));
    }
}
