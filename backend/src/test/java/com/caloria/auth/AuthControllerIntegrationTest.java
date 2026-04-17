package com.caloria.auth;

import com.caloria.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Base64;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void POST_auth_google_withValidDevToken_returns200AndJwt() throws Exception {
        String token = buildDevToken("g-it-001", "it@test.com", "IT User");

        mockMvc.perform(post("/api/v1/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"idToken": "%s"}
                    """.formatted(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.expiresIn").isNumber())
            .andExpect(jsonPath("$.user.email").value("it@test.com"))
            .andExpect(jsonPath("$.user.onboardingCompleted").value(false));
    }

    @Test
    void POST_auth_google_secondCallSameGoogleId_returnsConsistentUserId() throws Exception {
        String token = buildDevToken("g-it-002", "twice@test.com", "Twice User");
        String body = """
            {"idToken": "%s"}
            """.formatted(token);

        String resp1 = mockMvc.perform(post("/api/v1/auth/google")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        String resp2 = mockMvc.perform(post("/api/v1/auth/google")
                .contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        String id1 = objectMapper.readTree(resp1).get("user").get("id").asText();
        String id2 = objectMapper.readTree(resp2).get("user").get("id").asText();
        org.assertj.core.api.Assertions.assertThat(id1).isEqualTo(id2);
    }

    @Test
    void POST_auth_google_missingIdToken_returns400WithValidationError() throws Exception {
        mockMvc.perform(post("/api/v1/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void POST_auth_google_blankIdToken_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"idToken": "   "}
                    """))
            .andExpect(status().isBadRequest());
    }

    // --- helper ---

    private String buildDevToken(String googleId, String email, String name) {
        String payload = """
            {"sub":"%s","email":"%s","name":"%s"}
            """.formatted(googleId, email, name).trim();
        String encoded = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(payload.getBytes());
        return "eyJ." + encoded + ".sig";
    }
}
