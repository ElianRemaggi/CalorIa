package com.caloria.meal.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "meal_ai_response")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealAiResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_entry_id", nullable = false, unique = true)
    private MealEntry mealEntry;

    @Column(nullable = false, length = 32)
    private String provider;

    @Column(name = "prompt_text", nullable = false, columnDefinition = "TEXT")
    private String promptText;

    @Column(name = "raw_response", nullable = false, columnDefinition = "TEXT")
    private String rawResponse;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parsed_response_json", nullable = false, columnDefinition = "jsonb")
    private String parsedResponseJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
