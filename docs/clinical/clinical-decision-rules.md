# WHASA Clinical Decision Rules Implementation

## Overview

This document specifies the implementation of clinical decision support rules based on the Wound Healing Association of Southern Africa (WHASA) guidelines. These rules ensure evidence-based care recommendations and automate clinical decision-making within the wound-care nurse practitioner application.

## 1. ABPI (Ankle-Brachial Pressure Index) Decision Logic

### 1.1 ABPI Thresholds and Recommendations

Based on WHASA guidelines, the following decision tree applies:

```javascript
function getCompressionRecommendation(abpiValue) {
    if (abpiValue === null || abpiValue === undefined) {
        return {
            recommendation: 'abpi_measurement_required',
            message: 'ABPI measurement required before compression therapy',
            compressionAllowed: false,
            urgentReferral: false,
            alertLevel: 'warning'
        };
    }
    
    if (abpiValue < 0.6) {
        return {
            recommendation: 'urgent_referral_no_compression',
            message: 'Severe arterial insufficiency detected. Urgent vascular referral required. Compression therapy contraindicated.',
            compressionAllowed: false,
            urgentReferral: true,
            alertLevel: 'critical',
            referralReason: 'ABPI < 0.6 indicates severe arterial insufficiency'
        };
    }
    
    if (abpiValue >= 0.6 && abpiValue <= 0.8) {
        return {
            recommendation: 'modified_compression_close_monitoring',
            message: 'Mild arterial insufficiency. Modified compression with close monitoring required.',
            compressionAllowed: true,
            compressionType: 'modified',
            maxPressure: 'light_to_moderate', // 15-25 mmHg
            monitoringFrequency: 'daily',
            urgentReferral: false,
            alertLevel: 'caution'
        };
    }
    
    if (abpiValue > 0.8 && abpiValue <= 1.3) {
        return {
            recommendation: 'compression_safe_recommended',
            message: 'Normal arterial flow. Compression therapy safe and recommended for venous ulcers.',
            compressionAllowed: true,
            compressionType: 'standard',
            maxPressure: 'moderate_to_high', // 25-40 mmHg
            urgentReferral: false,
            alertLevel: 'normal'
        };
    }
    
    if (abpiValue > 1.3) {
        return {
            recommendation: 'calcified_vessels_assessment_required',
            message: 'ABPI > 1.3 may indicate calcified vessels. Clinical assessment required.',
            compressionAllowed: false,
            urgentReferral: false,
            alertLevel: 'warning',
            additionalAssessment: 'toe_pressure_measurement'
        };
    }
}
```

### 1.2 Bilateral ABPI Assessment

```javascript
function assessBilateralABPI(leftABPI, rightABPI) {
    const leftAssessment = getCompressionRecommendation(leftABPI);
    const rightAssessment = getCompressionRecommendation(rightABPI);
    
    // Use the most restrictive recommendation
    const overallAssessment = {
        leftLeg: leftAssessment,
        rightLeg: rightAssessment,
        overallRecommendation: getMostRestrictiveRecommendation(leftAssessment, rightAssessment),
        bilateralDifference: Math.abs(leftABPI - rightABPI)
    };
    
    // Alert if significant bilateral difference
    if (overallAssessment.bilateralDifference > 0.15) {
        overallAssessment.additionalAlert = {
            message: 'Significant bilateral ABPI difference detected. Consider asymmetric vascular disease.',
            alertLevel: 'warning'
        };
    }
    
    return overallAssessment;
}
```

## 2. Wound Classification and Assessment Rules

### 2.1 Ulcer Type Classification Decision Tree

