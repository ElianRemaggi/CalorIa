package com.caloria.notification.dto;

import com.caloria.notification.domain.NotificationSettings;

public record NotificationSettingsResponse(
        boolean enabled,
        boolean breakfastReminderEnabled,
        boolean lunchReminderEnabled,
        boolean dinnerReminderEnabled,
        boolean snackReminderEnabled,
        int maxNotificationsPerDay
) {
    public static NotificationSettingsResponse from(NotificationSettings s) {
        return new NotificationSettingsResponse(
                s.isEnabled(), s.isBreakfastReminderEnabled(), s.isLunchReminderEnabled(),
                s.isDinnerReminderEnabled(), s.isSnackReminderEnabled(), s.getMaxNotificationsPerDay()
        );
    }

    public static NotificationSettingsResponse defaults() {
        return new NotificationSettingsResponse(false, false, false, false, false, 0);
    }
}
