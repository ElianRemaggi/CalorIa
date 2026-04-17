package com.caloria.history;

import com.caloria.history.dto.DailySummary;
import com.caloria.meal.MealEntryRepository;
import com.caloria.meal.domain.MealEntry;
import com.caloria.user.domain.AppUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HistoryServiceTest {

    @Mock
    private MealEntryRepository mealEntryRepository;

    @InjectMocks
    private HistoryService historyService;

    private static final UUID USER_ID = UUID.randomUUID();

    @Test
    void getDailyHistory_returnsSummaryForSingleDay() {
        LocalDate date = LocalDate.of(2025, 3, 15);
        MealEntry m1 = mealAt("2025-03-15T08:00:00Z", 300, 20, 40, 8);
        MealEntry m2 = mealAt("2025-03-15T13:00:00Z", 500, 35, 60, 15);
        when(mealEntryRepository.findMealsInRange(eq(USER_ID), any(), any()))
                .thenReturn(List.of(m1, m2));

        DailySummary summary = historyService.getDailyHistory(USER_ID, date);

        assertThat(summary.date()).isEqualTo(date);
        assertThat(summary.totalCalories()).isEqualTo(800);
        assertThat(summary.totalProteinG()).isEqualTo(55);
        assertThat(summary.meals()).hasSize(2);
    }

    @Test
    void getDailyHistory_withNoMeals_returnsSummaryWithZeroTotals() {
        when(mealEntryRepository.findMealsInRange(any(), any(), any())).thenReturn(List.of());

        DailySummary summary = historyService.getDailyHistory(USER_ID, LocalDate.now());

        assertThat(summary.totalCalories()).isZero();
        assertThat(summary.totalProteinG()).isZero();
        assertThat(summary.meals()).isEmpty();
    }

    @Test
    void getWeeklyHistory_returns7DailySummaries() {
        LocalDate weekStart = LocalDate.of(2025, 3, 10);
        when(mealEntryRepository.findMealsInRange(eq(USER_ID), any(), any()))
                .thenReturn(List.of());

        List<DailySummary> result = historyService.getWeeklyHistory(USER_ID, weekStart);

        assertThat(result).hasSize(7);
        assertThat(result.get(0).date()).isEqualTo(LocalDate.of(2025, 3, 10));
        assertThat(result.get(6).date()).isEqualTo(LocalDate.of(2025, 3, 16));
    }

    @Test
    void getWeeklyHistory_includesEmptyDays() {
        LocalDate weekStart = LocalDate.of(2025, 3, 10);
        // Only a meal on day 3 (2025-03-12)
        MealEntry meal = mealAt("2025-03-12T12:00:00Z", 500, 30, 60, 15);
        when(mealEntryRepository.findMealsInRange(eq(USER_ID), any(), any()))
                .thenReturn(List.of(meal));

        List<DailySummary> result = historyService.getWeeklyHistory(USER_ID, weekStart);

        assertThat(result).hasSize(7);
        // Day with meal
        assertThat(result.get(2).totalCalories()).isEqualTo(500);
        // Days without meals
        assertThat(result.get(0).totalCalories()).isZero();
        assertThat(result.get(6).totalCalories()).isZero();
    }

    @Test
    void getWeeklyHistory_mealsGroupedByUtcDate() {
        LocalDate weekStart = LocalDate.of(2025, 3, 10);
        // Both meals are UTC date March 12
        MealEntry m1 = mealAt("2025-03-12T06:00:00Z", 300, 20, 40, 10);
        MealEntry m2 = mealAt("2025-03-12T19:00:00Z", 400, 25, 50, 12);
        when(mealEntryRepository.findMealsInRange(eq(USER_ID), any(), any()))
                .thenReturn(List.of(m1, m2));

        List<DailySummary> result = historyService.getWeeklyHistory(USER_ID, weekStart);

        DailySummary march12 = result.get(2); // index 2 = March 12
        assertThat(march12.date()).isEqualTo(LocalDate.of(2025, 3, 12));
        assertThat(march12.totalCalories()).isEqualTo(700);
        assertThat(march12.meals()).hasSize(2);
    }

    @Test
    void getMonthlyHistory_returnsCorrectDayCountForFebruary() {
        when(mealEntryRepository.findMealsInRange(eq(USER_ID), any(), any()))
                .thenReturn(List.of());

        List<DailySummary> result = historyService.getMonthlyHistory(USER_ID, 2025, 2);

        assertThat(result).hasSize(28); // 2025 is not a leap year
    }

    @Test
    void getMonthlyHistory_returnsCorrectDayCountForMarch() {
        when(mealEntryRepository.findMealsInRange(eq(USER_ID), any(), any()))
                .thenReturn(List.of());

        List<DailySummary> result = historyService.getMonthlyHistory(USER_ID, 2025, 3);

        assertThat(result).hasSize(31);
    }

    @Test
    void getMonthlyHistory_includesEmptyDaysAtStartAndEnd() {
        // Only one meal on the 15th
        MealEntry meal = mealAt("2025-03-15T12:00:00Z", 600, 40, 70, 20);
        when(mealEntryRepository.findMealsInRange(eq(USER_ID), any(), any()))
                .thenReturn(List.of(meal));

        List<DailySummary> result = historyService.getMonthlyHistory(USER_ID, 2025, 3);

        assertThat(result).hasSize(31);
        // Days before the 15th (index 0–13) should be zero
        assertThat(result.get(0).totalCalories()).isZero();
        assertThat(result.get(13).totalCalories()).isZero();
        // Day 15 (index 14) should have the meal
        assertThat(result.get(14).totalCalories()).isEqualTo(600);
        // Days after (index 15+) should be zero
        assertThat(result.get(15).totalCalories()).isZero();
        assertThat(result.get(30).totalCalories()).isZero();
    }

    @Test
    void buildRangeSummaries_mealAtUtcMidnight_assignedToCorrectDay() {
        LocalDate weekStart = LocalDate.of(2025, 3, 10);
        // Exactly at 2025-03-15T00:00:00Z → belongs to March 15 (index 5)
        MealEntry atMidnight    = mealAt("2025-03-15T00:00:00Z", 400, 30, 50, 12);
        // Just before midnight → belongs to March 14 (index 4)
        MealEntry beforeMidnight = mealAt("2025-03-14T23:59:59Z", 300, 20, 40, 10);

        when(mealEntryRepository.findMealsInRange(eq(USER_ID), any(), any()))
                .thenReturn(List.of(atMidnight, beforeMidnight));

        List<DailySummary> result = historyService.getWeeklyHistory(USER_ID, weekStart);

        assertThat(result.get(5).date()).isEqualTo(LocalDate.of(2025, 3, 15));
        assertThat(result.get(5).totalCalories()).isEqualTo(400);

        assertThat(result.get(4).date()).isEqualTo(LocalDate.of(2025, 3, 14));
        assertThat(result.get(4).totalCalories()).isEqualTo(300);
    }

    // --- helper ---

    private MealEntry mealAt(String isoDateTime, int cal, int prot, int carbs, int fat) {
        AppUser user = AppUser.builder()
                .id(USER_ID).googleId("g").email("e@e.com").fullName("U").authProvider("google").build();
        return MealEntry.builder()
                .id(UUID.randomUUID())
                .user(user)
                .sourceType("manual")
                .title("meal")
                .mealDatetime(OffsetDateTime.parse(isoDateTime))
                .finalCalories(cal)
                .finalProteinG(prot)
                .finalCarbsG(carbs)
                .finalFatG(fat)
                .build();
    }
}
