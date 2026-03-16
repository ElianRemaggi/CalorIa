package com.caloria.profile;

import com.caloria.common.exception.EntityNotFoundException;
import com.caloria.profile.domain.UserProfile;
import com.caloria.profile.dto.NutritionTargets;
import com.caloria.profile.dto.ProfileRequest;
import com.caloria.profile.dto.ProfileResponse;
import com.caloria.user.UserService;
import com.caloria.user.domain.AppUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(UUID userId) {
        return profileRepository.findByUserId(userId)
                .map(ProfileResponse::from)
                .orElseThrow(() -> new EntityNotFoundException("Profile not found for user: " + userId));
    }

    @Transactional
    public ProfileResponse upsertProfile(UUID userId, ProfileRequest request) {
        AppUser user = userService.getById(userId);
        NutritionTargets targets = NutritionCalculator.calculate(request);

        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> UserProfile.builder().user(user).build());

        profile.setGender(request.gender());
        profile.setAge(request.age());
        profile.setHeightCm(request.heightCm());
        profile.setWeightKg(request.weightKg());
        profile.setGoalType(request.goalType());
        profile.setTargetCalories(targets.calories());
        profile.setTargetProteinG(targets.proteinG());
        profile.setTargetCarbsG(targets.carbsG());
        profile.setTargetFatG(targets.fatG());
        profile.setOnboardingCompleted(true);

        return ProfileResponse.from(profileRepository.save(profile));
    }
}
