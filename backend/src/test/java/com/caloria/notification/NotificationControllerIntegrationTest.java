package com.caloria.notification;

import com.caloria.BaseIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class NotificationControllerIntegrationTest extends BaseIntegrationTest {

    @Test
    void GET_notificationSettings_unauthenticated_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/notification-settings"))
            .andExpect(status().isForbidden());
    }

    @Test
    void GET_notificationSettings_noSettingsYet_returnsDefaults() throws Exception {
        String token = authenticateAndGetToken("g-n1", "notif1@test.com");

        mockMvc.perform(get("/api/v1/notification-settings")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.enabled").value(false))
            .andExpect(jsonPath("$.breakfastReminderEnabled").value(false))
            .andExpect(jsonPath("$.lunchReminderEnabled").value(false))
            .andExpect(jsonPath("$.dinnerReminderEnabled").value(false))
            .andExpect(jsonPath("$.snackReminderEnabled").value(false))
            .andExpect(jsonPath("$.maxNotificationsPerDay").value(0));
    }

    @Test
    void PUT_notificationSettings_createsSettingsOnFirstCall() throws Exception {
        String token = authenticateAndGetToken("g-n2", "notif2@test.com");

        mockMvc.perform(put("/api/v1/notification-settings")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "enabled": true,
                      "breakfastReminderEnabled": true,
                      "lunchReminderEnabled": false,
                      "dinnerReminderEnabled": true,
                      "snackReminderEnabled": false,
                      "maxNotificationsPerDay": 3
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.enabled").value(true))
            .andExpect(jsonPath("$.breakfastReminderEnabled").value(true))
            .andExpect(jsonPath("$.lunchReminderEnabled").value(false))
            .andExpect(jsonPath("$.dinnerReminderEnabled").value(true))
            .andExpect(jsonPath("$.maxNotificationsPerDay").value(3));
    }

    @Test
    void PUT_notificationSettings_updatesExistingSettings() throws Exception {
        String token = authenticateAndGetToken("g-n3", "notif3@test.com");

        // First PUT — create
        mockMvc.perform(put("/api/v1/notification-settings")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"enabled": false, "breakfastReminderEnabled": false,
                     "lunchReminderEnabled": false, "dinnerReminderEnabled": false,
                     "snackReminderEnabled": false, "maxNotificationsPerDay": 0}
                    """))
            .andExpect(status().isOk());

        // Second PUT — update
        mockMvc.perform(put("/api/v1/notification-settings")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"enabled": true, "breakfastReminderEnabled": true,
                     "lunchReminderEnabled": true, "dinnerReminderEnabled": false,
                     "snackReminderEnabled": false, "maxNotificationsPerDay": 5}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.enabled").value(true))
            .andExpect(jsonPath("$.breakfastReminderEnabled").value(true))
            .andExpect(jsonPath("$.maxNotificationsPerDay").value(5));

        // GET should reflect the updated values
        mockMvc.perform(get("/api/v1/notification-settings")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.enabled").value(true))
            .andExpect(jsonPath("$.maxNotificationsPerDay").value(5));
    }

    @Test
    void PUT_notificationSettings_maxNotificationsAbove10_returns400() throws Exception {
        String token = authenticateAndGetToken("g-n4", "notif4@test.com");

        mockMvc.perform(put("/api/v1/notification-settings")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"enabled": true, "breakfastReminderEnabled": false,
                     "lunchReminderEnabled": false, "dinnerReminderEnabled": false,
                     "snackReminderEnabled": false, "maxNotificationsPerDay": 11}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void PUT_notificationSettings_nullEnabled_returns400() throws Exception {
        String token = authenticateAndGetToken("g-n5", "notif5@test.com");

        mockMvc.perform(put("/api/v1/notification-settings")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"breakfastReminderEnabled": false, "lunchReminderEnabled": false,
                     "dinnerReminderEnabled": false, "snackReminderEnabled": false,
                     "maxNotificationsPerDay": 3}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void PUT_notificationSettings_unauthenticated_returns403() throws Exception {
        mockMvc.perform(put("/api/v1/notification-settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"enabled": true, "breakfastReminderEnabled": false,
                     "lunchReminderEnabled": false, "dinnerReminderEnabled": false,
                     "snackReminderEnabled": false, "maxNotificationsPerDay": 2}
                    """))
            .andExpect(status().isForbidden());
    }
}
