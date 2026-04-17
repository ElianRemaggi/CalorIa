package com.caloria.history;

import com.caloria.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HistoryControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void GET_history_daily_returnsCorrectSummary() throws Exception {
        String token = authenticateAndGetToken("g-h1", "hist1@test.com");
        createManualMeal(token, "Breakfast", "2025-03-15T08:00:00Z", 300, 20, 40, 8);
        createManualMeal(token, "Lunch",     "2025-03-15T13:00:00Z", 500, 35, 60, 15);

        mockMvc.perform(get("/api/v1/history/daily?date=2025-03-15")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.date").value("2025-03-15"))
            .andExpect(jsonPath("$.totalCalories").value(800))
            .andExpect(jsonPath("$.totalProteinG").value(55))
            .andExpect(jsonPath("$.meals", hasSize(2)));
    }

    @Test
    void GET_history_weekly_returns7Entries() throws Exception {
        String token = authenticateAndGetToken("g-h2", "hist2@test.com");

        mockMvc.perform(get("/api/v1/history/weekly?weekStart=2025-03-10")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(7)))
            .andExpect(jsonPath("$[0].date").value("2025-03-10"))
            .andExpect(jsonPath("$[6].date").value("2025-03-16"));
    }

    @Test
    void GET_history_weekly_emptyDaysIncluded() throws Exception {
        String token = authenticateAndGetToken("g-h3", "hist3@test.com");
        // Only a meal on Wednesday (index 2 of Mon-Sun week starting 2025-03-10)
        createManualMeal(token, "Wednesday Meal", "2025-03-12T12:00:00Z", 600, 40, 70, 20);

        mockMvc.perform(get("/api/v1/history/weekly?weekStart=2025-03-10")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(7)))
            .andExpect(jsonPath("$[2].totalCalories").value(600))
            .andExpect(jsonPath("$[0].totalCalories").value(0))
            .andExpect(jsonPath("$[6].totalCalories").value(0));
    }

    @Test
    void GET_history_monthly_returnsCorrectDayCount_february() throws Exception {
        String token = authenticateAndGetToken("g-h4", "hist4@test.com");

        mockMvc.perform(get("/api/v1/history/monthly?year=2025&month=2")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(28)));
    }

    @Test
    void GET_history_monthly_returnsCorrectDayCount_march() throws Exception {
        String token = authenticateAndGetToken("g-h5", "hist5@test.com");

        mockMvc.perform(get("/api/v1/history/monthly?year=2025&month=3")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(31)));
    }

    @Test
    void GET_history_daily_doesNotLeakOtherUsersMeals() throws Exception {
        String tokenA = authenticateAndGetToken("g-h6a", "hist6a@test.com");
        String tokenB = authenticateAndGetToken("g-h6b", "hist6b@test.com");

        createManualMeal(tokenA, "User A Meal", "2025-03-15T12:00:00Z", 600, 40, 70, 20);

        mockMvc.perform(get("/api/v1/history/daily?date=2025-03-15")
                .header("Authorization", "Bearer " + tokenB))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalCalories").value(0))
            .andExpect(jsonPath("$.meals", hasSize(0)));
    }

    @Test
    void GET_history_daily_mealAtUtcMidnight_assignedToCorrectDay() throws Exception {
        String token = authenticateAndGetToken("g-h7", "hist7@test.com");

        // Exactly midnight UTC = start of March 15 → belongs to March 15
        createManualMeal(token, "Midnight Meal", "2025-03-15T00:00:00Z", 300, 20, 40, 8);
        // One second before midnight = end of March 14 → belongs to March 14
        createManualMeal(token, "Late Night",   "2025-03-14T23:59:59Z", 200, 15, 25, 6);

        // Query March 15 → should only see "Midnight Meal"
        mockMvc.perform(get("/api/v1/history/daily?date=2025-03-15")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalCalories").value(300))
            .andExpect(jsonPath("$.meals", hasSize(1)))
            .andExpect(jsonPath("$.meals[0].title").value("Midnight Meal"));

        // Query March 14 → should only see "Late Night"
        mockMvc.perform(get("/api/v1/history/daily?date=2025-03-14")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalCalories").value(200))
            .andExpect(jsonPath("$.meals", hasSize(1)));
    }

    // --- helper ---

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
