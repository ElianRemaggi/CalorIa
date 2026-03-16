package com.caloria.dashboard;

import com.caloria.dashboard.dto.DashboardResponse;
import com.caloria.meal.MealEntryRepository;
import com.caloria.meal.domain.MealEntry;
import com.caloria.profile.ProfileRepository;
import com.caloria.profile.domain.UserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final MealEntryRepository mealEntryRepository;
    private final ProfileRepository profileRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UUID userId, LocalDate date) {
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElse(null);

        int targetCalories = profile != null ? profile.getTargetCalories() : 2000;
        int targetProtein  = profile != null ? profile.getTargetProteinG() : 150;
        int targetCarbs    = profile != null ? profile.getTargetCarbsG() : 200;
        int targetFat      = profile != null ? profile.getTargetFatG() : 65;

        OffsetDateTime start = date.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end   = start.plusDays(1);

        List<MealEntry> meals = mealEntryRepository.findMealsInRange(userId, start, end);

        int consumed   = meals.stream().mapToInt(MealEntry::getFinalCalories).sum();
        int protein    = meals.stream().mapToInt(MealEntry::getFinalProteinG).sum();
        int carbs      = meals.stream().mapToInt(MealEntry::getFinalCarbsG).sum();
        int fat        = meals.stream().mapToInt(MealEntry::getFinalFatG).sum();

        return new DashboardResponse(
                date,
                targetCalories, consumed,    targetCalories - consumed,
                targetProtein,  protein,     targetProtein - protein,
                targetCarbs,    carbs,       targetCarbs - carbs,
                targetFat,      fat,         targetFat - fat
        );
    }
}
