package com.caloria.meal;

import com.caloria.common.exception.EntityNotFoundException;
import com.caloria.common.exception.ForbiddenException;
import com.caloria.meal.domain.MealEntry;
import com.caloria.meal.dto.ManualMealRequest;
import com.caloria.meal.dto.MealResponse;
import com.caloria.meal.dto.MealUpdateRequest;
import com.caloria.meal.dto.PhotoMealRequest;
import com.caloria.user.UserService;
import com.caloria.user.domain.AppUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MealServiceTest {

    @Mock
    private MealEntryRepository mealEntryRepository;

    @Mock
    private MealAiResponseRepository mealAiResponseRepository;

    @Mock
    private UserService userService;

    @Spy
    private ObjectMapper objectMapper;

    @InjectMocks
    private MealService mealService;

    private static final UUID OWNER_ID = UUID.randomUUID();
    private static final UUID OTHER_ID = UUID.randomUUID();
    private static final UUID MEAL_ID  = UUID.randomUUID();

    private AppUser owner;
    private AppUser otherUser;

    @BeforeEach
    void setUp() {
        owner = AppUser.builder()
                .id(OWNER_ID).googleId("g-owner").email("owner@test.com")
                .fullName("Owner").authProvider("google").build();

        otherUser = AppUser.builder()
                .id(OTHER_ID).googleId("g-other").email("other@test.com")
                .fullName("Other").authProvider("google").build();
    }

    // --- createManual ---

    @Test
    void createManual_returnsResponseWithManualSourceType() {
        when(userService.getById(OWNER_ID)).thenReturn(owner);
        when(mealEntryRepository.save(any())).thenAnswer(inv -> {
            MealEntry m = inv.getArgument(0);
            m.setId(MEAL_ID);
            return m;
        });

        ManualMealRequest req = new ManualMealRequest(
                "Chicken Salad", "desc",
                OffsetDateTime.now(ZoneOffset.UTC),
                500, 40, 30, 18);

        MealResponse response = mealService.createManual(OWNER_ID, req);

        assertThat(response.sourceType()).isEqualTo("manual");
        assertThat(response.title()).isEqualTo("Chicken Salad");
        assertThat(response.finalCalories()).isEqualTo(500);
        assertThat(response.finalProteinG()).isEqualTo(40);
        assertThat(response.id()).isEqualTo(MEAL_ID);
    }

    @Test
    void createManual_persistsAllMacroFields() {
        when(userService.getById(OWNER_ID)).thenReturn(owner);
        when(mealEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        OffsetDateTime dt = OffsetDateTime.of(2025, 3, 15, 12, 0, 0, 0, ZoneOffset.UTC);
        ManualMealRequest req = new ManualMealRequest("Pasta", null, dt, 700, 25, 90, 20);

        mealService.createManual(OWNER_ID, req);

        ArgumentCaptor<MealEntry> captor = ArgumentCaptor.forClass(MealEntry.class);
        verify(mealEntryRepository).save(captor.capture());
        MealEntry saved = captor.getValue();

        assertThat(saved.getFinalCalories()).isEqualTo(700);
        assertThat(saved.getFinalProteinG()).isEqualTo(25);
        assertThat(saved.getFinalCarbsG()).isEqualTo(90);
        assertThat(saved.getFinalFatG()).isEqualTo(20);
        assertThat(saved.getMealDatetime()).isEqualTo(dt);
        assertThat(saved.getUser()).isEqualTo(owner);
    }

    // --- createFromPhoto ---

    @Test
    void createFromPhoto_returnsResponseWithPhotoSourceType() {
        when(userService.getById(OWNER_ID)).thenReturn(owner);
        when(mealEntryRepository.save(any())).thenAnswer(inv -> {
            MealEntry m = inv.getArgument(0);
            m.setId(MEAL_ID);
            return m;
        });

        PhotoMealRequest req = new PhotoMealRequest(
                "Pizza", "slice", OffsetDateTime.now(ZoneOffset.UTC),
                600, 20, 70, 25,
                580, 19, 68, 24,
                "openai", null);

        MealResponse response = mealService.createFromPhoto(OWNER_ID, req);

        assertThat(response.sourceType()).isEqualTo("photo");
        assertThat(response.estimatedCalories()).isEqualTo(600);
        assertThat(response.finalCalories()).isEqualTo(580);
    }

    @Test
    void createFromPhoto_withNullAiDebug_doesNotSaveAiResponse() {
        when(userService.getById(OWNER_ID)).thenReturn(owner);
        when(mealEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PhotoMealRequest req = new PhotoMealRequest(
                "Salad", null, OffsetDateTime.now(ZoneOffset.UTC),
                null, null, null, null,
                300, 10, 40, 8,
                "gemini", null);

        mealService.createFromPhoto(OWNER_ID, req);

        verify(mealAiResponseRepository, never()).save(any());
    }

    // --- getMealsForDay ---

    @Test
    void getMealsForDay_queriesCorrectUtcRange() {
        LocalDate date = LocalDate.of(2025, 6, 15);
        OffsetDateTime expectedStart = OffsetDateTime.of(2025, 6, 15, 0, 0, 0, 0, ZoneOffset.UTC);
        OffsetDateTime expectedEnd   = OffsetDateTime.of(2025, 6, 16, 0, 0, 0, 0, ZoneOffset.UTC);

        when(mealEntryRepository.findMealsInRange(eq(OWNER_ID), any(), any()))
                .thenReturn(List.of());

        mealService.getMealsForDay(OWNER_ID, date);

        ArgumentCaptor<OffsetDateTime> startCaptor = ArgumentCaptor.forClass(OffsetDateTime.class);
        ArgumentCaptor<OffsetDateTime> endCaptor   = ArgumentCaptor.forClass(OffsetDateTime.class);
        verify(mealEntryRepository).findMealsInRange(eq(OWNER_ID), startCaptor.capture(), endCaptor.capture());

        assertThat(startCaptor.getValue()).isEqualTo(expectedStart);
        assertThat(endCaptor.getValue()).isEqualTo(expectedEnd);
    }

    @Test
    void getMealsForDay_withNoMeals_returnsEmptyList() {
        when(mealEntryRepository.findMealsInRange(any(), any(), any())).thenReturn(List.of());
        List<MealResponse> result = mealService.getMealsForDay(OWNER_ID, LocalDate.now());
        assertThat(result).isEmpty();
    }

    // --- updateMeal ---

    @Test
    void updateMeal_withPartialFields_updatesOnlyNonNullFields() {
        MealEntry existing = buildMealEntry(OWNER_ID, "Old Title", 500, 40, 60, 15);
        when(mealEntryRepository.findById(MEAL_ID)).thenReturn(Optional.of(existing));
        when(mealEntryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Only updating title and calories; protein/carbs/fat stay null → unchanged
        MealUpdateRequest req = new MealUpdateRequest("New Title", null, null, 600, null, null, null);

        mealService.updateMeal(OWNER_ID, MEAL_ID, req);

        ArgumentCaptor<MealEntry> captor = ArgumentCaptor.forClass(MealEntry.class);
        verify(mealEntryRepository).save(captor.capture());

        assertThat(captor.getValue().getTitle()).isEqualTo("New Title");
        assertThat(captor.getValue().getFinalCalories()).isEqualTo(600);
        assertThat(captor.getValue().getFinalProteinG()).isEqualTo(40);  // unchanged
        assertThat(captor.getValue().getFinalCarbsG()).isEqualTo(60);    // unchanged
    }

    @Test
    void updateMeal_byDifferentUser_throwsForbiddenException() {
        MealEntry existing = buildMealEntry(OWNER_ID, "Title", 500, 40, 60, 15);
        when(mealEntryRepository.findById(MEAL_ID)).thenReturn(Optional.of(existing));

        MealUpdateRequest req = new MealUpdateRequest("Hack", null, null, null, null, null, null);

        assertThatThrownBy(() -> mealService.updateMeal(OTHER_ID, MEAL_ID, req))
                .isInstanceOf(ForbiddenException.class);
        verify(mealEntryRepository, never()).save(any());
    }

    @Test
    void updateMeal_mealNotFound_throwsEntityNotFoundException() {
        when(mealEntryRepository.findById(any())).thenReturn(Optional.empty());

        MealUpdateRequest req = new MealUpdateRequest(null, null, null, null, null, null, null);

        assertThatThrownBy(() -> mealService.updateMeal(OWNER_ID, UUID.randomUUID(), req))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // --- deleteMeal ---

    @Test
    void deleteMeal_byOwner_deletesSuccessfully() {
        MealEntry existing = buildMealEntry(OWNER_ID, "Lunch", 400, 30, 50, 10);
        when(mealEntryRepository.findById(MEAL_ID)).thenReturn(Optional.of(existing));

        mealService.deleteMeal(OWNER_ID, MEAL_ID);

        verify(mealEntryRepository).delete(existing);
    }

    @Test
    void deleteMeal_byDifferentUser_throwsForbiddenExceptionAndDoesNotDelete() {
        MealEntry existing = buildMealEntry(OWNER_ID, "Lunch", 400, 30, 50, 10);
        when(mealEntryRepository.findById(MEAL_ID)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> mealService.deleteMeal(OTHER_ID, MEAL_ID))
                .isInstanceOf(ForbiddenException.class);
        verify(mealEntryRepository, never()).delete(any());
    }

    // --- helper ---

    private MealEntry buildMealEntry(UUID ownerId, String title,
                                     int cal, int prot, int carbs, int fat) {
        AppUser user = AppUser.builder().id(ownerId).googleId("g")
                .email("e@e.com").fullName("U").authProvider("google").build();
        return MealEntry.builder()
                .id(MEAL_ID)
                .user(user)
                .sourceType("manual")
                .title(title)
                .mealDatetime(OffsetDateTime.now(ZoneOffset.UTC))
                .finalCalories(cal)
                .finalProteinG(prot)
                .finalCarbsG(carbs)
                .finalFatG(fat)
                .build();
    }
}
