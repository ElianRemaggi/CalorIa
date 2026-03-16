package com.caloria.dashboard.dto;

import java.time.LocalDate;

public record DashboardResponse(
        LocalDate date,
        int targetCalories,
        int consumedCalories,
        int remainingCalories,
        int targetProteinG,
        int consumedProteinG,
        int remainingProteinG,
        int targetCarbsG,
        int consumedCarbsG,
        int remainingCarbsG,
        int targetFatG,
        int consumedFatG,
        int remainingFatG
) {}
