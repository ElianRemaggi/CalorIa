package com.caloria.dashboard;

import com.caloria.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DashboardControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void GET_dashboard_withProfileAndMeals_returnsCorrectRemainingValues() throws Exception {
        // male, 30y, 175cm, 75kg, maintain → targets: cal=2633, prot=197, carbs=263, fat=88
        String token = authenticateAndGetToken("g-d1", "dash1@test.com");
        createProfile(token, "male", 30, 175.0, 75.0, "maintain");

        // Create two meals totaling 1200 cal / 80 protein / 100 carbs / 40 fat
        createManualMeal(token, "Meal A", "2025-03-15T08:00:00Z", 700, 45, 60, 22);
        createManualMeal(token, "Meal B", "2025-03-15T13:00:00Z", 500, 35, 40, 18);

        mockMvc.perform(get("/api/v1/dashboard?date=2025-03-15")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.date").value("2025-03-15"))
            .andExpect(jsonPath("$.targetCalories").value(2633))
            .andExpect(jsonPath("$.consumedCalories").value(1200))
            .andExpect(jsonPath("$.remainingCalories").value(1433))
            .andExpect(jsonPath("$.consumedProteinG").value(80))
            .andExpect(jsonPath("$.remainingProteinG").value(117));
    }

    @Test
    void GET_dashboard_withNoProfile_usesDefaultTargets() throws Exception {
        String token = authenticateAndGetToken("g-d2", "dash2@test.com");
        // No profile created

        mockMvc.perform(get("/api/v1/dashboard?date=2025-03-15")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.targetCalories").value(2000))
            .andExpect(jsonPath("$.targetProteinG").value(150))
            .andExpect(jsonPath("$.targetCarbsG").value(200))
            .andExpect(jsonPath("$.targetFatG").value(65));
    }

    @Test
    void GET_dashboard_withNoMeals_allConsumedAreZero() throws Exception {
        String token = authenticateAndGetToken("g-d3", "dash3@test.com");
        createProfile(token, "male", 30, 175.0, 75.0, "maintain");

        mockMvc.perform(get("/api/v1/dashboard?date=2025-03-15")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.consumedCalories").value(0))
            .andExpect(jsonPath("$.consumedProteinG").value(0))
            .andExpect(jsonPath("$.consumedCarbsG").value(0))
            .andExpect(jsonPath("$.consumedFatG").value(0));
    }

    @Test
    void GET_dashboard_doesNotIncludeOtherUsersMeals() throws Exception {
        String tokenA = authenticateAndGetToken("g-d4a", "dash4a@test.com");
        String tokenB = authenticateAndGetToken("g-d4b", "dash4b@test.com");

        // User B creates a meal on the same date
        createManualMeal(tokenB, "User B Meal", "2025-03-15T12:00:00Z", 800, 60, 90, 25);

        // User A's dashboard should not include User B's meal
        mockMvc.perform(get("/api/v1/dashboard?date=2025-03-15")
                .header("Authorization", "Bearer " + tokenA))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.consumedCalories").value(0));
    }

    @Test
    void GET_dashboard_unauthenticated_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard?date=2025-03-15"))
            .andExpect(status().isForbidden());
    }

    // --- helpers ---

    private void createProfile(String token, String gender, int age,
                               double height, double weight, String goal) throws Exception {
        mockMvc.perform(put("/api/v1/profile/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"gender":"%s","age":%d,"heightCm":%s,"weightKg":%s,"goalType":"%s"}
                    """.formatted(gender, age, height, weight, goal)))
            .andExpect(status().isOk());
    }

    private void createManualMeal(String token, String title, String dateTime,
                                  int cal, int prot, int carbs, int fat) throws Exception {
        mockMvc.perform(post("/api/v1/meals/manual")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"%s","mealDateTime":"%s",
                     "finalCalories":%d,"finalProteinG":%d,"finalCarbsG":%d,"finalFatG":%d}
                    """.formatted(title, dateTime, cal, prot, carbs, fat)))
            .andExpect(status().isCreated());
    }
}
