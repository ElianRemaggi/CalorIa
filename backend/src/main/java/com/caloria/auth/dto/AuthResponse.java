package com.caloria.auth.dto;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserInfo user
) {
    public record UserInfo(
            UUID id,
            String email,
            String fullName,
            String avatarUrl,
            boolean onboardingCompleted
    ) {}
}
