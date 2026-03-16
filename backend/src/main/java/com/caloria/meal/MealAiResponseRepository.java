package com.caloria.meal;

import com.caloria.meal.domain.MealAiResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MealAiResponseRepository extends JpaRepository<MealAiResponse, UUID> {}
