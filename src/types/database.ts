export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          password_hash: string
          first_name: string
          last_name: string
          professional_registration: string | null
          phone_number: string | null
          is_active: boolean
          last_login: string | null
          password_reset_token: string | null
          password_reset_expires: string | null
          two_factor_secret: string | null
          two_factor_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          password_hash: string
          first_name: string
          last_name: string
          professional_registration?: string | null
          phone_number?: string | null
          is_active?: boolean
          last_login?: string | null
          password_reset_token?: string | null
          password_reset_expires?: string | null
          two_factor_secret?: string | null
          two_factor_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          password_hash?: string
          first_name?: string
          last_name?: string
          professional_registration?: string | null
          phone_number?: string | null
          is_active?: boolean
          last_login?: string | null
          password_reset_token?: string | null
          password_reset_expires?: string | null
          two_factor_secret?: string | null
          two_factor_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          patient_number: string
          surname: string
          full_name: string
          id_number: string | null
          date_of_birth: string
          sex: 'Male' | 'Female' | 'Other'
          phone_number: string | null
          email: string | null
          address: Json | null
          emergency_contact: Json | null
          referring_doctor: string | null
          practice_number: string | null
          icd10_code: string | null
          medical_aid_name: string | null
          medical_aid_number: string | null
          member_number: string | null
          case_manager_name: string | null
          case_manager_contact: string | null
          initial_evaluation_date: string
          case_number: string
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_number: string
          surname: string
          full_name: string
          id_number?: string | null
          date_of_birth: string
          sex: 'Male' | 'Female' | 'Other'
          phone_number?: string | null
          email?: string | null
          address?: Json | null
          emergency_contact?: Json | null
          referring_doctor?: string | null
          practice_number?: string | null
          icd10_code?: string | null
          medical_aid_name?: string | null
          medical_aid_number?: string | null
          member_number?: string | null
          case_manager_name?: string | null
          case_manager_contact?: string | null
          initial_evaluation_date: string
          case_number: string
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_number?: string
          surname?: string
          full_name?: string
          id_number?: string | null
          date_of_birth?: string
          sex?: 'Male' | 'Female' | 'Other'
          phone_number?: string | null
          email?: string | null
          address?: Json | null
          emergency_contact?: Json | null
          referring_doctor?: string | null
          practice_number?: string | null
          icd10_code?: string | null
          medical_aid_name?: string | null
          medical_aid_number?: string | null
          member_number?: string | null
          case_manager_name?: string | null
          case_manager_contact?: string | null
          initial_evaluation_date?: string
          case_number?: string
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wound_assessments: {
        Row: {
          id: string
          patient_id: string
          assessment_date: string
          assessment_number: number
          ulcer_type: 'venous' | 'arterial' | 'mixed' | 'diabetic_foot' | 'pressure_injury' | 'skin_tear' | 'burn' | 'moisture_associated' | 'other'
          ulcer_location: string
          wound_duration_days: number | null
          abpi_left: number | null
          abpi_right: number | null
          leg_circumference_left: number | null
          leg_circumference_right: number | null
          toe_pressure_left: number | null
          toe_pressure_right: number | null
          time_tissue: Json
          time_infection: Json
          time_moisture: Json
          time_edge: Json
          length_cm: number | null
          width_cm: number | null
          depth_cm: number | null
          area_cm2: number | null
          volume_cm3: number | null
          pain_score: number | null
          pain_location: string | null
          pain_character: string | null
          pain_frequency: string | null
          intrinsic_factors: Json | null
          extrinsic_factors: Json | null
          diabetic_foot_staging: string | null
          pressure_injury_stage: string | null
          skin_tear_type: 'Type 1' | 'Type 2' | 'Type 3' | null
          burn_depth: string | null
          burn_percentage: number | null
          healability_status: 'healable' | 'maintenance' | 'non_healable' | null
          compression_recommendation: string | null
          urgent_referral_required: boolean
          referral_reason: string | null
          notes: string | null
          performed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          assessment_date: string
          assessment_number: number
          ulcer_type: 'venous' | 'arterial' | 'mixed' | 'diabetic_foot' | 'pressure_injury' | 'skin_tear' | 'burn' | 'moisture_associated' | 'other'
          ulcer_location: string
          wound_duration_days?: number | null
          abpi_left?: number | null
          abpi_right?: number | null
          leg_circumference_left?: number | null
          leg_circumference_right?: number | null
          toe_pressure_left?: number | null
          toe_pressure_right?: number | null
          time_tissue: Json
          time_infection: Json
          time_moisture: Json
          time_edge: Json
          length_cm?: number | null
          width_cm?: number | null
          depth_cm?: number | null
          area_cm2?: number | null
          volume_cm3?: number | null
          pain_score?: number | null
          pain_location?: string | null
          pain_character?: string | null
          pain_frequency?: string | null
          intrinsic_factors?: Json | null
          extrinsic_factors?: Json | null
          diabetic_foot_staging?: string | null
          pressure_injury_stage?: string | null
          skin_tear_type?: 'Type 1' | 'Type 2' | 'Type 3' | null
          burn_depth?: string | null
          burn_percentage?: number | null
          healability_status?: 'healable' | 'maintenance' | 'non_healable' | null
          compression_recommendation?: string | null
          urgent_referral_required?: boolean
          referral_reason?: string | null
          notes?: string | null
          performed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          assessment_date?: string
          assessment_number?: number
          ulcer_type?: 'venous' | 'arterial' | 'mixed' | 'diabetic_foot' | 'pressure_injury' | 'skin_tear' | 'burn' | 'moisture_associated' | 'other'
          ulcer_location?: string
          wound_duration_days?: number | null
          abpi_left?: number | null
          abpi_right?: number | null
          leg_circumference_left?: number | null
          leg_circumference_right?: number | null
          toe_pressure_left?: number | null
          toe_pressure_right?: number | null
          time_tissue?: Json
          time_infection?: Json
          time_moisture?: Json
          time_edge?: Json
          length_cm?: number | null
          width_cm?: number | null
          depth_cm?: number | null
          area_cm2?: number | null
          volume_cm3?: number | null
          pain_score?: number | null
          pain_location?: string | null
          pain_character?: string | null
          pain_frequency?: string | null
          intrinsic_factors?: Json | null
          extrinsic_factors?: Json | null
          diabetic_foot_staging?: string | null
          pressure_injury_stage?: string | null
          skin_tear_type?: 'Type 1' | 'Type 2' | 'Type 3' | null
          burn_depth?: string | null
          burn_percentage?: number | null
          healability_status?: 'healable' | 'maintenance' | 'non_healable' | null
          compression_recommendation?: string | null
          urgent_referral_required?: boolean
          referral_reason?: string | null
          notes?: string | null
          performed_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      care_plans: {
        Row: {
          id: string
          patient_id: string
          assessment_id: string | null
          plan_date: string
          plan_version: number
          treatment_objectives: string[]
          expected_healing_timeframe: number | null
          review_frequency_days: number
          selected_products: Json
          product_rationale: string | null
          compression_recommended: boolean
          compression_type: string | null
          compression_pressure: string | null
          compression_contraindications: string[] | null
          npwt_recommended: boolean
          npwt_pressure_mmhg: number | null
          npwt_mode: 'continuous' | 'intermittent' | null
          npwt_dressing_change_frequency: number | null
          npwt_contraindications: string[] | null
          education_topics: string[] | null
          education_materials_provided: string[] | null
          patient_understanding_level: 'poor' | 'fair' | 'good' | 'excellent' | null
          patient_concerns: string | null
          social_support_level: 'none' | 'limited' | 'adequate' | 'excellent' | null
          adherence_barriers: string[] | null
          estimated_cost_per_visit: number | null
          estimated_total_cost: number | null
          cost_breakdown: Json | null
          status: 'active' | 'completed' | 'discontinued' | 'revised'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          assessment_id?: string | null
          plan_date: string
          plan_version?: number
          treatment_objectives: string[]
          expected_healing_timeframe?: number | null
          review_frequency_days?: number
          selected_products: Json
          product_rationale?: string | null
          compression_recommended?: boolean
          compression_type?: string | null
          compression_pressure?: string | null
          compression_contraindications?: string[] | null
          npwt_recommended?: boolean
          npwt_pressure_mmhg?: number | null
          npwt_mode?: 'continuous' | 'intermittent' | null
          npwt_dressing_change_frequency?: number | null
          npwt_contraindications?: string[] | null
          education_topics?: string[] | null
          education_materials_provided?: string[] | null
          patient_understanding_level?: 'poor' | 'fair' | 'good' | 'excellent' | null
          patient_concerns?: string | null
          social_support_level?: 'none' | 'limited' | 'adequate' | 'excellent' | null
          adherence_barriers?: string[] | null
          estimated_cost_per_visit?: number | null
          estimated_total_cost?: number | null
          cost_breakdown?: Json | null
          status?: 'active' | 'completed' | 'discontinued' | 'revised'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          assessment_id?: string | null
          plan_date?: string
          plan_version?: number
          treatment_objectives?: string[]
          expected_healing_timeframe?: number | null
          review_frequency_days?: number
          selected_products?: Json
          product_rationale?: string | null
          compression_recommended?: boolean
          compression_type?: string | null
          compression_pressure?: string | null
          compression_contraindications?: string[] | null
          npwt_recommended?: boolean
          npwt_pressure_mmhg?: number | null
          npwt_mode?: 'continuous' | 'intermittent' | null
          npwt_dressing_change_frequency?: number | null
          npwt_contraindications?: string[] | null
          education_topics?: string[] | null
          education_materials_provided?: string[] | null
          patient_understanding_level?: 'poor' | 'fair' | 'good' | 'excellent' | null
          patient_concerns?: string | null
          social_support_level?: 'none' | 'limited' | 'adequate' | 'excellent' | null
          adherence_barriers?: string[] | null
          estimated_cost_per_visit?: number | null
          estimated_total_cost?: number | null
          cost_breakdown?: Json | null
          status?: 'active' | 'completed' | 'discontinued' | 'revised'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_compression_recommendation: {
        Args: {
          abpi_value: number
        }
        Returns: string
      }
      calculate_wound_area: {
        Args: {
          length_cm: number
          width_cm: number
        }
        Returns: number
      }
      calculate_healing_rate: {
        Args: {
          initial_area: number
          current_area: number
          days_elapsed: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 