```javascript
function classifyUlcerType(assessmentData) {
    const {
        location,
        abpi,
        venousInsufficiencyPresent,
        arterialPulses,
        diabeticHistory,
        pressureExposure,
        skinTearMechanism,
        burnCause
    } = assessmentData;
    
    // Diabetic Foot Ulcer Classification
    if (diabeticHistory && (location.includes('foot') || location.includes('toe'))) {
        return {
            primaryType: 'diabetic_foot',
            subClassification: classifyDiabeticFootUlcer(assessmentData),
            additionalAssessments: ['neuropathy_screen', 'vascular_assessment', 'infection_signs']
        };
    }
    
    // Pressure Injury Classification
    if (pressureExposure && isPressureProneArea(location)) {
        return {
            primaryType: 'pressure_injury',
            stage: classifyPressureInjuryStage(assessmentData),
            additionalAssessments: ['mobility_assessment', 'nutrition_status']
        };
    }
    
    // Venous, Arterial, or Mixed Ulcer
    if (isLowerLimbLocation(location)) {
        if (abpi > 0.8 && venousInsufficiencyPresent) {
            return {
                primaryType: 'venous',
                additionalAssessments: ['compression_suitability', 'edema_assessment']
            };
        } else if (abpi < 0.8) {
            return {
                primaryType: abpi < 0.6 ? 'arterial' : 'mixed',
                additionalAssessments: ['vascular_referral', 'pulse_assessment']
            };
        }
    }
    
    // Skin Tear
    if (skinTearMechanism) {
        return {
            primaryType: 'skin_tear',
            subClassification: classifySkinTear(assessmentData)
        };
    }
    
    // Burn
    if (burnCause) {
        return {
            primaryType: 'burn',
            depth: classifyBurnDepth(assessmentData),
            percentage: calculateBurnPercentage(assessmentData)
        };
    }
    
    return {
        primaryType: 'other',
        requiresSpecialistAssessment: true
    };
}
```

### 2.2 T.I.M.E. Framework Assessment

```javascript
function assessTIME(timeData) {
    const {
        tissueViablePercent,
        tissueNecroticPercent,
        tissueSloughPercent,
        infectionIndicators,
        exudateAmount,
        exudateType,
        edgeType,
        surroundingSkinCondition
    } = timeData;
    
    return {
        tissue: {
            viability: getTissueViabilityScore(tissueViablePercent, tissueNecroticPercent, tissueSloughPercent),
            debridementRequired: tissueNecroticPercent > 10 || tissueSloughPercent > 25,
            debridementType: getDebridementRecommendation(tissueNecroticPercent, tissueSloughPercent)
        },
        infection: {
            riskLevel: assessInfectionRisk(infectionIndicators),
            treatmentRequired: hasInfectionSigns(infectionIndicators),
            antimicrobialRecommended: requiresAntimicrobial(infectionIndicators)
        },
        moisture: {
            balanceLevel: assessMoistureBalance(exudateAmount, exudateType),
            dressingRecommendation: getMoistureDressingRecommendation(exudateAmount, exudateType)
        },
        edge: {
            healingPotential: assessEdgeCondition(edgeType),
            barrierProtectionRequired: requiresBarrierProtection(surroundingSkinCondition)
        }
    };
}
```

## 3. NPWT Suitability Assessment

### 3.1 NPWT Indication Criteria

```javascript
function assessNPWTSuitability(patientData, woundData) {
    const contraindicationsCheck = checkNPWTContraindications(patientData, woundData);
    
    if (contraindicationsCheck.hasContraindications) {
        return {
            suitable: false,
            reason: 'contraindications_present',
            contraindications: contraindicationsCheck.contraindications,
            alternatives: getAlternativeTreatments(woundData)
        };
    }
    
    const indications = checkNPWTIndications(woundData);
    
    return {
        suitable: indications.score >= 70, // Threshold for NPWT recommendation
        indicationScore: indications.score,
        primaryIndications: indications.present,
        prerequisites: [
            'adequate_vascular_supply',
            'treated_underlying_cause',
            'patient_compliance_assessed'
        ],
        expectedOutcomes: estimateNPWTOutcomes(woundData)
    };
}

function checkNPWTContraindications(patientData, woundData) {
    const contraindications = [];
    
    // Absolute contraindications
    if (woundData.arterialInsufficiency && woundData.abpi < 0.6) {
        contraindications.push({
            type: 'absolute',
            factor: 'severe_arterial_insufficiency',
            description: 'ABPI < 0.6 contraindicates NPWT'
        });
    }
    
    if (woundData.activeBleedingUncontrolled) {
        contraindications.push({
            type: 'absolute',
            factor: 'uncontrolled_bleeding',
            description: 'Active uncontrolled bleeding'
        });
    }
    
    if (woundData.malignancyInWoundBed) {
        contraindications.push({
            type: 'absolute',
            factor: 'malignancy_in_wound',
            description: 'Malignancy in wound bed'
        });
    }
    
    // Relative contraindications
    if (patientData.anticoagulationTherapy) {
        contraindications.push({
            type: 'relative',
            factor: 'anticoagulation',
            description: 'Patient on anticoagulation therapy - bleeding risk'
        });
    }
    
    if (woundData.exposedVessels || woundData.exposedOrgans) {
        contraindications.push({
            type: 'relative',
            factor: 'exposed_structures',
            description: 'Exposed blood vessels or organs'
        });
    }
    
    return {
        hasContraindications: contraindications.length > 0,
        contraindications: contraindications
    };
}
```

