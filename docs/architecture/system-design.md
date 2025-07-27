# WHASA Wound-Care Nurse Practitioner App - System Design & Implementation Plan

## Technical Lead Final Review - System Architecture

This document provides a comprehensive system design and implementation plan for the WHASA wound-care nurse practitioner mobile application, based on the Product Requirements Document and Technical Functional Specification.

## 1. High-Level System Architecture

### 1.1 Technology Stack Selection

**Mobile Client:**
- **Platform**: Flutter (Recommended)
  - Cross-platform iOS/Android support
  - Single codebase maintenance
  - Native performance with platform-specific UI adaptations
  - Strong offline capabilities with SQLite integration
  - Excellent camera integration for wound photography

**Backend Services:**
- **API Layer**: Node.js with Express.js
  - RESTful API design
  - JWT authentication with refresh tokens
  - Rate limiting and security middleware
  - WebSocket support for real-time notifications

**Database:**
- **Primary Database**: PostgreSQL
  - ACID compliance for clinical data integrity
  - Strong support for JSON columns for flexible schema
  - Excellent full-text search capabilities
  - Robust backup and recovery mechanisms
- **Local Database**: SQLite (client-side)
  - Offline data storage and synchronization
  - Local caching of patient records and images

**Infrastructure:**
- **Cloud Platform**: AWS or Azure (South Africa regions)
- **File Storage**: S3-compatible object storage for wound images
- **Message Queue**: Redis for background job processing
- **Monitoring**: Application Performance Monitoring (APM) solution

### 1.2 System Components

```
[Mobile App] <--> [API Gateway] <--> [Backend Services]
     |                                      |
[SQLite DB]                          [PostgreSQL]
     |                                      |
[Local Images]                       [Object Storage]
```

### 1.3 Security Architecture

- **Authentication**: OAuth 2.0 with multi-factor authentication
- **Authorization**: Role-based access control (RBAC)
- **Data Encryption**: AES-256 at rest, TLS 1.3 in transit
- **POPIA Compliance**: Data retention policies and audit logging
- **API Security**: Rate limiting, input validation, SQL injection prevention

## 2. Database Schema Design

### 2.1 Core Entities

**Patients Table:**
```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_number VARCHAR(20) UNIQUE NOT NULL,
    surname VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    id_number VARCHAR(13) UNIQUE,
    date_of_birth DATE NOT NULL,
    sex VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Medical History Table:**
```sql
CREATE TABLE medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    diabetes BOOLEAN DEFAULT FALSE,
    hypertension BOOLEAN DEFAULT FALSE,
    obesity BOOLEAN DEFAULT FALSE,
    autoimmune_diseases TEXT[],
    cardiac_conditions TEXT[],
    respiratory_conditions TEXT[],
    previous_surgeries JSONB,
    radiation_exposure BOOLEAN DEFAULT FALSE,
    previous_amputation BOOLEAN DEFAULT FALSE,
    gait_changes BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Wound Assessments Table:**
```sql
CREATE TABLE wound_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    assessment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    ulcer_type VARCHAR(50) NOT NULL, -- venous, arterial, mixed, diabetic_foot, pressure_injury
    abpi_left DECIMAL(3,2),
    abpi_right DECIMAL(3,2),
    leg_circumference_left DECIMAL(5,2),
    leg_circumference_right DECIMAL(5,2),
    time_assessment JSONB NOT NULL, -- Tissue, Infection, Moisture, Edge data
    wound_measurements JSONB, -- length, width, depth with units
    pain_score INTEGER CHECK (pain_score >= 0 AND pain_score <= 10),
    intrinsic_factors JSONB,
    extrinsic_factors JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Care Plans Table:**
```sql
CREATE TABLE care_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES wound_assessments(id),
    healability_status VARCHAR(20) NOT NULL, -- healable, maintenance, non_healable
    treatment_objectives TEXT[],
    selected_products JSONB,
    compression_recommended BOOLEAN,
    npwt_recommended BOOLEAN,
    expected_healing_timeframe INTEGER, -- days
    patient_concerns TEXT,
    cost_estimate JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 Clinical Decision Rules Implementation

**ABPI Decision Logic:**
```sql
CREATE OR REPLACE FUNCTION get_compression_recommendation(abpi_value DECIMAL)
RETURNS TEXT AS $$
BEGIN
    IF abpi_value < 0.6 THEN
        RETURN 'urgent_referral_no_compression';
    ELSIF abpi_value >= 0.6 AND abpi_value <= 0.8 THEN
        RETURN 'modified_compression_close_monitoring';
    ELSIF abpi_value > 0.8 THEN
        RETURN 'compression_safe_recommended';
    ELSE
        RETURN 'abpi_required';
    END IF;
END;
$$ LANGUAGE plpgsql;
```

## 3. Core Functional Modules

### 3.1 Patient Registration & Intake Module

