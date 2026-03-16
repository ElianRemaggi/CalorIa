package com.caloria.weight;

import com.caloria.common.SecurityUtils;
import com.caloria.user.UserService;
import com.caloria.weight.domain.WeightLog;
import com.caloria.weight.dto.WeightLogRequest;
import com.caloria.weight.dto.WeightLogResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/weight-logs")
@RequiredArgsConstructor
@Tag(name = "Weight")
@SecurityRequirement(name = "bearerAuth")
public class WeightController {

    private final WeightLogRepository weightLogRepository;
    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Log weight")
    public ResponseEntity<WeightLogResponse> create(@Valid @RequestBody WeightLogRequest request) {
        var user = userService.getById(SecurityUtils.getCurrentUserId());
        WeightLog log = WeightLog.builder()
                .user(user)
                .weightKg(request.weightKg())
                .loggedAt(request.loggedAt())
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(WeightLogResponse.from(weightLogRepository.save(log)));
    }

    @GetMapping
    @Operation(summary = "Get weight history")
    public ResponseEntity<List<WeightLogResponse>> getAll() {
        return ResponseEntity.ok(
                weightLogRepository.findByUserIdOrderByLoggedAtDesc(SecurityUtils.getCurrentUserId())
                        .stream().map(WeightLogResponse::from).toList()
        );
    }
}
