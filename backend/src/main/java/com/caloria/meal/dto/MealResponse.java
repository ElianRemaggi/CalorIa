package com.caloria.meal.dto;

import com.caloria.meal.domain.MealEntry;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MealResponse(
        UUID id,
        String sourceType,
        String title,
        String description,
        OffsetDateTime mealDatetime,
        Integer estimatedCalories,
        Integer estimatedProteinG,
        Integer estimatedCarbsG,
        Integer estimatedFatG,
        int finalCalories,
        int finalProteinG,
        int finalCarbsG,
        int finalFatG,
        String aiProvider,
        OffsetDateTime createdAt
) {
    public static MealResponse from(MealEntry m) {
        return new MealResponse(
                m.getId(), m.getSourceType(), m.getTitle(), m.getDescription(),
                m.getMealDatetime(), m.getEstimatedCalories(), m.getEstimatedProteinG(),
                m.getEstimatedCarbsG(), m.getEstimatedFatG(), m.getFinalCalories(),
                m.getFinalProteinG(), m.getFinalCarbsG(), m.getFinalFatG(),
                m.getAiProvider(), m.getCreatedAt()
        );
    }
}
