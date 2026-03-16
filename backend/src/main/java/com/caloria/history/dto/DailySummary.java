package com.caloria.history.dto;

import com.caloria.meal.dto.MealResponse;

import java.time.LocalDate;
import java.util.List;

public record DailySummary(
        LocalDate date,
        int totalCalories,
        int totalProteinG,
        int totalCarbsG,
        int totalFatG,
        List<MealResponse> meals
) {}
