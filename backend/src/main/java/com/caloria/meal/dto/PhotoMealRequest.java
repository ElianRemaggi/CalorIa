package com.caloria.meal.dto;

import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;

public record PhotoMealRequest(
        @NotBlank @Size(max = 255) String title,
        String description,
        @NotNull OffsetDateTime mealDateTime,
        Integer estimatedCalories,
        Integer estimatedProteinG,
        Integer estimatedCarbsG,
        Integer estimatedFatG,
        @NotNull @Min(0) @Max(10000) Integer finalCalories,
        @NotNull @Min(0) @Max(1000) Integer finalProteinG,
        @NotNull @Min(0) @Max(1000) Integer finalCarbsG,
        @NotNull @Min(0) @Max(1000) Integer finalFatG,
        @NotBlank String aiProvider,
        AiDebugInfo aiDebug
) {}
