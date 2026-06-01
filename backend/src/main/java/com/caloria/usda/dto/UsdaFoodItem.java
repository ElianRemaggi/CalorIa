package com.caloria.usda.dto;

public record UsdaFoodItem(
        String fdcId,
        String description,
        Integer calories,
        Integer proteinG,
        Integer carbsG,
        Integer fatG
) {}
