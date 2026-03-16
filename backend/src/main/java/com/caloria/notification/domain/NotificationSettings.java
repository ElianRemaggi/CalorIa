package com.caloria.notification.domain;

import com.caloria.user.domain.AppUser;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private AppUser user;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "breakfast_reminder_enabled", nullable = false)
    private boolean breakfastReminderEnabled;

    @Column(name = "lunch_reminder_enabled", nullable = false)
    private boolean lunchReminderEnabled;

    @Column(name = "dinner_reminder_enabled", nullable = false)
    private boolean dinnerReminderEnabled;

    @Column(name = "snack_reminder_enabled", nullable = false)
    private boolean snackReminderEnabled;

    @Column(name = "max_notifications_per_day", nullable = false)
    private int maxNotificationsPerDay;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
