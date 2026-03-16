package com.caloria.meal;

import com.caloria.common.SecurityUtils;
import com.caloria.meal.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/meals")
@RequiredArgsConstructor
@Tag(name = "Meals")
@SecurityRequirement(name = "bearerAuth")
public class MealController {

    private final MealService mealService;

    @PostMapping("/manual")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a manual meal entry")
    public ResponseEntity<MealResponse> createManual(@Valid @RequestBody ManualMealRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mealService.createManual(SecurityUtils.getCurrentUserId(), request));
    }

    @PostMapping("/photo")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a meal entry from AI photo analysis")
    public ResponseEntity<MealResponse> createFromPhoto(@Valid @RequestBody PhotoMealRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mealService.createFromPhoto(SecurityUtils.getCurrentUserId(), request));
    }

    @GetMapping
    @Operation(summary = "Get meals for a specific day")
    public ResponseEntity<List<MealResponse>> getMealsForDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(mealService.getMealsForDay(SecurityUtils.getCurrentUserId(), date));
    }

    @PutMapping("/{mealId}")
    @Operation(summary = "Update a meal entry")
    public ResponseEntity<MealResponse> updateMeal(
            @PathVariable UUID mealId,
            @Valid @RequestBody MealUpdateRequest request) {
        return ResponseEntity.ok(mealService.updateMeal(SecurityUtils.getCurrentUserId(), mealId, request));
    }

    @DeleteMapping("/{mealId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a meal entry")
    public ResponseEntity<Void> deleteMeal(@PathVariable UUID mealId) {
        mealService.deleteMeal(SecurityUtils.getCurrentUserId(), mealId);
        return ResponseEntity.noContent().build();
    }
}
