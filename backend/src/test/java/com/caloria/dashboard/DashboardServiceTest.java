package com.caloria.dashboard;

import com.caloria.dashboard.dto.DashboardResponse;
import com.caloria.meal.MealEntryRepository;
import com.caloria.meal.domain.MealEntry;
import com.caloria.profile.ProfileRepository;
import com.caloria.profile.domain.UserProfile;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private MealEntryRepository mealEntryRepository;

    @Mock
    private ProfileRepository profileRepository;

    @InjectMocks
    private DashboardService dashboardService;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final LocalDate DATE = LocalDate.of(2025, 3, 15);

    @Test
    void getDashboard_withProfile_usesProfileTargets() {
        UserProfile profile = profileWithTargets(2500, 180, 250, 80);
        when(profileRepository.findByUserId(USER_ID)).thenReturn(Optional.of(profile));

        MealEntry meal = mealEntry(700, 50, 80, 25);
        when(mealEntryRepository.findMealsInRange(eq(USER_ID), any(), any()))
                .thenReturn(List.of(meal));

        DashboardResponse r = dashboardService.getDashboard(USER_ID, DATE);

        assertThat(r.targetCalories()).isEqualTo(2500);
        assertThat(r.consumedCalories()).isEqualTo(700);
        assertThat(r.remainingCalories()).isEqualTo(1800);
        assertThat(r.consumedProteinG()).isEqualTo(50);
        assertThat(r.remainingProteinG()).isEqualTo(130);
        assertThat(r.consumedCarbsG()).isEqualTo(80);
        assertThat(r.remainingCarbsG()).isEqualTo(170);
        assertThat(r.consumedFatG()).isEqualTo(25);
        assertThat(r.remainingFatG()).isEqualTo(55);
    }

    @Test
    void getDashboard_withNoProfile_usesDefaultTargets() {
        when(profileRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());
        when(mealEntryRepository.findMealsInRange(any(), any(), any())).thenReturn(List.of());

        DashboardResponse r = dashboardService.getDashboard(USER_ID, DATE);

        assertThat(r.targetCalories()).isEqualTo(2000);
        assertThat(r.targetProteinG()).isEqualTo(150);
        assertThat(r.targetCarbsG()).isEqualTo(200);
        assertThat(r.targetFatG()).isEqualTo(65);
    }

    @Test
    void getDashboard_withNoMeals_allConsumedFieldsAreZero() {
        when(profileRepository.findByUserId(USER_ID))
                .thenReturn(Optional.of(profileWithTargets(2000, 150, 200, 65)));
        when(mealEntryRepository.findMealsInRange(any(), any(), any())).thenReturn(List.of());

        DashboardResponse r = dashboardService.getDashboard(USER_ID, DATE);

        assertThat(r.consumedCalories()).isZero();
        assertThat(r.consumedProteinG()).isZero();
        assertThat(r.consumedCarbsG()).isZero();
        assertThat(r.consumedFatG()).isZero();
    }

    @Test
    void getDashboard_withMultipleMeals_aggregatesCorrectly() {
        when(profileRepository.findByUserId(USER_ID))
                .thenReturn(Optional.of(profileWithTargets(2000, 150, 200, 65)));
        when(mealEntryRepository.findMealsInRange(any(), any(), any())).thenReturn(List.of(
                mealEntry(300, 20, 40, 10),
                mealEntry(500, 35, 60, 15),
                mealEntry(200, 15, 25, 8)
        ));

        DashboardResponse r = dashboardService.getDashboard(USER_ID, DATE);

        assertThat(r.consumedCalories()).isEqualTo(1000);
        assertThat(r.consumedProteinG()).isEqualTo(70);
        assertThat(r.consumedCarbsG()).isEqualTo(125);
        assertThat(r.consumedFatG()).isEqualTo(33);
    }

    @Test
    void getDashboard_queriesCorrectUtcRange() {
        when(profileRepository.findByUserId(any())).thenReturn(Optional.empty());
        when(mealEntryRepository.findMealsInRange(any(), any(), any())).thenReturn(List.of());

        dashboardService.getDashboard(USER_ID, DATE);

        OffsetDateTime expectedStart = DATE.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime expectedEnd   = expectedStart.plusDays(1);

        ArgumentCaptor<OffsetDateTime> startCap = ArgumentCaptor.forClass(OffsetDateTime.class);
        ArgumentCaptor<OffsetDateTime> endCap   = ArgumentCaptor.forClass(OffsetDateTime.class);
        verify(mealEntryRepository).findMealsInRange(eq(USER_ID), startCap.capture(), endCap.capture());

        assertThat(startCap.getValue()).isEqualTo(expectedStart);
        assertThat(endCap.getValue()).isEqualTo(expectedEnd);
    }

    @Test
    void getDashboard_remainingCanBeNegative_whenOverTarget() {
        when(profileRepository.findByUserId(USER_ID))
                .thenReturn(Optional.of(profileWithTargets(2000, 150, 200, 65)));
        when(mealEntryRepository.findMealsInRange(any(), any(), any()))
                .thenReturn(List.of(mealEntry(2500, 200, 300, 80)));

        DashboardResponse r = dashboardService.getDashboard(USER_ID, DATE);

        assertThat(r.remainingCalories()).isEqualTo(-500);
        assertThat(r.remainingProteinG()).isEqualTo(-50);
    }

    @Test
    void getDashboard_responseContainsCorrectDate() {
        when(profileRepository.findByUserId(any())).thenReturn(Optional.empty());
        when(mealEntryRepository.findMealsInRange(any(), any(), any())).thenReturn(List.of());

        DashboardResponse r = dashboardService.getDashboard(USER_ID, DATE);

        assertThat(r.date()).isEqualTo(DATE);
    }

    // --- helpers ---

    private UserProfile profileWithTargets(int cal, int prot, int carbs, int fat) {
        UserProfile p = new UserProfile();
        p.setTargetCalories(cal);
        p.setTargetProteinG(prot);
        p.setTargetCarbsG(carbs);
        p.setTargetFatG(fat);
        return p;
    }

    private MealEntry mealEntry(int cal, int prot, int carbs, int fat) {
        return MealEntry.builder()
                .id(UUID.randomUUID())
                .finalCalories(cal)
                .finalProteinG(prot)
                .finalCarbsG(carbs)
                .finalFatG(fat)
                .mealDatetime(OffsetDateTime.now(ZoneOffset.UTC))
                .sourceType("manual")
                .title("meal")
                .build();
    }
}
