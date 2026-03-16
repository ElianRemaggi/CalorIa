package com.caloria.meal.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public record MealUpdateRequest(
        @Size(max = 255) String title,
        String description,
        OffsetDateTime mealDateTime,
        @Min(0) @Max(10000) Integer finalCalories,
        @Min(0) @Max(1000) Integer finalProteinG,
        @Min(0) @Max(1000) Integer finalCarbsG,
        @Min(0) @Max(1000) Integer finalFatG
) {}
