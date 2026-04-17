package com.caloria.notification;

import com.caloria.notification.domain.NotificationSettings;
import com.caloria.notification.dto.NotificationSettingsRequest;
import com.caloria.notification.dto.NotificationSettingsResponse;
import com.caloria.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public NotificationSettingsResponse getSettings(UUID userId) {
        return notificationRepository.findByUserId(userId)
                .map(NotificationSettingsResponse::from)
                .orElse(NotificationSettingsResponse.defaults());
    }

    @Transactional
    public NotificationSettingsResponse updateSettings(UUID userId, NotificationSettingsRequest request) {
        var user = userService.getById(userId);
        NotificationSettings settings = notificationRepository.findByUserId(userId)
                .orElseGet(() -> NotificationSettings.builder().user(user).build());

        settings.setEnabled(request.enabled());
        settings.setBreakfastReminderEnabled(request.breakfastReminderEnabled());
        settings.setLunchReminderEnabled(request.lunchReminderEnabled());
        settings.setDinnerReminderEnabled(request.dinnerReminderEnabled());
        settings.setSnackReminderEnabled(request.snackReminderEnabled());
        settings.setMaxNotificationsPerDay(request.maxNotificationsPerDay());

        return NotificationSettingsResponse.from(notificationRepository.save(settings));
    }
}
