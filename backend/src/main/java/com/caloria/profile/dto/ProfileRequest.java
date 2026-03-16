package com.caloria.profile.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProfileRequest(
        @NotBlank @Pattern(regexp = "male|female|other") String gender,
        @NotNull @Min(10) @Max(120) Integer age,
        @NotNull @DecimalMin("50.0") @DecimalMax("300.0") BigDecimal heightCm,
        @NotNull @DecimalMin("20.0") @DecimalMax("500.0") BigDecimal weightKg,
        @NotBlank @Pattern(regexp = "lose|maintain|gain") String goalType
) {}
