package com.caloria.notification;

import com.caloria.common.SecurityUtils;
import com.caloria.notification.domain.NotificationSettings;
import com.caloria.notification.dto.NotificationSettingsRequest;
import com.caloria.notification.dto.NotificationSettingsResponse;
import com.caloria.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notification-settings")
@RequiredArgsConstructor
@Tag(name = "Notifications")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get notification settings")
    public ResponseEntity<NotificationSettingsResponse> getSettings() {
        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(notificationRepository.findByUserId(userId)
                .map(NotificationSettingsResponse::from)
                .orElse(NotificationSettingsResponse.defaults()));
    }

    @PutMapping
    @Operation(summary = "Update notification settings")
    public ResponseEntity<NotificationSettingsResponse> updateSettings(
            @Valid @RequestBody NotificationSettingsRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        var user = userService.getById(userId);

        NotificationSettings settings = notificationRepository.findByUserId(userId)
                .orElseGet(() -> NotificationSettings.builder().user(user).build());

        settings.setEnabled(request.enabled());
        settings.setBreakfastReminderEnabled(request.breakfastReminderEnabled());
        settings.setLunchReminderEnabled(request.lunchReminderEnabled());
        settings.setDinnerReminderEnabled(request.dinnerReminderEnabled());
        settings.setSnackReminderEnabled(request.snackReminderEnabled());
        settings.setMaxNotificationsPerDay(request.maxNotificationsPerDay());

        return ResponseEntity.ok(NotificationSettingsResponse.from(notificationRepository.save(settings)));
    }
}
