package com.caloria.user;

import com.caloria.user.domain.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByGoogleId(String googleId);
    Optional<AppUser> findByEmail(String email);
    boolean existsByEmail(String email);
}
