package com.caloria.notification.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record NotificationSettingsRequest(
        @NotNull Boolean enabled,
        @NotNull Boolean breakfastReminderEnabled,
        @NotNull Boolean lunchReminderEnabled,
        @NotNull Boolean dinnerReminderEnabled,
        @NotNull Boolean snackReminderEnabled,
        @NotNull @Min(0) @Max(10) Integer maxNotificationsPerDay
) {}
