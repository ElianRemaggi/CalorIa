package com.caloria.weight;

import com.caloria.user.UserService;
import com.caloria.weight.domain.WeightLog;
import com.caloria.weight.dto.WeightLogRequest;
import com.caloria.weight.dto.WeightLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WeightService {

    private final WeightLogRepository weightLogRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<WeightLogResponse> getWeightLogs(UUID userId) {
        return weightLogRepository.findByUserIdOrderByLoggedAtDesc(userId)
                .stream().map(WeightLogResponse::from).toList();
    }

    @Transactional
    public WeightLogResponse createWeightLog(UUID userId, WeightLogRequest request) {
        var user = userService.getById(userId);
        WeightLog log = WeightLog.builder()
                .user(user)
                .weightKg(request.weightKg())
                .loggedAt(request.loggedAt())
                .build();
        return WeightLogResponse.from(weightLogRepository.save(log));
    }
}
