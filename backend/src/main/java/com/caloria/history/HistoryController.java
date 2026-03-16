package com.caloria.history;

import com.caloria.common.SecurityUtils;
import com.caloria.history.dto.DailySummary;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/history")
@RequiredArgsConstructor
@Tag(name = "History")
@SecurityRequirement(name = "bearerAuth")
public class HistoryController {

    private final HistoryService historyService;

    @GetMapping("/daily")
    @Operation(summary = "Get history for a specific day")
    public ResponseEntity<DailySummary> getDaily(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(historyService.getDailyHistory(SecurityUtils.getCurrentUserId(), date));
    }

    @GetMapping("/weekly")
    @Operation(summary = "Get history for a week")
    public ResponseEntity<List<DailySummary>> getWeekly(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return ResponseEntity.ok(historyService.getWeeklyHistory(SecurityUtils.getCurrentUserId(), weekStart));
    }

    @GetMapping("/monthly")
    @Operation(summary = "Get history for a month")
    public ResponseEntity<List<DailySummary>> getMonthly(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(historyService.getMonthlyHistory(SecurityUtils.getCurrentUserId(), year, month));
    }
}