## 4. Dressing Selection Algorithm

### 4.1 WHASA Wound-Bed Preparation Categories

```javascript
function selectDressing(woundAssessment, timeAnalysis) {
    const dressingRecommendations = {
        debridement: [],
        infectionControl: [],
        moistureManagement: [],
        edgeProtection: []
    };
    
    // Debridement category
    if (timeAnalysis.tissue.debridementRequired) {
        dressingRecommendations.debridement = getDebridementProducts(
            timeAnalysis.tissue.debridementType,
            woundAssessment.woundSize,
            woundAssessment.patientFactors
        );
    }
    
    // Infection control category
    if (timeAnalysis.infection.treatmentRequired) {
        dressingRecommendations.infectionControl = getAntimicrobialProducts(
            timeAnalysis.infection.riskLevel,
            woundAssessment.bacterialLoad,
            woundAssessment.allergyHistory
        );
    }
    
    // Moisture management category
    dressingRecommendations.moistureManagement = getMoistureDressings(
        timeAnalysis.moisture.balanceLevel,
        woundAssessment.exudateCharacteristics,
        woundAssessment.woundDepth
    );
    
    // Edge protection category
    if (timeAnalysis.edge.barrierProtectionRequired) {
        dressingRecommendations.edgeProtection = getBarrierProducts(
            woundAssessment.periWoundCondition,
            woundAssessment.adhesiveTolerability
        );
    }
    
    return {
        primaryDressing: selectPrimaryDressing(dressingRecommendations),
        secondaryDressing: selectSecondaryDressing(dressingRecommendations),
        additionalProducts: selectAdditionalProducts(dressingRecommendations),
        changeFrequency: calculateChangeFrequency(timeAnalysis),
        rationale: generateDressingRationale(dressingRecommendations, timeAnalysis)
    };
}
```

### 4.2 Product Database Structure

```javascript
const WHASA_PRODUCT_DATABASE = {
    debridement: {
        autolytic: [
            {
                name: 'Hydrogel',
                indications: ['dry_necrotic_tissue', 'minimal_exudate'],
                contraindications: ['heavy_exudate', 'infected_wounds'],
                applicationFrequency: 'daily_to_twice_daily'
            }
        ],
        enzymatic: [
            {
                name: 'Collagenase',
                indications: ['thick_eschar', 'fibrin_tissue'],
                contraindications: ['silver_dressings', 'iodine_products'],
                applicationFrequency: 'daily'
            }
        ],
        mechanical: [
            {
                name: 'Monofilament_pad',
                indications: ['loose_slough', 'hyperkeratosis'],
                contraindications: ['fragile_tissue', 'bleeding_tendency'],
                applicationFrequency: 'each_dressing_change'
            }
        ]
    },
    
    infectionControl: {
        topicalAntiseptics: [
            {
                name: 'Povidone_iodine',
                indications: ['bacterial_infection', 'biofilm_suspected'],
                contraindications: ['iodine_allergy', 'thyroid_disorders'],
                duration: 'max_2_weeks'
            }
        ],
        antimicrobials: [
            {
                name: 'Silver_dressing',
                indications: ['bacterial_infection', 'biofilm'],
                contraindications: ['silver_allergy'],
                duration: 'max_2_weeks'
            }
        ]
    },
    
    moistureManagement: {
        absorptive: [
            {
                name: 'Foam_dressing',
                absorption: 'moderate_to_heavy',
                indications: ['exudative_wounds', 'pressure_relief'],
                changeFrequency: '1_to_3_days'
            }
        ],
        hydrating: [
            {
                name: 'Hydrocolloid',
                absorption: 'light_to_moderate',
                indications: ['granulating_wounds', 'dry_wounds'],
                changeFrequency: '3_to_7_days'
            }
        ]
    },
    
    edgeProtection: [
        {
            name: 'Barrier_film',
            indications: ['periwound_maceration', 'adhesive_trauma'],
            application: 'apply_to_intact_skin_only'
        }
    ]
};
```

