package com.caloria.meal.domain;

import com.caloria.user.domain.AppUser;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "meal_entry")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Column(name = "source_type", nullable = false, length = 16)
    private String sourceType;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "meal_datetime", nullable = false)
    private OffsetDateTime mealDatetime;

    @Column(name = "estimated_calories")
    private Integer estimatedCalories;

    @Column(name = "estimated_protein_g")
    private Integer estimatedProteinG;

    @Column(name = "estimated_carbs_g")
    private Integer estimatedCarbsG;

    @Column(name = "estimated_fat_g")
    private Integer estimatedFatG;

    @Column(name = "final_calories", nullable = false)
    private int finalCalories;

    @Column(name = "final_protein_g", nullable = false)
    private int finalProteinG;

    @Column(name = "final_carbs_g", nullable = false)
    private int finalCarbsG;

    @Column(name = "final_fat_g", nullable = false)
    private int finalFatG;

    @Column(name = "ai_provider", length = 32)
    private String aiProvider;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToOne(mappedBy = "mealEntry", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private MealAiResponse aiResponse;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
