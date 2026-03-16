package com.caloria.profile;

import com.caloria.profile.dto.ProfileRequest;
import com.caloria.profile.dto.NutritionTargets;

import java.math.BigDecimal;

public final class NutritionCalculator {

    private NutritionCalculator() {}

    public static NutritionTargets calculate(ProfileRequest request) {
        double bmr = calculateBmr(
                request.gender(),
                request.age(),
                request.heightCm().doubleValue(),
                request.weightKg().doubleValue()
        );

        // Moderate activity factor (1.55)
        double tdee = bmr * 1.55;

        double targetCalories = switch (request.goalType()) {
            case "lose" -> tdee - 500;
            case "gain" -> tdee + 300;
            default -> tdee; // maintain
        };

        // Ensure minimum
        targetCalories = Math.max(targetCalories, 1200);

        // Macros: Protein 30%, Carbs 40%, Fat 30%
        int proteinG = (int) Math.round((targetCalories * 0.30) / 4.0);  // 4 kcal/g
        int carbsG   = (int) Math.round((targetCalories * 0.40) / 4.0);  // 4 kcal/g
        int fatG     = (int) Math.round((targetCalories * 0.30) / 9.0);  // 9 kcal/g

        return new NutritionTargets((int) Math.round(targetCalories), proteinG, carbsG, fatG);
    }

    private static double calculateBmr(String gender, int age, double heightCm, double weightKg) {
        // Mifflin-St Jeor
        if ("female".equalsIgnoreCase(gender)) {
            return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
        } else {
            return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
        }
    }
}
