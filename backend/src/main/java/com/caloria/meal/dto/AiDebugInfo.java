package com.caloria.meal.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record AiDebugInfo(
        String promptText,
        String rawResponse,
        JsonNode parsedResponse
) {}
