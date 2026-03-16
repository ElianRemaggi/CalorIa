package com.caloria.profile;

import com.caloria.common.SecurityUtils;
import com.caloria.profile.dto.ProfileRequest;
import com.caloria.profile.dto.ProfileResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@Tag(name = "Profile")
@SecurityRequirement(name = "bearerAuth")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    @Operation(summary = "Get nutritional profile")
    public ResponseEntity<ProfileResponse> getProfile() {
        return ResponseEntity.ok(profileService.getProfile(SecurityUtils.getCurrentUserId()));
    }

    @PutMapping("/me")
    @Operation(summary = "Create or update nutritional profile")
    public ResponseEntity<ProfileResponse> upsertProfile(@Valid @RequestBody ProfileRequest request) {
        return ResponseEntity.ok(profileService.upsertProfile(SecurityUtils.getCurrentUserId(), request));
    }
}
