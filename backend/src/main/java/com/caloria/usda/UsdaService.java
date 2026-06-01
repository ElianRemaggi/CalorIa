package com.caloria.usda;

import com.caloria.usda.dto.UsdaFoodItem;
import com.caloria.usda.dto.UsdaSearchResponse;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class UsdaService {

    private static final int NUTRIENT_ENERGY   = 1008;
    private static final int NUTRIENT_PROTEIN   = 1003;
    private static final int NUTRIENT_CARBS     = 1005;
    private static final int NUTRIENT_FAT       = 1004;

    private final RestClient restClient;
    private final String apiKey;

    public UsdaService(@Value("${usda.api-key:DEMO_KEY}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.nal.usda.gov/fdc/v1")
                .build();
    }

    /**
     * Searches USDA FoodData Central for foods matching the query.
     * Returns an empty list if the upstream call fails for any reason.
     */
    public UsdaSearchResponse search(String query, int pageSize) {
        try {
            RawUsdaResponse raw = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/foods/search")
                            .queryParam("query", query)
                            .queryParam("pageSize", pageSize)
                            .queryParam("api_key", apiKey)
                            .build())
                    .retrieve()
                    .body(RawUsdaResponse.class);

            if (raw == null || raw.foods() == null) {
                return new UsdaSearchResponse(Collections.emptyList());
            }

            List<UsdaFoodItem> items = raw.foods().stream()
                    .map(this::toFoodItem)
                    .toList();

            return new UsdaSearchResponse(items);

        } catch (Exception e) {
            log.warn("USDA FoodData Central call failed for query='{}': {}", query, e.getMessage());
            return new UsdaSearchResponse(Collections.emptyList());
        }
    }

    private UsdaFoodItem toFoodItem(RawFood food) {
        Map<Integer, Double> nutrients = Collections.emptyMap();
        if (food.foodNutrients() != null) {
            nutrients = food.foodNutrients().stream()
                    .filter(n -> n.nutrientId() != null && n.value() != null)
                    .collect(java.util.stream.Collectors.toMap(
                            RawNutrient::nutrientId,
                            RawNutrient::value,
                            (a, b) -> a));
        }

        return new UsdaFoodItem(
                food.fdcId() != null ? String.valueOf(food.fdcId()) : null,
                food.description(),
                roundNullable(nutrients.get(NUTRIENT_ENERGY)),
                roundNullable(nutrients.get(NUTRIENT_PROTEIN)),
                roundNullable(nutrients.get(NUTRIENT_CARBS)),
                roundNullable(nutrients.get(NUTRIENT_FAT))
        );
    }

    private Integer roundNullable(Double value) {
        return value != null ? (int) Math.round(value) : null;
    }

    // -------------------------------------------------------------------------
    // Inner records for deserialising the raw USDA JSON response
    // -------------------------------------------------------------------------

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RawUsdaResponse(List<RawFood> foods) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RawFood(
            Long fdcId,
            String description,
            List<RawNutrient> foodNutrients
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RawNutrient(
            Integer nutrientId,
            Double value
    ) {}
}
