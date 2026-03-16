package com.caloria.user;

import com.caloria.common.exception.EntityNotFoundException;
import com.caloria.user.domain.AppUser;
import com.caloria.user.dto.UserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserDTO getCurrentUser(UUID userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        return UserDTO.from(user);
    }

    @Transactional(readOnly = true)
    public AppUser getById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
    }
}
