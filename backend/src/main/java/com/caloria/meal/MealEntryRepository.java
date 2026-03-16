package com.caloria.meal;

import com.caloria.meal.domain.MealEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MealEntryRepository extends JpaRepository<MealEntry, UUID> {

    List<MealEntry> findByUserIdAndMealDatetimeBetweenOrderByMealDatetimeAsc(
            UUID userId, OffsetDateTime start, OffsetDateTime end);

    @Query("SELECT m FROM MealEntry m WHERE m.user.id = :userId " +
           "AND m.mealDatetime >= :start AND m.mealDatetime < :end " +
           "ORDER BY m.mealDatetime ASC")
    List<MealEntry> findMealsInRange(
            @Param("userId") UUID userId,
            @Param("start") OffsetDateTime start,
            @Param("end") OffsetDateTime end);
}
