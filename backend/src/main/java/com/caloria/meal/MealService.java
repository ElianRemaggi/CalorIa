package com.caloria.meal;

import com.caloria.common.exception.EntityNotFoundException;
import com.caloria.common.exception.ForbiddenException;
import com.caloria.meal.domain.MealAiResponse;
import com.caloria.meal.domain.MealEntry;
import com.caloria.meal.dto.*;
import com.caloria.user.UserService;
import com.caloria.user.domain.AppUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MealService {

    private final MealEntryRepository mealEntryRepository;
    private final MealAiResponseRepository mealAiResponseRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    @Transactional
    public MealResponse createManual(UUID userId, ManualMealRequest request) {
        AppUser user = userService.getById(userId);

        MealEntry meal = MealEntry.builder()
                .user(user)
                .sourceType("manual")
                .title(request.title())
                .description(request.description())
                .mealDatetime(request.mealDateTime())
                .finalCalories(request.finalCalories())
                .finalProteinG(request.finalProteinG())
                .finalCarbsG(request.finalCarbsG())
                .finalFatG(request.finalFatG())
                .build();

        return MealResponse.from(mealEntryRepository.save(meal));
    }

    @Transactional
    public MealResponse createFromPhoto(UUID userId, PhotoMealRequest request) {
        AppUser user = userService.getById(userId);

        MealEntry meal = MealEntry.builder()
                .user(user)
                .sourceType("photo")
                .title(request.title())
                .description(request.description())
                .mealDatetime(request.mealDateTime())
                .estimatedCalories(request.estimatedCalories())
                .estimatedProteinG(request.estimatedProteinG())
                .estimatedCarbsG(request.estimatedCarbsG())
                .estimatedFatG(request.estimatedFatG())
                .finalCalories(request.finalCalories())
                .finalProteinG(request.finalProteinG())
                .finalCarbsG(request.finalCarbsG())
                .finalFatG(request.finalFatG())
                .aiProvider(request.aiProvider())
                .build();

        MealEntry saved = mealEntryRepository.save(meal);

        if (request.aiDebug() != null) {
            try {
                String parsedJson = objectMapper.writeValueAsString(request.aiDebug().parsedResponse());
                MealAiResponse aiResponse = MealAiResponse.builder()
                        .mealEntry(saved)
                        .provider(request.aiProvider())
                        .promptText(request.aiDebug().promptText() != null ? request.aiDebug().promptText() : "")
                        .rawResponse(request.aiDebug().rawResponse() != null ? request.aiDebug().rawResponse() : "")
                        .parsedResponseJson(parsedJson)
                        .build();
                mealAiResponseRepository.save(aiResponse);
            } catch (Exception e) {
                log.warn("Failed to save AI debug info for meal {}", saved.getId(), e);
            }
        }

        return MealResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<MealResponse> getMealsForDay(UUID userId, LocalDate date) {
        OffsetDateTime start = date.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end = start.plusDays(1);
        return mealEntryRepository.findMealsInRange(userId, start, end)
                .stream().map(MealResponse::from).toList();
    }

    @Transactional
    public MealResponse updateMeal(UUID userId, UUID mealId, MealUpdateRequest request) {
        MealEntry meal = getMealOwnedByUser(userId, mealId);

        if (request.title() != null) meal.setTitle(request.title());
        if (request.description() != null) meal.setDescription(request.description());
        if (request.mealDateTime() != null) meal.setMealDatetime(request.mealDateTime());
        if (request.finalCalories() != null) meal.setFinalCalories(request.finalCalories());
        if (request.finalProteinG() != null) meal.setFinalProteinG(request.finalProteinG());
        if (request.finalCarbsG() != null) meal.setFinalCarbsG(request.finalCarbsG());
        if (request.finalFatG() != null) meal.setFinalFatG(request.finalFatG());

        return MealResponse.from(mealEntryRepository.save(meal));
    }

    @Transactional
    public void deleteMeal(UUID userId, UUID mealId) {
        MealEntry meal = getMealOwnedByUser(userId, mealId);
        mealEntryRepository.delete(meal);
    }

    private MealEntry getMealOwnedByUser(UUID userId, UUID mealId) {
        MealEntry meal = mealEntryRepository.findById(mealId)
                .orElseThrow(() -> new EntityNotFoundException("Meal", mealId));
        if (!meal.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied to meal: " + mealId);
        }
        return meal;
    }
}
