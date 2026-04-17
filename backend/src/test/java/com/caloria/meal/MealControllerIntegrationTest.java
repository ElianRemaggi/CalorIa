package com.caloria.meal;

import com.caloria.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MealControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void POST_meals_manual_authenticated_returns201WithMealResponse() throws Exception {
        String token = authenticateAndGetToken("g-m1", "meal1@test.com");

        mockMvc.perform(post("/api/v1/meals/manual")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "Chicken Salad",
                      "description": "Grilled chicken",
                      "mealDateTime": "2025-03-15T12:00:00Z",
                      "finalCalories": 450,
                      "finalProteinG": 40,
                      "finalCarbsG": 20,
                      "finalFatG": 18
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andExpect(jsonPath("$.sourceType").value("manual"))
            .andExpect(jsonPath("$.title").value("Chicken Salad"))
            .andExpect(jsonPath("$.finalCalories").value(450))
            .andExpect(jsonPath("$.finalProteinG").value(40));
    }

    @Test
    void POST_meals_manual_unauthenticated_returns403() throws Exception {
        mockMvc.perform(post("/api/v1/meals/manual")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"x","mealDateTime":"2025-03-15T12:00:00Z",
                     "finalCalories":300,"finalProteinG":20,"finalCarbsG":30,"finalFatG":10}
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void POST_meals_manual_missingTitle_returns400WithValidationError() throws Exception {
        String token = authenticateAndGetToken("g-m2", "meal2@test.com");

        mockMvc.perform(post("/api/v1/meals/manual")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "mealDateTime": "2025-03-15T12:00:00Z",
                      "finalCalories": 400,
                      "finalProteinG": 20,
                      "finalCarbsG": 30,
                      "finalFatG": 10
                    }
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.details[0].field").value("title"));
    }

    @Test
    void POST_meals_manual_caloriesTooHigh_returns400() throws Exception {
        String token = authenticateAndGetToken("g-m3", "meal3@test.com");

        mockMvc.perform(post("/api/v1/meals/manual")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title":"Huge meal","mealDateTime":"2025-03-15T12:00:00Z",
                     "finalCalories":10001,"finalProteinG":20,"finalCarbsG":30,"finalFatG":10}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void GET_meals_forDay_returnsOnlyMealsForThatUtcDay() throws Exception {
        String token = authenticateAndGetToken("g-m4", "meal4@test.com");

        // Meal within 2025-03-15 UTC → should appear
        createManualMeal(token, "Breakfast", "2025-03-15T07:00:00Z", 300, 20, 40, 8);
        // Meal on day before → should NOT appear
        createManualMeal(token, "Yesterday Dinner", "2025-03-14T23:59:59Z", 500, 35, 60, 15);
        // Meal on day after (exactly midnight = start of March 16) → should NOT appear
        createManualMeal(token, "Next Day", "2025-03-16T00:00:00Z", 400, 25, 50, 12);

        mockMvc.perform(get("/api/v1/meals?date=2025-03-15")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].title").value("Breakfast"));
    }

    @Test
    void GET_meals_forDay_doesNotReturnOtherUsersMeals() throws Exception {
        String tokenA = authenticateAndGetToken("g-m5a", "meal5a@test.com");
        String tokenB = authenticateAndGetToken("g-m5b", "meal5b@test.com");

        createManualMeal(tokenA, "User A Meal", "2025-03-15T12:00:00Z", 400, 30, 50, 12);
        createManualMeal(tokenB, "User B Meal", "2025-03-15T13:00:00Z", 500, 35, 60, 15);

        // User A should only see their own meal
        mockMvc.perform(get("/api/v1/meals?date=2025-03-15")
                .header("Authorization", "Bearer " + tokenA))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].title").value("User A Meal"));
    }

    @Test
    void PUT_meals_mealId_updatesFieldsPartially() throws Exception {
        String token = authenticateAndGetToken("g-m6", "meal6@test.com");

        String mealId = createManualMeal(token, "Original Title", "2025-03-15T12:00:00Z", 400, 30, 50, 12);

        mockMvc.perform(put("/api/v1/meals/" + mealId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title": "Updated Title", "finalCalories": 500}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Updated Title"))
            .andExpect(jsonPath("$.finalCalories").value(500))
            // protein unchanged
            .andExpect(jsonPath("$.finalProteinG").value(30));
    }

    @Test
    void PUT_meals_mealId_byDifferentUser_returns403() throws Exception {
        String tokenA = authenticateAndGetToken("g-m7a", "meal7a@test.com");
        String tokenB = authenticateAndGetToken("g-m7b", "meal7b@test.com");

        String mealId = createManualMeal(tokenA, "User A Meal", "2025-03-15T12:00:00Z", 400, 30, 50, 12);

        mockMvc.perform(put("/api/v1/meals/" + mealId)
                .header("Authorization", "Bearer " + tokenB)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title": "Hacked!"}
                    """))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void PUT_meals_nonExistentId_returns404() throws Exception {
        String token = authenticateAndGetToken("g-m8", "meal8@test.com");
        String randomId = "00000000-0000-0000-0000-000000000000";

        mockMvc.perform(put("/api/v1/meals/" + randomId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title": "Ghost"}
                    """))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void DELETE_meals_mealId_byOwner_returns204AndMealDisappears() throws Exception {
        String token = authenticateAndGetToken("g-m9", "meal9@test.com");

        String mealId = createManualMeal(token, "To Delete", "2025-03-15T12:00:00Z", 300, 20, 40, 10);

        mockMvc.perform(delete("/api/v1/meals/" + mealId)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());

        // Verify it's gone
        mockMvc.perform(get("/api/v1/meals?date=2025-03-15")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void DELETE_meals_mealId_byDifferentUser_returns403() throws Exception {
        String tokenA = authenticateAndGetToken("g-m10a", "meal10a@test.com");
        String tokenB = authenticateAndGetToken("g-m10b", "meal10b@test.com");

        String mealId = createManualMeal(tokenA, "Protected Meal", "2025-03-15T12:00:00Z", 300, 20, 40, 10);

        mockMvc.perform(delete("/api/v1/meals/" + mealId)
                .header("Authorization", "Bearer " + tokenB))
            .andExpect(status().isForbidden());
    }

    // --- helper ---

    /**
     * Creates a manual meal and returns the meal ID from the response.
     */
    private String createManualMeal(String token, String title, String dateTime,
                                    int cal, int prot, int carbs, int fat) throws Exception {
        String response = mockMvc.perform(post("/api/v1/meals/manual")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "title": "%s",
                      "mealDateTime": "%s",
                      "finalCalories": %d,
                      "finalProteinG": %d,
                      "finalCarbsG": %d,
                      "finalFatG": %d
                    }
                    """.formatted(title, dateTime, cal, prot, carbs, fat)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

        return objectMapper.readTree(response).get("id").asText();
    }
}
