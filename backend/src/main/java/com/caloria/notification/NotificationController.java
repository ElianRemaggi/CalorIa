package com.caloria.notification;

import com.caloria.common.SecurityUtils;
import com.caloria.notification.dto.NotificationSettingsRequest;
import com.caloria.notification.dto.NotificationSettingsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notification-settings")
@RequiredArgsConstructor
@Tag(name = "Notifications")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get notification settings")
    public ResponseEntity<NotificationSettingsResponse> getSettings() {
        return ResponseEntity.ok(notificationService.getSettings(SecurityUtils.getCurrentUserId()));
    }

    @PutMapping
    @Operation(summary = "Update notification settings")
    public ResponseEntity<NotificationSettingsResponse> updateSettings(
            @Valid @RequestBody NotificationSettingsRequest request) {
        return ResponseEntity.ok(
                notificationService.updateSettings(SecurityUtils.getCurrentUserId(), request));
    }
}
