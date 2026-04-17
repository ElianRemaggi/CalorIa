package com.caloria.profile;

import com.caloria.profile.dto.NutritionTargets;
import com.caloria.profile.dto.ProfileRequest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

class NutritionCalculatorTest {

    // Helper to build a ProfileRequest with clean BigDecimal values
    private ProfileRequest req(String gender, int age, double height, double weight, String goal) {
        return new ProfileRequest(gender, age, BigDecimal.valueOf(height), BigDecimal.valueOf(weight), goal);
    }

    // Male, 30y, 175cm, 75kg, maintain
    // BMR = (10*75)+(6.25*175)-(5*30)+5 = 750+1093.75-150+5 = 1698.75
    // TDEE = 1698.75 * 1.55 = 2633.0625
    // cal=2633, prot=round(2633.06*0.30/4)=197, carbs=round(2633.06*0.40/4)=263, fat=round(2633.06*0.30/9)=88
    @Test
    void calculate_maleMaintain_returnsCorrectTargets() {
        NutritionTargets t = NutritionCalculator.calculate(req("male", 30, 175.0, 75.0, "maintain"));
        assertAll(
            () -> assertThat(t.calories()).isEqualTo(2633),
            () -> assertThat(t.proteinG()).isEqualTo(197),
            () -> assertThat(t.carbsG()).isEqualTo(263),
            () -> assertThat(t.fatG()).isEqualTo(88)
        );
    }

    // Female, 25y, 165cm, 60kg, lose
    // BMR = (10*60)+(6.25*165)-(5*25)-161 = 600+1031.25-125-161 = 1345.25
    // TDEE = 1345.25 * 1.55 = 2085.1375  →  lose: 2085.1375-500 = 1585.1375
    // cal=1585, prot=round(1585.14*0.30/4)=119, carbs=round(1585.14*0.40/4)=159, fat=round(1585.14*0.30/9)=53
    @Test
    void calculate_femaleLose_returnsCorrectTargets() {
        NutritionTargets t = NutritionCalculator.calculate(req("female", 25, 165.0, 60.0, "lose"));
        assertAll(
            () -> assertThat(t.calories()).isEqualTo(1585),
            () -> assertThat(t.proteinG()).isEqualTo(119),
            () -> assertThat(t.carbsG()).isEqualTo(159),
            () -> assertThat(t.fatG()).isEqualTo(53)
        );
    }

    // Male, 30y, 175cm, 75kg, gain → TDEE+300 = 2633.06+300 = 2933.06
    // cal=2933, prot=round(2933.06*0.30/4)=220, carbs=round(2933.06*0.40/4)=293, fat=round(2933.06*0.30/9)=98
    @Test
    void calculate_maleGain_addsTDEEPlus300() {
        NutritionTargets t = NutritionCalculator.calculate(req("male", 30, 175.0, 75.0, "gain"));
        assertAll(
            () -> assertThat(t.calories()).isEqualTo(2933),
            () -> assertThat(t.proteinG()).isEqualTo(220),
            () -> assertThat(t.carbsG()).isEqualTo(293),
            () -> assertThat(t.fatG()).isEqualTo(98)
        );
    }

    // Floor case: female, 60y, 150cm, 45kg, lose
    // BMR = (10*45)+(6.25*150)-(5*60)-161 = 450+937.5-300-161 = 926.5
    // TDEE = 926.5*1.55 = 1436.075  →  lose: 936.075  →  floor: 1200
    // prot=round(1200*0.30/4)=90, carbs=round(1200*0.40/4)=120, fat=round(1200*0.30/9)=40
    @Test
    void calculate_veryLowCalories_enforcesFloor1200() {
        NutritionTargets t = NutritionCalculator.calculate(req("female", 60, 150.0, 45.0, "lose"));
        assertAll(
            () -> assertThat(t.calories()).isEqualTo(1200),
            () -> assertThat(t.proteinG()).isEqualTo(90),
            () -> assertThat(t.carbsG()).isEqualTo(120),
            () -> assertThat(t.fatG()).isEqualTo(40)
        );
    }

    // "other" gender falls to the else branch (male formula) → same as male with same inputs
    @Test
    void calculate_genderOther_usesMalePath() {
        NutritionTargets male  = NutritionCalculator.calculate(req("male",  30, 175.0, 75.0, "maintain"));
        NutritionTargets other = NutritionCalculator.calculate(req("other", 30, 175.0, 75.0, "maintain"));
        assertThat(other.calories()).isEqualTo(male.calories());
        assertThat(other.proteinG()).isEqualTo(male.proteinG());
    }

    // Gender matching is case-insensitive ("FEMALE" == "female")
    @Test
    void calculate_gender_caseInsensitive() {
        NutritionTargets lower = NutritionCalculator.calculate(req("female", 25, 165.0, 60.0, "lose"));
        NutritionTargets upper = NutritionCalculator.calculate(req("FEMALE", 25, 165.0, 60.0, "lose"));
        assertThat(upper.calories()).isEqualTo(lower.calories());
    }

    // Extreme inputs must not overflow or produce negative calories
    @Test
    void calculate_extremeWeightAndHeight_producesPositiveCalories() {
        NutritionTargets t = NutritionCalculator.calculate(req("male", 10, 299.9, 499.9, "gain"));
        assertThat(t.calories()).isGreaterThan(1200);
        assertThat(t.proteinG()).isGreaterThan(0);
        assertThat(t.fatG()).isGreaterThan(0);
    }

    // Macros are computed from the floored calories, not the raw sub-1200 value
    @Test
    void calculate_macrosComputedFromFlooredCalories() {
        // female, 65y, 150cm, 43kg, lose → raw target well below 1200
        NutritionTargets t = NutritionCalculator.calculate(req("female", 65, 150.0, 43.0, "lose"));
        // if macros were wrong (computed pre-floor), protein would be < 90
        assertThat(t.calories()).isEqualTo(1200);
        assertThat(t.proteinG()).isEqualTo(90);
        assertThat(t.carbsG()).isEqualTo(120);
        assertThat(t.fatG()).isEqualTo(40);
    }
}
