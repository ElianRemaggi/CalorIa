package com.caloria.weight.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record WeightLogRequest(
        @NotNull @DecimalMin("20.0") @DecimalMax("500.0") BigDecimal weightKg,
        @NotNull LocalDate loggedAt
) {}
