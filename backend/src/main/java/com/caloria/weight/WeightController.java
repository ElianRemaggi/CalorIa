package com.caloria.weight;

import com.caloria.common.SecurityUtils;
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

    private final WeightService weightService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Log weight")
    public ResponseEntity<WeightLogResponse> create(@Valid @RequestBody WeightLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(weightService.createWeightLog(SecurityUtils.getCurrentUserId(), request));
    }

    @GetMapping
    @Operation(summary = "Get weight history")
    public ResponseEntity<List<WeightLogResponse>> getAll() {
        return ResponseEntity.ok(weightService.getWeightLogs(SecurityUtils.getCurrentUserId()));
    }
}
