package com.caloria.weight.dto;

import com.caloria.weight.domain.WeightLog;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record WeightLogResponse(UUID id, BigDecimal weightKg, LocalDate loggedAt) {
    public static WeightLogResponse from(WeightLog w) {
        return new WeightLogResponse(w.getId(), w.getWeightKg(), w.getLoggedAt());
    }
}