**Features:**
- Demographic data capture with validation
- Medical history comprehensive assessment
- Physical assessment with vital signs
- Referral information and medical aid details
- Automatic case number generation
- Initial evaluation date timestamping

**Implementation Notes:**
- Form validation following WHASA assessment form requirements
- Auto-save functionality for incomplete registrations
- Duplicate patient detection using ID number
- Integration with medical aid verification APIs (future)

### 3.2 Wound Assessment Module

**T.I.M.E. Framework Implementation:**
- **Tissue**: Viable vs necrotic tissue classification
- **Infection/Inflammation**: NERDS/STONES indicators checklist
- **Moisture**: Exudate level and type assessment
- **Edge**: Surrounding skin condition evaluation

**Photo Capture Features:**
- Camera integration with measurement overlays
- Automatic timestamp and patient association
- Image compression and secure storage
- Annotation tools for clinical documentation

**ABPI Integration:**
- Left and right ankle-brachial pressure index entry
- Automatic decision logic triggers
- Clinical recommendations based on WHASA guidelines
- Alert system for urgent referrals

### 3.3 Care Planning Wizard

**Healability Assessment:**
- Automatic classification based on vascular assessment
- Systemic factor evaluation
- Treatment objective setting interface
- Patient-centered concern capture

**Product Selection Database:**
- WHASA Wound-Bed Preparation categories
- Debridement options (autolytic, enzymatic, mechanical)
- Infection control products (antiseptics, antimicrobials)
- Moisture management dressings
- Edge protection and pain control options
- Compression system recommendations

**Cost Estimation Engine:**
- Pre-defined procedure codes
- Material cost calculation
- Time-based consultation fees
- Medical aid billing code generation

### 3.4 NPWT Workflow Module

**Step-by-Step Checklists:**
- Foam selection and sizing guide
- Cutting and placement instructions
- Sealing verification checklist
- Pump connection and settings
- Pressure level configuration
- Run time scheduling
- Monitoring and alarm management

**Device Integration:**
- Bluetooth connectivity to NPWT pumps
- Real-time parameter reading
- Settings synchronization
- Error and alarm logging
- Manual entry fallback options

### 3.5 Conventional Wound Care Module

**Treatment Checklists:**
- Wound cleaning protocols
- Irrigation procedures
- Debridement method selection
- Dressing application steps
- Compression bandaging (when indicated)
- Off-loading device placement
- Analgesia administration and response

**Real-Time Guidance:**
- Dynamic recommendations based on wound changes
- ABPI threshold monitoring
- Wound deterioration alerts
- Progress tracking against MEASURE scores

## 4. Offline-First Architecture

### 4.1 Data Synchronization Strategy

**Local Storage:**
- SQLite database with full schema replication
- Image caching with compression
- Conflict resolution mechanisms
- Pending sync queue management

**Sync Implementation:**
```dart
class SyncManager {
  Future<void> syncPatientData() async {
    // Upload pending changes
    await uploadPendingChanges();
    
    // Download updates from server
    await downloadServerUpdates();
    
    // Resolve conflicts
    await resolveConflicts();
    
    // Update sync status
    await updateSyncStatus();
  }
  
  Future<void> handleConflict(ConflictData conflict) async {
    // Implement last-write-wins with clinical review
    // Priority: Server data for clinical decisions
    // Priority: Local data for recent assessments
  }
}
```

### 4.2 Offline Indicators

- Clear visual indicators for offline status
- Sync progress feedback
- Pending changes notification
- Data freshness timestamps

## 5. Security Implementation

### 5.1 Authentication & Authorization

**Multi-Factor Authentication:**
```dart
class AuthService {
  Future<AuthResult> authenticateUser(String username, String password) async {
    // Primary authentication
    final primaryAuth = await validateCredentials(username, password);
    
    if (primaryAuth.success) {
      // Send OTP via SMS/Email
      await sendOTP(primaryAuth.user.phoneNumber);
      
      // Return temporary token requiring OTP verification
      return AuthResult.requiresOTP(primaryAuth.user.id);
    }
    
    return AuthResult.failed();
  }
  
  Future<SessionToken> verifyOTP(String userId, String otp) async {
    if (await validateOTP(userId, otp)) {
      return generateSessionToken(userId);
    }
    throw AuthenticationException('Invalid OTP');
  }
}
```

