package com.caloria.usda;

import com.caloria.usda.dto.UsdaSearchResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/usda")
@RequiredArgsConstructor
@Validated
@Tag(name = "USDA")
@SecurityRequirement(name = "bearerAuth")
public class UsdaController {

    private final UsdaService usdaService;

    @GetMapping("/search")
    @Operation(summary = "Search USDA FoodData Central for food items")
    public ResponseEntity<UsdaSearchResponse> search(
            @RequestParam @NotBlank String query,
            @RequestParam(defaultValue = "5") @Min(1) @Max(10) int pageSize) {
        return ResponseEntity.ok(usdaService.search(query, pageSize));
    }
}
