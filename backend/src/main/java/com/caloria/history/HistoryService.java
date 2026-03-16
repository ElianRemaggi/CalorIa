package com.caloria.history;

import com.caloria.history.dto.DailySummary;
import com.caloria.meal.MealEntryRepository;
import com.caloria.meal.domain.MealEntry;
import com.caloria.meal.dto.MealResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final MealEntryRepository mealEntryRepository;

    @Transactional(readOnly = true)
    public DailySummary getDailyHistory(UUID userId, LocalDate date) {
        List<MealEntry> meals = getMealsForRange(userId, date, date.plusDays(1));
        return buildDailySummary(date, meals);
    }

    @Transactional(readOnly = true)
    public List<DailySummary> getWeeklyHistory(UUID userId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(7);
        List<MealEntry> meals = getMealsForRange(userId, weekStart, weekEnd);
        return buildRangeSummaries(weekStart, weekEnd, meals);
    }

    @Transactional(readOnly = true)
    public List<DailySummary> getMonthlyHistory(UUID userId, int year, int month) {
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.with(TemporalAdjusters.firstDayOfNextMonth());
        List<MealEntry> meals = getMealsForRange(userId, monthStart, monthEnd);
        return buildRangeSummaries(monthStart, monthEnd, meals);
    }

    private List<MealEntry> getMealsForRange(UUID userId, LocalDate from, LocalDate to) {
        OffsetDateTime start = from.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end   = to.atStartOfDay().atOffset(ZoneOffset.UTC);
        return mealEntryRepository.findMealsInRange(userId, start, end);
    }

    private List<DailySummary> buildRangeSummaries(LocalDate from, LocalDate to, List<MealEntry> meals) {
        Map<LocalDate, List<MealEntry>> byDay = meals.stream()
                .collect(Collectors.groupingBy(m ->
                        m.getMealDatetime().atZoneSameInstant(ZoneOffset.UTC).toLocalDate()));

        List<DailySummary> result = new ArrayList<>();
        for (LocalDate d = from; d.isBefore(to); d = d.plusDays(1)) {
            List<MealEntry> dayMeals = byDay.getOrDefault(d, List.of());
            result.add(buildDailySummary(d, dayMeals));
        }
        return result;
    }

    private DailySummary buildDailySummary(LocalDate date, List<MealEntry> meals) {
        int calories = meals.stream().mapToInt(MealEntry::getFinalCalories).sum();
        int protein  = meals.stream().mapToInt(MealEntry::getFinalProteinG).sum();
        int carbs    = meals.stream().mapToInt(MealEntry::getFinalCarbsG).sum();
        int fat      = meals.stream().mapToInt(MealEntry::getFinalFatG).sum();
        List<MealResponse> responses = meals.stream().map(MealResponse::from).toList();
        return new DailySummary(date, calories, protein, carbs, fat, responses);
    }
}