## 5. Healing Progress Assessment

### 5.1 MEASURE Framework Implementation

```javascript
function assessHealingProgress(currentAssessment, previousAssessment, timeInterval) {
    const progress = {
        woundSize: calculateSizeChange(currentAssessment, previousAssessment),
        tissueType: assessTissueChange(currentAssessment, previousAssessment),
        exudateLevel: assessExudateChange(currentAssessment, previousAssessment),
        inflammation: assessInflammationChange(currentAssessment, previousAssessment),
        healingRate: calculateHealingRate(currentAssessment, previousAssessment, timeInterval)
    };
    
    const overallStatus = determineHealingStatus(progress);
    
    return {
        progressStatus: overallStatus,
        improvements: identifyImprovements(progress),
        concerns: identifyConcerns(progress),
        recommendations: generateProgressRecommendations(progress),
        nextAssessmentDate: calculateNextAssessmentDate(overallStatus),
        carePlanAdjustments: suggestCarePlanAdjustments(progress)
    };
}

function calculateExpectedHealingTime(woundData, patientFactors) {
    const baseHealingTime = {
        'venous': 84, // 12 weeks
        'arterial': 168, // 24 weeks (if treatable)
        'diabetic_foot': 112, // 16 weeks
        'pressure_injury': 56, // 8 weeks
        'skin_tear': 14 // 2 weeks
    };
    
    let estimatedDays = baseHealingTime[woundData.ulcerType] || 84;
    
    // Adjust for wound size
    const sizeMultiplier = Math.min(2.0, Math.max(0.5, woundData.area_cm2 / 10));
    estimatedDays *= sizeMultiplier;
    
    // Adjust for patient factors
    const riskFactors = assessHealingRiskFactors(patientFactors);
    estimatedDays *= riskFactors.healingMultiplier;
    
    return {
        estimatedDays: Math.round(estimatedDays),
        confidenceLevel: riskFactors.confidenceLevel,
        influencingFactors: riskFactors.factors
    };
}
```

## 6. Alert and Notification Rules

### 6.1 Clinical Alert Triggers

```javascript
const CLINICAL_ALERT_RULES = {
    urgent: [
        {
            condition: 'abpi_critical',
            trigger: (data) => data.abpi < 0.6,
            message: 'Critical ABPI detected. Urgent vascular referral required.',
            actions: ['notify_physician', 'schedule_urgent_referral', 'hold_compression']
        },
        {
            condition: 'wound_deterioration',
            trigger: (current, previous) => {
                return current.area_cm2 > (previous.area_cm2 * 1.25) && 
                       daysBetween(current.date, previous.date) <= 7;
            },
            message: 'Wound size increased by >25% in past week.',
            actions: ['reassess_care_plan', 'infection_screen', 'notify_physician']
        }
    ],
    
    warning: [
        {
            condition: 'slow_healing',
            trigger: (progress) => progress.healingRate < 0.1 && progress.weeksOfTreatment > 4,
            message: 'Healing rate <10% after 4 weeks of treatment.',
            actions: ['reassess_underlying_causes', 'consider_advanced_therapies']
        },
        {
            condition: 'infection_signs',
            trigger: (assessment) => assessment.infectionScore > 7,
            message: 'Clinical signs of infection detected.',
            actions: ['consider_antimicrobial_therapy', 'wound_culture', 'increase_monitoring']
        }
    ],
    
    reminder: [
        {
            condition: 'overdue_dressing_change',
            trigger: (lastChange, frequency) => daysSince(lastChange) > frequency + 1,
            message: 'Dressing change overdue.',
            actions: ['schedule_appointment', 'notify_patient']
        }
    ]
};
```

