package com.caloria.notification;

import com.caloria.notification.domain.NotificationSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationSettings, UUID> {
    Optional<NotificationSettings> findByUserId(UUID userId);
}
