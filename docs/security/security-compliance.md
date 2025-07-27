# WHASA Wound-Care Application Security & POPIA Compliance Framework

## Executive Summary

This document outlines the comprehensive security and compliance framework for the WHASA wound-care application, ensuring adherence to South Africa's Protection of Personal Information Act (POPIA) and international healthcare data protection standards. The framework covers data protection, security measures, audit trails, and regulatory compliance requirements.

## POPIA Compliance Framework

### 1. Legal Basis for Processing

#### Lawful Processing Grounds
- **Consent**: Explicit consent for wound care documentation and treatment planning
- **Legitimate Interest**: Healthcare delivery and clinical decision-making
- **Vital Interest**: Emergency medical care situations
- **Legal Obligation**: Medical record-keeping requirements
- **Performance of Contract**: Patient care agreements

#### Implementation
```sql
-- Consent tracking table (from database schema)
CREATE TABLE patient_consent (
    consent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id),
    consent_type VARCHAR(100) NOT NULL, -- 'treatment', 'data_processing', 'research'
    consent_status BOOLEAN NOT NULL,
    consent_date TIMESTAMPTZ NOT NULL,
    withdrawal_date TIMESTAMPTZ,
    legal_basis VARCHAR(100) NOT NULL,
    purpose_description TEXT NOT NULL,
    data_categories TEXT[] NOT NULL,
    retention_period INTEGER NOT NULL, -- years
    consent_version VARCHAR(10) NOT NULL,
    obtained_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Data Protection Principles

#### 2.1 Purpose Limitation
- **Primary Purpose**: Wound care assessment and treatment
- **Secondary Purposes**: Clinical research (with explicit consent), quality improvement
- **Prohibited Uses**: Marketing, unauthorized sharing, non-medical purposes

#### 2.2 Data Minimization
- Collect only data necessary for clinical care
- Automated data retention policies
- Regular data purging based on retention schedules

#### 2.3 Accuracy and Completeness
- Real-time data validation
- Audit trails for all data modifications
- Version control for clinical documents

#### 2.4 Storage Limitation
```sql
-- Data retention policy implementation
CREATE TABLE data_retention_policies (
    policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_category VARCHAR(100) NOT NULL,
    retention_period_years INTEGER NOT NULL,
    legal_basis TEXT NOT NULL,
    deletion_criteria TEXT NOT NULL,
    review_frequency_months INTEGER DEFAULT 12,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automated retention enforcement
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS VOID AS $$
DECLARE
    retention_record RECORD;
BEGIN
    FOR retention_record IN 
        SELECT * FROM data_retention_policies WHERE is_active = TRUE
    LOOP
        -- Implement category-specific retention logic
        CASE retention_record.data_category
            WHEN 'clinical_data' THEN
                -- Archive clinical data older than retention period
                UPDATE patients SET 
                    status = 'archived'
                WHERE created_at < NOW() - INTERVAL '1 year' * retention_record.retention_period_years
                AND status = 'inactive';
                
            WHEN 'images' THEN
                -- Mark images for deletion
                UPDATE wound_images SET 
                    access_level = 'archived'
                WHERE capture_date < NOW() - INTERVAL '1 year' * retention_record.retention_period_years;
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 3. Data Subject Rights

#### 3.1 Right to Access
```sql
-- Patient data export function
CREATE OR REPLACE FUNCTION export_patient_data(patient_uuid UUID)
RETURNS JSON AS $$
DECLARE
    patient_data JSON;
BEGIN
    SELECT json_build_object(
        'patient_info', (SELECT row_to_json(p) FROM patients p WHERE patient_id = patient_uuid),
        'medical_history', (SELECT json_agg(row_to_json(mh)) FROM patient_medical_history mh WHERE patient_id = patient_uuid),
        'wounds', (SELECT json_agg(row_to_json(w)) FROM wounds w WHERE patient_id = patient_uuid),
        'assessments', (SELECT json_agg(row_to_json(ta)) FROM time_assessments ta 
                       JOIN wounds w ON ta.wound_id = w.wound_id WHERE w.patient_id = patient_uuid),
        'therapy_sessions', (SELECT json_agg(row_to_json(ts)) FROM therapy_sessions ts 
                            JOIN wounds w ON ts.wound_id = w.wound_id WHERE w.patient_id = patient_uuid),
        'images_metadata', (SELECT json_agg(json_build_object(
            'image_id', wi.image_id,
            'filename', wi.image_filename,
            'capture_date', wi.capture_date,
            'category', wi.image_category
        )) FROM wound_images wi WHERE wi.patient_id = patient_uuid)
    ) INTO patient_data;
    
    RETURN patient_data;
END;
$$ LANGUAGE plpgsql;
```

#### 3.2 Right to Rectification
- Real-time data correction capabilities
- Audit trail for all corrections
- Notification system for stakeholders

#### 3.3 Right to Erasure
```sql
-- POPIA-compliant data anonymization
CREATE OR REPLACE FUNCTION anonymize_patient_data(patient_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Log the anonymization request
    INSERT INTO data_retention_log (
        patient_id, data_category, retention_status, action_taken, action_date, legal_basis_for_processing
    ) VALUES (
        patient_uuid, 'complete_record', 'anonymized', 'patient_request', CURRENT_DATE, 'right_to_erasure'
    );
    
    -- Anonymize patient data while preserving clinical insights
    UPDATE patients SET 
        surname = 'ANONYMIZED-' || patient_id::text,
        first_name = 'ANONYMIZED',
        other_names = NULL,
        id_number = NULL,
        passport_number = NULL,
        phone_primary = NULL,
        phone_secondary = NULL,
        email = NULL,
        address_line1 = NULL,
        address_line2 = NULL,
        city = NULL,
        emergency_contact_name = NULL,
        emergency_contact_phone = NULL,
        medical_aid_number = NULL,
        updated_at = NOW()
    WHERE patient_id = patient_uuid;
    
    -- Anonymize image metadata
    UPDATE wound_images SET 
        original_filename = 'anonymized_' || image_id::text,
        clinical_notes = 'ANONYMIZED',
        storage_path = '/anonymized/' || image_id::text
    WHERE patient_id = patient_uuid;
    
    -- Clinical data remains for medical research purposes (anonymized)
END;
$$ LANGUAGE plpgsql;
```

#### 3.4 Right to Data Portability
- Standardized export formats (JSON, HL7 FHIR)
- Secure transfer mechanisms
- Automated export capabilities

### 4. Cross-Border Data Transfers

#### 4.1 Transfer Mechanisms
- **Adequacy Decisions**: Transfers to countries with adequate protection
- **Standard Contractual Clauses**: For transfers to third countries
- **Binding Corporate Rules**: For multinational healthcare organizations

#### 4.2 Implementation
```sql
-- Cross-border transfer tracking
CREATE TABLE cross_border_transfers (
    transfer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id),
    destination_country VARCHAR(100) NOT NULL,
    recipient_organization VARCHAR(200) NOT NULL,
    transfer_mechanism VARCHAR(100) NOT NULL, -- 'adequacy_decision', 'scc', 'bcr'
    legal_basis TEXT NOT NULL,
    data_categories TEXT[] NOT NULL,
    transfer_date TIMESTAMPTZ DEFAULT NOW(),
    purpose TEXT NOT NULL,
    patient_consent_obtained BOOLEAN DEFAULT FALSE,
    retention_period_destination INTEGER, -- years
    authorized_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Architecture

### 1. Encryption Framework

#### 1.1 Data at Rest
```python
# Example encryption implementation for sensitive fields
import cryptography.fernet as fernet
import os

class FieldEncryption:
    def __init__(self):
        self.key = os.environ.get('FIELD_ENCRYPTION_KEY')
        self.cipher = fernet.Fernet(self.key.encode())
    
    def encrypt_field(self, plaintext: str) -> str:
        """Encrypt sensitive field data"""
        if not plaintext:
            return None
        return self.cipher.encrypt(plaintext.encode()).decode()
    
    def decrypt_field(self, ciphertext: str) -> str:
        """Decrypt sensitive field data"""
        if not ciphertext:
            return None
        return self.cipher.decrypt(ciphertext.encode()).decode()

# Database column encryption configuration
ENCRYPTED_COLUMNS = {
    'patients': ['id_number', 'phone_primary', 'email'],
    'patient_medical_history': ['medications'],
    'therapy_sessions': ['session_notes']
}
```

#### 1.2 Data in Transit
- **TLS 1.3**: All API communications
- **Certificate Pinning**: Mobile application security
- **End-to-End Encryption**: Patient portal communications

#### 1.3 Key Management
```yaml
# Key Management Service Configuration
key_management:
  provider: "HashiCorp Vault" # or AWS KMS, Azure Key Vault
  encryption_keys:
    - name: "patient_data_key"
      type: "AES-256"
      rotation_interval: "90d"
      usage: "field_level_encryption"
    
    - name: "image_encryption_key"
      type: "AES-256"
      rotation_interval: "180d"
      usage: "file_encryption"
    
    - name: "backup_encryption_key"
      type: "AES-256"
      rotation_interval: "365d"
      usage: "backup_encryption"
  
  key_rotation:
    automatic: true
    notification_threshold: "30d"
    emergency_rotation: true
```

### 2. Access Control Framework

#### 2.1 Role-Based Access Control (RBAC)
```sql
-- Comprehensive RBAC implementation
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(100) UNIQUE NOT NULL,
    role_description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    resource_type VARCHAR(100) NOT NULL, -- 'patient', 'wound', 'image', 'report'
    action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'export'
    conditions JSONB, -- Additional access conditions
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(role_id),
    permission_id UUID NOT NULL REFERENCES permissions(permission_id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES users(user_id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(user_id),
    role_id UUID NOT NULL REFERENCES roles(role_id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES users(user_id),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, role_id)
);

-- Access control function
CREATE OR REPLACE FUNCTION check_user_permission(
    user_uuid UUID,
    resource_type VARCHAR(100),
    action VARCHAR(50),
    resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE ur.user_id = user_uuid
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        AND p.resource_type = resource_type
        AND p.action = action
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;
```

#### 2.2 Attribute-Based Access Control (ABAC)
```python
# Policy engine for context-aware access control
class AccessPolicy:
    def __init__(self):
        self.policies = {
            'patient_data_access': {
                'conditions': [
                    'user.role == "wound_specialist_nurse"',
                    'patient.facility_id == user.facility_id',
                    'current_time.hour >= 6 and current_time.hour <= 22'
                ],
                'exceptions': [
                    'emergency_access == True'
                ]
            },
            'cross_facility_access': {
                'conditions': [
                    'user.role in ["case_manager", "administrator"]',
                    'access_request.approved == True'
                ]
            }
        }
    
    def evaluate_access(self, user, resource, action, context):
        """Evaluate access based on policies"""
        policy_key = f"{resource.type}_{action}"
        policy = self.policies.get(policy_key)
        
        if not policy:
            return False
        
        # Evaluate conditions
        for condition in policy['conditions']:
            if not self._evaluate_condition(condition, user, resource, context):
                # Check exceptions
                for exception in policy.get('exceptions', []):
                    if self._evaluate_condition(exception, user, resource, context):
                        self._log_exception_access(user, resource, action, exception)
                        return True
                return False
        
        return True
```

### 3. Audit and Monitoring

#### 3.1 Comprehensive Audit Trail
```sql
-- Enhanced audit logging with POPIA compliance
CREATE OR REPLACE FUNCTION comprehensive_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    user_role user_role_enum;
    ip_address INET;
    user_agent TEXT;
BEGIN
    -- Get current user context
    current_user_id := COALESCE(current_setting('app.current_user_id', true)::UUID, NULL);
    user_role := COALESCE(current_setting('app.current_user_role', true)::user_role_enum, NULL);
    ip_address := COALESCE(current_setting('app.client_ip', true)::INET, NULL);
    user_agent := COALESCE(current_setting('app.user_agent', true), NULL);
    
    -- Log the audit event
    INSERT INTO audit_log (
        table_name,
        record_id,
        operation_type,
        old_values,
        new_values,
        changed_fields,
        user_id,
        user_role,
        ip_address,
        user_agent,
        timestamp,
        business_context
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.patient_id, OLD.patient_id, NEW.user_id, OLD.user_id), -- Adjust based on table
        TG_OP,
        CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
        CASE 
            WHEN TG_OP = 'UPDATE' THEN 
                (SELECT array_agg(key) FROM jsonb_each(to_jsonb(OLD)) 
                 WHERE value != to_jsonb(NEW)->key)
            ELSE NULL 
        END,
        current_user_id,
        user_role,
        ip_address,
        user_agent,
        NOW(),
        COALESCE(current_setting('app.business_context', true), 'normal_operation')
    );
    
    -- Return appropriate record
    RETURN CASE TG_OP 
        WHEN 'DELETE' THEN OLD 
        ELSE NEW 
    END;
END;
$$ LANGUAGE plpgsql;
```

#### 3.2 Security Event Monitoring
```python
# Security monitoring and alerting system
import logging
from enum import Enum
from datetime import datetime, timedelta

class SecurityEventType(Enum):
    FAILED_LOGIN = "failed_login"
    SUSPICIOUS_ACCESS = "suspicious_access"
    DATA_EXPORT = "data_export"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    ANOMALOUS_BEHAVIOR = "anomalous_behavior"

class SecurityMonitor:
    def __init__(self):
        self.alert_thresholds = {
            SecurityEventType.FAILED_LOGIN: 5,  # 5 failed attempts in 15 minutes
            SecurityEventType.SUSPICIOUS_ACCESS: 3,  # 3 suspicious events in 1 hour
            SecurityEventType.DATA_EXPORT: 1,  # Any large data export
        }
    
    def log_security_event(self, event_type: SecurityEventType, user_id: str, 
                          details: dict, severity: int = 3):
        """Log security event and check for alert conditions"""
        event = {
            'timestamp': datetime.utcnow(),
            'event_type': event_type.value,
            'user_id': user_id,
            'severity': severity,
            'details': details,
            'ip_address': details.get('ip_address'),
            'user_agent': details.get('user_agent')
        }
        
        # Store in database
        self._store_security_event(event)
        
        # Check alert thresholds
        if self._check_alert_threshold(event_type, user_id):
            self._trigger_security_alert(event_type, user_id, event)
    
    def detect_anomalous_behavior(self, user_id: str, action: str, context: dict):
        """Detect unusual access patterns"""
        # Time-based anomalies
        if self._is_unusual_time(context.get('timestamp')):
            self.log_security_event(
                SecurityEventType.ANOMALOUS_BEHAVIOR,
                user_id,
                {'reason': 'unusual_access_time', 'action': action, **context},
                severity=2
            )
        
        # Location-based anomalies
        if self._is_unusual_location(user_id, context.get('ip_address')):
            self.log_security_event(
                SecurityEventType.ANOMALOUS_BEHAVIOR,
                user_id,
                {'reason': 'unusual_location', 'action': action, **context},
                severity=3
            )
        
        # Data access anomalies
        if self._is_unusual_data_access(user_id, action, context):
            self.log_security_event(
                SecurityEventType.SUSPICIOUS_ACCESS,
                user_id,
                {'reason': 'unusual_data_access', 'action': action, **context},
                severity=4
            )
```

### 4. Privacy by Design Implementation

#### 4.1 Data Protection Impact Assessment (DPIA)
```yaml
# DPIA Configuration for WHASA Application
dpia:
  assessment_id: "WHASA-DPIA-2024-001"
  version: "1.0"
  
  processing_purpose:
    primary: "Wound care assessment and treatment documentation"
    secondary: 
      - "Clinical decision support"
      - "Treatment outcome analysis"
      - "Inventory management"
  
  data_categories:
    special_categories:
      - health_data
      - biometric_data (wound images)
    personal_data:
      - identification_data
      - contact_information
      - location_data
      - device_identifiers
  
  legal_basis:
    primary: "vital_interests" # Emergency medical care
    secondary: "legitimate_interests" # Healthcare delivery
    consent_required: true
  
  risks_identified:
    - risk_id: "R001"
      description: "Unauthorized access to patient health data"
      likelihood: "medium"
      impact: "high"
      mitigation: "Multi-factor authentication, role-based access control"
    
    - risk_id: "R002"
      description: "Data breach during synchronization"
      likelihood: "low"
      impact: "high"
      mitigation: "End-to-end encryption, secure channels"
  
  privacy_measures:
    - measure: "data_minimization"
      implementation: "Collect only clinically necessary data"
    - measure: "purpose_limitation"
      implementation: "Strict purpose binding for all data processing"
    - measure: "storage_limitation"
      implementation: "Automated data retention and deletion"
```

#### 4.2 Privacy-Preserving Analytics
```python
# Differential privacy implementation for clinical analytics
import numpy as np
from typing import List, Dict

class PrivacyPreservingAnalytics:
    def __init__(self, epsilon: float = 1.0):
        """Initialize with privacy budget (epsilon)"""
        self.epsilon = epsilon
        self.privacy_budget_used = 0.0
    
    def add_laplace_noise(self, true_value: float, sensitivity: float) -> float:
        """Add Laplace noise for differential privacy"""
        if self.privacy_budget_used >= self.epsilon:
            raise ValueError("Privacy budget exhausted")
        
        noise_scale = sensitivity / self.epsilon
        noise = np.random.laplace(0, noise_scale)
        
        self.privacy_budget_used += sensitivity
        return true_value + noise
    
    def get_healing_statistics(self, wound_data: List[Dict]) -> Dict:
        """Get privacy-preserving healing statistics"""
        if not wound_data:
            return {}
        
        # Calculate true statistics
        healing_times = [w['healing_time_days'] for w in wound_data if w['status'] == 'healed']
        
        # Add noise to protect individual privacy
        avg_healing_time = self.add_laplace_noise(
            np.mean(healing_times), 
            sensitivity=1.0  # Maximum influence of single record
        )
        
        total_wounds = self.add_laplace_noise(
            len(wound_data),
            sensitivity=1.0
        )
        
        return {
            'average_healing_time_days': max(0, avg_healing_time),  # Ensure non-negative
            'total_wounds_analyzed': max(1, int(total_wounds)),
            'privacy_budget_remaining': self.epsilon - self.privacy_budget_used
        }
```

### 5. Incident Response Framework

#### 5.1 Data Breach Response Plan
```python
# Automated incident response system
from enum import Enum
from datetime import datetime, timedelta

class IncidentSeverity(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class IncidentType(Enum):
    DATA_BREACH = "data_breach"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    SYSTEM_COMPROMISE = "system_compromise"
    MALWARE_DETECTION = "malware_detection"

class IncidentResponse:
    def __init__(self):
        self.notification_requirements = {
            IncidentSeverity.CRITICAL: timedelta(hours=1),
            IncidentSeverity.HIGH: timedelta(hours=4),
            IncidentSeverity.MEDIUM: timedelta(hours=24),
            IncidentSeverity.LOW: timedelta(days=3)
        }
    
    def handle_data_breach(self, incident_details: dict):
        """Handle data breach incident according to POPIA requirements"""
        incident_id = self._create_incident_record(
            IncidentType.DATA_BREACH,
            incident_details
        )
        
        # Immediate containment
        self._contain_breach(incident_details)
        
        # Assess severity and impact
        severity = self._assess_breach_severity(incident_details)
        affected_individuals = self._identify_affected_individuals(incident_details)
        
        # POPIA notification requirements (within 72 hours)
        if severity in [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL]:
            self._notify_information_regulator(incident_id, incident_details)
        
        # Notify affected individuals if high risk
        if self._is_high_risk_to_individuals(incident_details):
            self._notify_affected_individuals(affected_individuals, incident_details)
        
        # Document response actions
        self._document_response_actions(incident_id, {
            'containment_actions': self._get_containment_actions(),
            'notification_actions': self._get_notification_actions(),
            'recovery_actions': self._get_recovery_actions()
        })
    
    def _assess_breach_severity(self, incident_details: dict) -> IncidentSeverity:
        """Assess the severity of a data breach"""
        factors = {
            'records_affected': incident_details.get('records_affected', 0),
            'data_sensitivity': incident_details.get('data_sensitivity', 'low'),
            'external_exposure': incident_details.get('external_exposure', False),
            'encryption_status': incident_details.get('encryption_status', 'encrypted')
        }
        
        score = 0
        
        # Number of records
        if factors['records_affected'] > 1000:
            score += 2
        elif factors['records_affected'] > 100:
            score += 1
        
        # Data sensitivity
        if factors['data_sensitivity'] == 'high':
            score += 2
        elif factors['data_sensitivity'] == 'medium':
            score += 1
        
        # External exposure
        if factors['external_exposure']:
            score += 2
        
        # Encryption status
        if factors['encryption_status'] == 'unencrypted':
            score += 2
        
        # Determine severity based on score
        if score >= 6:
            return IncidentSeverity.CRITICAL
        elif score >= 4:
            return IncidentSeverity.HIGH
        elif score >= 2:
            return IncidentSeverity.MEDIUM
        else:
            return IncidentSeverity.LOW
```

## Compliance Monitoring and Reporting

### 1. Automated Compliance Checking
```sql
-- Compliance monitoring queries
CREATE OR REPLACE VIEW compliance_dashboard AS
SELECT 
    'Consent Management' as compliance_area,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN consent_given = TRUE THEN 1 END) as patients_with_consent,
    ROUND(
        100.0 * COUNT(CASE WHEN consent_given = TRUE THEN 1 END) / COUNT(*), 
        2
    ) as compliance_percentage
FROM patients
WHERE status = 'active'

UNION ALL

SELECT 
    'Data Retention',
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 years' THEN 1 END) as within_retention,
    ROUND(
        100.0 * COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 years' THEN 1 END) / COUNT(*),
        2
    ) as compliance_percentage
FROM patients

UNION ALL

SELECT 
    'Audit Trail Coverage',
    COUNT(DISTINCT table_name) as tables_with_audit,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
    ROUND(
        100.0 * COUNT(DISTINCT table_name) / 
        (SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'),
        2
    ) as compliance_percentage
FROM audit_log;
```

### 2. Regular Compliance Reports
```python
# Automated compliance reporting
class ComplianceReporter:
    def __init__(self, db_connection):
        self.db = db_connection
    
    def generate_monthly_compliance_report(self, month: int, year: int):
        """Generate comprehensive monthly compliance report"""
        report = {
            'report_date': datetime.now(),
            'reporting_period': f"{year}-{month:02d}",
            'sections': {}
        }
        
        # POPIA Compliance Section
        report['sections']['popia_compliance'] = {
            'consent_compliance': self._check_consent_compliance(),
            'data_retention_compliance': self._check_data_retention(),
            'access_rights_fulfillment': self._check_access_rights_fulfillment(),
            'breach_incidents': self._get_breach_incidents(month, year)
        }
        
        # Security Metrics Section
        report['sections']['security_metrics'] = {
            'authentication_failures': self._get_auth_failures(month, year),
            'access_violations': self._get_access_violations(month, year),
            'encryption_coverage': self._check_encryption_coverage(),
            'vulnerability_assessments': self._get_vulnerability_status()
        }
        
        # Data Quality Section
        report['sections']['data_quality'] = {
            'completeness_score': self._calculate_data_completeness(),
            'accuracy_indicators': self._get_accuracy_metrics(),
            'consistency_checks': self._perform_consistency_checks()
        }
        
        return report
    
    def _check_consent_compliance(self):
        """Check consent management compliance"""
        query = """
        SELECT 
            COUNT(*) as total_patients,
            COUNT(CASE WHEN consent_given = TRUE THEN 1 END) as consented_patients,
            COUNT(CASE WHEN consent_date > NOW() - INTERVAL '12 months' THEN 1 END) as recent_consents
        FROM patients 
        WHERE status = 'active'
        """
        result = self.db.execute(query).fetchone()
        
        return {
            'total_active_patients': result['total_patients'],
            'patients_with_consent': result['consented_patients'],
            'consent_compliance_rate': (result['consented_patients'] / result['total_patients']) * 100 if result['total_patients'] > 0 else 0,
            'recent_consent_updates': result['recent_consents']
        }
```

## Technology Implementation Guidelines

### 1. Database Security Configuration
```sql
-- Database security hardening
-- Create dedicated database roles
CREATE ROLE whasa_app_read;
CREATE ROLE whasa_app_write;
CREATE ROLE whasa_backup;
CREATE ROLE whasa_audit_read;

-- Grant minimal required permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO whasa_app_read;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO whasa_app_write;
GRANT SELECT ON audit_log, security_events TO whasa_audit_read;

-- Enable row-level security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE wounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY facility_isolation ON patients
    FOR ALL
    TO whasa_app_read, whasa_app_write
    USING (facility_id = current_setting('app.current_facility_id')::UUID);

-- Enable connection encryption
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/path/to/server.crt';
ALTER SYSTEM SET ssl_key_file = '/path/to/server.key';
```

### 2. Application Security Configuration
```yaml
# Application security configuration
security:
  authentication:
    jwt:
      secret_key: "${JWT_SECRET_KEY}"
      expiry_minutes: 60
      refresh_expiry_days: 7
      algorithm: "HS256"
    
    mfa:
      enabled: true
      totp_issuer: "WHASA Wound Care"
      backup_codes: 10
    
    password_policy:
      min_length: 12
      require_uppercase: true
      require_lowercase: true
      require_numbers: true
      require_symbols: true
      max_age_days: 90
      history_check: 12
  
  encryption:
    field_encryption:
      algorithm: "AES-256-GCM"
      key_rotation_days: 90
    
    file_encryption:
      algorithm: "AES-256-CBC"
      key_derivation: "PBKDF2"
  
  audit:
    log_level: "INFO"
    retention_days: 2555  # 7 years
    real_time_alerts: true
    
  session:
    timeout_minutes: 30
    concurrent_sessions: 3
    secure_cookies: true
    
  rate_limiting:
    login_attempts: 5
    time_window_minutes: 15
    api_calls_per_minute: 100
```

This comprehensive security and compliance framework ensures that the WHASA wound-care application meets all POPIA requirements while maintaining the highest standards of data protection and security. The framework is designed to be adaptive and can be updated as regulations evolve and new security threats emerge.