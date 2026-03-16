package com.caloria.user.dto;

import com.caloria.user.domain.AppUser;

import java.util.UUID;

public record UserDTO(
        UUID id,
        String email,
        String fullName,
        String avatarUrl
) {
    public static UserDTO from(AppUser user) {
        return new UserDTO(user.getId(), user.getEmail(), user.getFullName(), user.getAvatarUrl());
    }
}
