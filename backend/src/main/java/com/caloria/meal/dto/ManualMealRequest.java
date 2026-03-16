package com.caloria.meal.dto;

import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;

public record ManualMealRequest(
        @NotBlank @Size(max = 255) String title,
        String description,
        @NotNull OffsetDateTime mealDateTime,
        @NotNull @Min(0) @Max(10000) Integer finalCalories,
        @NotNull @Min(0) @Max(1000) Integer finalProteinG,
        @NotNull @Min(0) @Max(1000) Integer finalCarbsG,
        @NotNull @Min(0) @Max(1000) Integer finalFatG
) {}
