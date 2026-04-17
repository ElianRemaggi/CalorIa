package com.caloria.profile;

import com.caloria.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProfileControllerIntegrationTest extends BaseIntegrationTest {

    // Male, 30y, 175cm, 75kg, maintain
    // Expected: calories=2633, protein=197, carbs=263, fat=88
    @Test
    void PUT_profile_me_createsProfileAndComputesTargets() throws Exception {
        String token = authenticateAndGetToken("g-p1", "profile1@test.com");

        mockMvc.perform(put("/api/v1/profile/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "gender": "male",
                      "age": 30,
                      "heightCm": 175.0,
                      "weightKg": 75.0,
                      "goalType": "maintain"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.targetCalories").value(2633))
            .andExpect(jsonPath("$.targetProteinG").value(197))
            .andExpect(jsonPath("$.targetCarbsG").value(263))
            .andExpect(jsonPath("$.targetFatG").value(88))
            .andExpect(jsonPath("$.onboardingCompleted").value(true));
    }

    @Test
    void PUT_profile_me_secondCall_updatesExistingProfile() throws Exception {
        String token = authenticateAndGetToken("g-p2", "profile2@test.com");
        String url = "/api/v1/profile/me";

        // First call: maintain
        mockMvc.perform(put(url)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"gender":"male","age":30,"heightCm":175.0,"weightKg":75.0,"goalType":"maintain"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.targetCalories").value(2633));

        // Second call: lose
        mockMvc.perform(put(url)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"gender":"male","age":30,"heightCm":175.0,"weightKg":75.0,"goalType":"lose"}
                    """))
            .andExpect(status().isOk())
            // lose = TDEE - 500 = 2633.06 - 500 = 2133.06 → 2133
            .andExpect(jsonPath("$.targetCalories").value(2133));
    }

    @Test
    void PUT_profile_me_invalidGender_returns400() throws Exception {
        String token = authenticateAndGetToken("g-p3", "profile3@test.com");

        mockMvc.perform(put("/api/v1/profile/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"gender":"alien","age":30,"heightCm":175.0,"weightKg":75.0,"goalType":"maintain"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void PUT_profile_me_ageBelowMinimum_returns400() throws Exception {
        String token = authenticateAndGetToken("g-p4", "profile4@test.com");

        mockMvc.perform(put("/api/v1/profile/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"gender":"male","age":9,"heightCm":175.0,"weightKg":75.0,"goalType":"maintain"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void GET_profile_me_returnsPersistedProfile() throws Exception {
        String token = authenticateAndGetToken("g-p5", "profile5@test.com");

        // Create profile
        mockMvc.perform(put("/api/v1/profile/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"gender":"female","age":25,"heightCm":165.0,"weightKg":60.0,"goalType":"lose"}
                    """))
            .andExpect(status().isOk());

        // Retrieve it
        mockMvc.perform(get("/api/v1/profile/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            // female, 25y, 165cm, 60kg, lose → 1585 cal
            .andExpect(jsonPath("$.targetCalories").value(1585))
            .andExpect(jsonPath("$.gender").value("female"))
            .andExpect(jsonPath("$.goalType").value("lose"));
    }

    @Test
    void GET_profile_me_noProfile_returns404() throws Exception {
        String token = authenticateAndGetToken("g-p6", "profile6@test.com");

        mockMvc.perform(get("/api/v1/profile/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void PUT_profile_me_unauthenticated_returns403() throws Exception {
        mockMvc.perform(put("/api/v1/profile/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"gender":"male","age":30,"heightCm":175.0,"weightKg":75.0,"goalType":"maintain"}
                    """))
            .andExpect(status().isForbidden());
    }
}
