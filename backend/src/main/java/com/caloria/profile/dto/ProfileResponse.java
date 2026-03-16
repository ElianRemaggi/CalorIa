package com.caloria.profile.dto;

import com.caloria.profile.domain.UserProfile;

import java.math.BigDecimal;
import java.util.UUID;

public record ProfileResponse(
        UUID userId,
        String gender,
        int age,
        BigDecimal heightCm,
        BigDecimal weightKg,
        String goalType,
        int targetCalories,
        int targetProteinG,
        int targetCarbsG,
        int targetFatG,
        boolean onboardingCompleted
) {
    public static ProfileResponse from(UserProfile p) {
        return new ProfileResponse(
                p.getUser().getId(),
                p.getGender(),
                p.getAge(),
                p.getHeightCm(),
                p.getWeightKg(),
                p.getGoalType(),
                p.getTargetCalories(),
                p.getTargetProteinG(),
                p.getTargetCarbsG(),
                p.getTargetFatG(),
                p.isOnboardingCompleted()
        );
    }
}
