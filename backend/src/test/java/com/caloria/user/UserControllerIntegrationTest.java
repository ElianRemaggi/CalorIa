package com.caloria.user;

import com.caloria.BaseIntegrationTest;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class UserControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void GET_users_me_authenticated_returnsCurrentUser() throws Exception {
        String token = authenticateAndGetToken("g-u1", "user1@test.com");

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andExpect(jsonPath("$.email").value("user1@test.com"))
            .andExpect(jsonPath("$.fullName").value("Test User"));
    }

    @Test
    void GET_users_me_unauthenticated_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
            .andExpect(status().isForbidden());
    }

    @Test
    void GET_users_me_twoUsers_eachSeesOwnData() throws Exception {
        String tokenA = authenticateAndGetToken("g-u2a", "user2a@test.com");
        String tokenB = authenticateAndGetToken("g-u2b", "user2b@test.com");

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + tokenA))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("user2a@test.com"));

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + tokenB))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("user2b@test.com"));
    }

    @Test
    void GET_users_me_doesNotExposePasswordOrInternalFields() throws Exception {
        String token = authenticateAndGetToken("g-u3", "user3@test.com");

        mockMvc.perform(get("/api/v1/users/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andExpect(jsonPath("$.email").isNotEmpty())
            .andExpect(jsonPath("$.fullName").isNotEmpty())
            // avatarUrl is nullable but should exist as a field
            .andExpect(jsonPath("$.password").doesNotExist())
            .andExpect(jsonPath("$.googleId").doesNotExist());
    }
}