## 7. Cost Estimation Rules

### 7.1 Treatment Cost Calculation

```javascript
function calculateTreatmentCost(carePlan, sessionData) {
    const costs = {
        consultation: calculateConsultationCost(sessionData.sessionType, sessionData.duration),
        materials: calculateMaterialCost(sessionData.productsUsed),
        procedures: calculateProcedureCost(sessionData.proceduresPerformed),
        npwt: sessionData.npwtUsed ? calculateNPWTCost(sessionData.npwtDuration) : 0
    };
    
    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    
    return {
        breakdown: costs,
        total: totalCost,
        medicalAidCodes: generateMedicalAidCodes(carePlan, sessionData),
        costPerDay: calculateDailyCost(carePlan),
        projectedTotalCost: projectTotalTreatmentCost(carePlan, costs)
    };
}

const BILLING_CODES = {
    consultation: {
        'initial_comprehensive': { code: '0190', rate: 450.00 },
        'follow_up_standard': { code: '0191', rate: 280.00 },
        'wound_specialist': { code: '0192', rate: 380.00 }
    },
    procedures: {
        'wound_cleansing': { code: '2100', rate: 120.00 },
        'debridement_minor': { code: '2110', rate: 250.00 },
        'dressing_simple': { code: '2120', rate: 85.00 },
        'dressing_complex': { code: '2125', rate: 150.00 },
        'compression_application': { code: '2130', rate: 180.00 },
        'npwt_application': { code: '2140', rate: 450.00 }
    }
};
```

## Implementation Notes

### 1. Rule Engine Architecture

```javascript
class ClinicalRuleEngine {
    constructor(patientData, assessmentData) {
        this.patient = patientData;
        this.assessment = assessmentData;
        this.rules = this.loadClinicalRules();
    }
    
    evaluateAllRules() {
        const results = {
            decisions: {},
            alerts: [],
            recommendations: [],
            contraindications: []
        };
        
        // Evaluate ABPI rules
        results.decisions.compression = this.evaluateABPIRules();
        
        // Evaluate wound classification
        results.decisions.classification = this.evaluateClassificationRules();
        
        // Evaluate treatment suitability
        results.decisions.treatments = this.evaluateTreatmentRules();
        
        // Check for alerts
        results.alerts = this.evaluateAlertRules();
        
        return results;
    }
    
    validateRuleExecution() {
        // Ensure all critical rules are executed
        // Log rule execution for audit purposes
        // Validate rule outcomes against expected ranges
    }
}
```

### 2. Data Validation

All clinical rules must include data validation to ensure:
- Required data points are present
- Data values are within valid ranges
- Dependencies between rules are properly handled
- Fallback behaviors for missing data

### 3. Rule Updates and Versioning

- Clinical rules must be versioned for audit purposes
- Updates to WHASA guidelines should trigger rule reviews
- All rule changes require clinical validation before deployment
- Historical rule versions must be maintained for compliance

### 4. Integration Points

The clinical decision rules integrate with:
- Assessment forms (real-time decision support)
- Care planning wizard (treatment recommendations)
- Therapy execution (compliance checking)
- Monitoring dashboard (progress alerts)
- Reporting system (outcome tracking)

This implementation ensures that the WHASA wound-care nurse practitioner app provides evidence-based decision support while maintaining flexibility for clinical judgment and regulatory compliance.