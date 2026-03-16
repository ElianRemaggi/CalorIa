package com.caloria.auth;

import com.caloria.auth.dto.AuthResponse;
import com.caloria.auth.dto.GoogleAuthRequest;
import com.caloria.common.exception.AuthException;
import com.caloria.config.AppConfig;
import com.caloria.config.JwtConfig;
import com.caloria.profile.ProfileRepository;
import com.caloria.security.JwtService;
import com.caloria.user.UserRepository;
import com.caloria.user.domain.AppUser;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final JwtService jwtService;
    private final AppConfig appConfig;
    private final JwtConfig jwtConfig;

    @Transactional
    public AuthResponse authenticateWithGoogle(GoogleAuthRequest request) {
        GoogleIdToken.Payload payload = verifyGoogleToken(request.idToken());

        String googleId = payload.getSubject();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        AppUser user = userRepository.findByGoogleId(googleId)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .map(existing -> {
                            existing.setGoogleId(googleId);
                            existing.setAvatarUrl(picture);
                            existing.setFullName(name != null ? name : existing.getFullName());
                            return userRepository.save(existing);
                        })
                        .orElseGet(() -> {
                            AppUser newUser = AppUser.builder()
                                    .googleId(googleId)
                                    .email(email)
                                    .fullName(name != null ? name : email)
                                    .avatarUrl(picture)
                                    .authProvider("google")
                                    .build();
                            return userRepository.save(newUser);
                        }));

        boolean onboardingCompleted = profileRepository.findByUserId(user.getId())
                .map(p -> p.isOnboardingCompleted())
                .orElse(false);

        String token = jwtService.generateToken(user.getId(), user.getEmail());

        return new AuthResponse(
                token,
                "Bearer",
                jwtConfig.expirationMs() / 1000,
                new AuthResponse.UserInfo(
                        user.getId(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getAvatarUrl(),
                        onboardingCompleted
                )
        );
    }

    private GoogleIdToken.Payload verifyGoogleToken(String idToken) {
        String clientId = appConfig.clientId();

        // In dev mode with placeholder client ID, do a lenient parse
        if (clientId.equals("your-google-client-id.apps.googleusercontent.com")) {
            log.warn("Using dev mode: skipping Google token verification. Set GOOGLE_CLIENT_ID in production.");
            return parseTokenLeniently(idToken);
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(clientId))
                    .build();

            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                throw new AuthException("Invalid Google ID token");
            }
            return googleIdToken.getPayload();
        } catch (AuthException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google token verification failed", e);
            throw new AuthException("Google token verification failed: " + e.getMessage());
        }
    }

    private GoogleIdToken.Payload parseTokenLeniently(String idToken) {
        try {
            // Parse JWT claims without verification for dev/testing
            String[] parts = idToken.split("\\.");
            if (parts.length != 3) {
                throw new AuthException("Invalid token format");
            }
            String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
            com.google.gson.JsonObject json = com.google.gson.JsonParser.parseString(payloadJson).getAsJsonObject();

            GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
            payload.setSubject(json.has("sub") ? json.get("sub").getAsString() : "dev-user-123");
            payload.setEmail(json.has("email") ? json.get("email").getAsString() : "dev@example.com");
            if (json.has("name")) payload.set("name", json.get("name").getAsString());
            if (json.has("picture")) payload.set("picture", json.get("picture").getAsString());
            return payload;
        } catch (Exception e) {
            // Fallback for any token in dev mode
            GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
            payload.setSubject("dev-user-" + idToken.hashCode());
            payload.setEmail("dev@caloria.local");
            payload.set("name", "Dev User");
            return payload;
        }
    }
}
