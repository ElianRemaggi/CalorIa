package com.caloria.weight;

import com.caloria.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class WeightControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void POST_weightLogs_authenticated_returns201WithEntry() throws Exception {
        String token = authenticateAndGetToken("g-w1", "weight1@test.com");

        mockMvc.perform(post("/api/v1/weight-logs")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"weightKg": 75.5, "loggedAt": "2026-04-10"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andExpect(jsonPath("$.weightKg").value(75.5))
            .andExpect(jsonPath("$.loggedAt").value("2026-04-10"));
    }

    @Test
    void POST_weightLogs_unauthenticated_returns403() throws Exception {
        mockMvc.perform(post("/api/v1/weight-logs")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"weightKg": 75.0, "loggedAt": "2026-04-10"}
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void POST_weightLogs_weightTooLow_returns400() throws Exception {
        String token = authenticateAndGetToken("g-w2", "weight2@test.com");

        mockMvc.perform(post("/api/v1/weight-logs")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"weightKg": 10.0, "loggedAt": "2026-04-10"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void POST_weightLogs_weightTooHigh_returns400() throws Exception {
        String token = authenticateAndGetToken("g-w3", "weight3@test.com");

        mockMvc.perform(post("/api/v1/weight-logs")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"weightKg": 600.0, "loggedAt": "2026-04-10"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void POST_weightLogs_missingDate_returns400() throws Exception {
        String token = authenticateAndGetToken("g-w4", "weight4@test.com");

        mockMvc.perform(post("/api/v1/weight-logs")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"weightKg": 75.0}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void GET_weightLogs_returnsLogsOrderedByDateDesc() throws Exception {
        String token = authenticateAndGetToken("g-w5", "weight5@test.com");

        // Insert two entries
        createWeightLog(token, "80.0", "2026-04-08");
        createWeightLog(token, "79.5", "2026-04-10");

        mockMvc.perform(get("/api/v1/weight-logs")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            // most recent first
            .andExpect(jsonPath("$[0].loggedAt").value("2026-04-10"))
            .andExpect(jsonPath("$[1].loggedAt").value("2026-04-08"));
    }

    @Test
    void GET_weightLogs_doesNotReturnOtherUsersLogs() throws Exception {
        String tokenA = authenticateAndGetToken("g-w6a", "weight6a@test.com");
        String tokenB = authenticateAndGetToken("g-w6b", "weight6b@test.com");

        createWeightLog(tokenA, "75.0", "2026-04-10");
        createWeightLog(tokenB, "90.0", "2026-04-10");

        mockMvc.perform(get("/api/v1/weight-logs")
                .header("Authorization", "Bearer " + tokenA))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].weightKg").value(75.0));
    }

    @Test
    void GET_weightLogs_unauthenticated_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/weight-logs"))
            .andExpect(status().isForbidden());
    }

    // --- helper ---

    private void createWeightLog(String token, String weightKg, String loggedAt) throws Exception {
        mockMvc.perform(post("/api/v1/weight-logs")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"weightKg": %s, "loggedAt": "%s"}
                    """.formatted(weightKg, loggedAt)))
            .andExpect(status().isCreated());
    }
}