**Role-Based Access Control:**
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB NOT NULL
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);
```

### 5.2 Data Encryption

**At Rest:**
- Database encryption using transparent data encryption
- File system encryption for local storage
- Encrypted backup storage

**In Transit:**
- TLS 1.3 for all API communications
- Certificate pinning for mobile app
- End-to-end encryption for sensitive data

### 5.3 POPIA Compliance

**Data Retention:**
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 6. Performance Requirements

### 6.1 Response Time Targets

- **App Launch**: < 2 seconds cold start
- **Screen Navigation**: < 300ms response time
- **Data Sync**: < 5 seconds for standard patient record
- **Photo Upload**: < 10 seconds for high-resolution image

### 6.2 Optimization Strategies

- Lazy loading for large datasets
- Image compression and progressive loading
- Database query optimization with proper indexing
- Caching strategies for frequently accessed data
- Background sync scheduling

## 7. Integration Points

### 7.1 Medical Device Integration

**NPWT Pump Connectivity:**
```dart
class NPWTDeviceService {
  Future<DeviceConnection> connectToPump(String deviceId) async {
    final device = await BluetoothService.connect(deviceId);
    
    if (device.isConnected) {
      return DeviceConnection(
        device: device,
        capabilities: await device.getCapabilities(),
        protocols: await device.getSupportedProtocols()
      );
    }
    
    throw DeviceConnectionException('Failed to connect to NPWT pump');
  }
  
  Future<PumpSettings> readPumpSettings(DeviceConnection connection) async {
    final data = await connection.device.readCharacteristic(
      settingsCharacteristic
    );
    
    return PumpSettings.fromBytes(data);
  }
}
```

### 7.2 Barcode Scanner Integration

- Camera-based barcode scanning
- Inventory item recognition
- Automatic stock deduction
- Expiry date tracking

### 7.3 HL7/FHIR Interface (Future)

- Patient demographic import/export
- Clinical document exchange
- Billing code standardization
- Interoperability with EHR systems

## 8. Testing Strategy

### 8.1 Clinical Rule Validation

- Unit tests for all ABPI decision logic
- Integration tests for wound classification
- Validation against WHASA guidelines
- Clinical expert review sessions

### 8.2 Security Testing

- Penetration testing for API endpoints
- Encryption validation
- Authentication bypass testing
- Data leakage assessment

### 8.3 Performance Testing

- Load testing for concurrent users
- Stress testing for large datasets
- Network latency simulation
- Battery usage optimization

### 8.4 User Acceptance Testing

- Clinical workflow validation
- Usability testing with wound specialists
- Offline scenario testing
- Device integration validation

## 9. Deployment Strategy

### 9.1 Environment Setup

- **Development**: Local development with Docker containers
- **Staging**: Cloud-based staging environment
- **Production**: Multi-region deployment with failover

### 9.2 CI/CD Pipeline

```yaml
# Azure DevOps Pipeline Example
stages:
  - stage: Build
    jobs:
      - job: BuildApp
        steps:
          - task: FlutterBuild
          - task: RunUnitTests
          - task: SecurityScan

  - stage: Test
    jobs:
      - job: IntegrationTests
        steps:
          - task: DeployToStaging
          - task: RunIntegrationTests
          - task: PerformanceTests

  - stage: Deploy
    jobs:
      - job: ProductionDeploy
        steps:
          - task: DeployToProduction
          - task: HealthCheck
          - task: NotifyStakeholders
```

### 9.3 Monitoring & Alerting

- Application performance monitoring
- Error tracking and logging
- User behavior analytics
- System health dashboards

## 10. Success Criteria & KPIs

### 10.1 Technical Performance

- 99.5% uptime availability
- < 2 second average response time
- Zero critical security vulnerabilities
- < 1% data sync failure rate

### 10.2 Clinical Outcomes

- 95% ABPI assessment completion rate
- 30% reduction in documentation time
- 10% improvement in wound healing times
- 90% reduction in inventory stock-outs

### 10.3 User Adoption

- 80% active user adoption within one month
- < 5% user-reported critical issues
- 90% user satisfaction score
- < 10% support ticket volume per user per month

## 11. Risk Mitigation

### 11.1 Clinical Safety

- **Risk**: Incorrect clinical recommendations
- **Mitigation**: Rigorous validation against WHASA guidelines, clinical expert review, user acceptance testing

### 11.2 Data Security

- **Risk**: Patient data breach
- **Mitigation**: Multi-layered security, encryption, regular audits, POPIA compliance framework

### 11.3 User Adoption

- **Risk**: Resistance to digital transformation
- **Mitigation**: Early clinician involvement, comprehensive training, demonstrable time-saving benefits

### 11.4 Technical Integration

- **Risk**: Device connectivity issues
- **Mitigation**: Multiple device protocols, manual entry fallbacks, vendor partnerships

## 12. Next Steps

1. **Stakeholder Review**: Present this design to clinical stakeholders for validation
2. **Technical Validation**: Confirm technology stack with infrastructure team
3. **Prototype Development**: Build proof-of-concept for core workflows
4. **Security Assessment**: Conduct preliminary security review
5. **Development Kickoff**: Initialize development sprints based on priority modules

This system design provides a comprehensive foundation for building the WHASA wound-care nurse practitioner application, ensuring clinical accuracy, technical robustness, and regulatory compliance while delivering an intuitive user experience for healthcare professionals.