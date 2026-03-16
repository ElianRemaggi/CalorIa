package com.caloria.security;

import java.util.UUID;

public record UserPrincipal(UUID userId, String email) {}
