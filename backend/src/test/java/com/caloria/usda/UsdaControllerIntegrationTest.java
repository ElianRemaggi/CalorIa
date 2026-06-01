package com.caloria.usda;

import com.caloria.BaseIntegrationTest;
import com.caloria.usda.dto.UsdaFoodItem;
import com.caloria.usda.dto.UsdaSearchResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UsdaControllerIntegrationTest extends BaseIntegrationTest {

    @MockBean
    private UsdaService usdaService;

    // ------------------------------------------------------------------
    // Happy path
    // ------------------------------------------------------------------

    @Test
    void GET_usda_search_authenticated_returns200WithFoodsArray() throws Exception {
        String token = authenticateAndGetToken("g-u1", "usda1@test.com");

        UsdaFoodItem chickenItem = new UsdaFoodItem(
                "171477",
                "Chicken, broilers or fryers, breast, meat only, cooked, roasted",
                165,
                31,
                0,
                4
        );
        when(usdaService.search("chicken", 5))
                .thenReturn(new UsdaSearchResponse(List.of(chickenItem)));

        mockMvc.perform(get("/api/v1/usda/search?query=chicken")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.foods").isArray())
                .andExpect(jsonPath("$.foods.length()").value(1))
                .andExpect(jsonPath("$.foods[0].fdcId").value("171477"))
                .andExpect(jsonPath("$.foods[0].description").value(
                        "Chicken, broilers or fryers, breast, meat only, cooked, roasted"))
                .andExpect(jsonPath("$.foods[0].calories").value(165))
                .andExpect(jsonPath("$.foods[0].proteinG").value(31))
                .andExpect(jsonPath("$.foods[0].carbsG").value(0))
                .andExpect(jsonPath("$.foods[0].fatG").value(4));
    }

    @Test
    void GET_usda_search_withExplicitPageSize_passesPageSizeToService() throws Exception {
        String token = authenticateAndGetToken("g-u2", "usda2@test.com");

        when(usdaService.search("apple", 3))
                .thenReturn(new UsdaSearchResponse(List.of(
                        new UsdaFoodItem("1102644", "Apples, raw, with skin", 52, 0, 14, 0)
                )));

        mockMvc.perform(get("/api/v1/usda/search?query=apple&pageSize=3")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.foods.length()").value(1))
                .andExpect(jsonPath("$.foods[0].fdcId").value("1102644"));
    }

    @Test
    void GET_usda_search_serviceReturnsEmpty_returns200WithEmptyArray() throws Exception {
        String token = authenticateAndGetToken("g-u3", "usda3@test.com");

        when(usdaService.search("xyznonexistentfood", 5))
                .thenReturn(new UsdaSearchResponse(List.of()));

        mockMvc.perform(get("/api/v1/usda/search?query=xyznonexistentfood")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.foods").isArray())
                .andExpect(jsonPath("$.foods.length()").value(0));
    }

    // ------------------------------------------------------------------
    // Validation errors
    // ------------------------------------------------------------------

    @Test
    void GET_usda_search_missingQueryParam_returns400() throws Exception {
        String token = authenticateAndGetToken("g-u4", "usda4@test.com");

        mockMvc.perform(get("/api/v1/usda/search")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void GET_usda_search_blankQuery_returns400() throws Exception {
        String token = authenticateAndGetToken("g-u5", "usda5@test.com");

        mockMvc.perform(get("/api/v1/usda/search?query=")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void GET_usda_search_pageSizeAboveMax_returns400() throws Exception {
        String token = authenticateAndGetToken("g-u6", "usda6@test.com");

        mockMvc.perform(get("/api/v1/usda/search?query=chicken&pageSize=11")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void GET_usda_search_pageSizeBelowMin_returns400() throws Exception {
        String token = authenticateAndGetToken("g-u7", "usda7@test.com");

        mockMvc.perform(get("/api/v1/usda/search?query=chicken&pageSize=0")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    // ------------------------------------------------------------------
    // Authentication
    // ------------------------------------------------------------------

    @Test
    void GET_usda_search_unauthenticated_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/usda/search?query=chicken"))
                .andExpect(status().isForbidden());
    }
}
