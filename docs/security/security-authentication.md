# WHASA App - Security & Authentication Implementation

## Overview

This document outlines the comprehensive security and authentication implementation for the WHASA wound-care nurse practitioner application, ensuring POPIA compliance, data protection, and secure access control.

## 1. Authentication System

### 1.1 Multi-Factor Authentication (MFA)

#### Primary Authentication
```javascript
// Backend: Node.js with bcrypt
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

class AuthenticationService {
    async authenticateUser(username, password) {
        try {
            const user = await User.findOne({ 
                where: { username, is_active: true }
            });
            
            if (!user) {
                await this.logFailedAttempt(username, 'user_not_found');
                throw new AuthenticationError('Invalid credentials');
            }
            
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            
            if (!isPasswordValid) {
                await this.logFailedAttempt(username, 'invalid_password');
                await this.handleFailedAttempt(user.id);
                throw new AuthenticationError('Invalid credentials');
            }
            
            // Check if account is locked
            if (user.is_locked && user.locked_until > new Date()) {
                throw new AuthenticationError('Account locked due to multiple failed attempts');
            }
            
            // Reset failed attempts on successful login
            await this.resetFailedAttempts(user.id);
            
            return {
                userId: user.id,
                requiresMFA: user.two_factor_enabled,
                tempToken: user.two_factor_enabled ? this.generateTempToken(user.id) : null
            };
            
        } catch (error) {
            logger.error('Authentication failed', { username, error: error.message });
            throw error;
        }
    }
    
    async verifyMFA(userId, mfaCode, tempToken) {
        const user = await User.findByPk(userId);
        
        if (!user || !user.two_factor_enabled) {
            throw new AuthenticationError('MFA not configured');
        }
        
        // Verify temporary token
        if (!this.verifyTempToken(tempToken, userId)) {
            throw new AuthenticationError('Invalid or expired temporary token');
        }
        
        // Verify TOTP code
        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: mfaCode,
            window: 2 // Allow 2 time windows (60 seconds)
        });
        
        if (!verified) {
            await this.logFailedAttempt(user.username, 'invalid_mfa');
            throw new AuthenticationError('Invalid MFA code');
        }
        
        // Generate session token
        const sessionToken = await this.generateSessionToken(user);
        
        // Update last login
        await user.update({ last_login: new Date() });
        
        // Log successful authentication
        await this.logSuccessfulLogin(user.id);
        
        return {
            sessionToken,
            user: this.sanitizeUserData(user),
            expiresAt: this.getTokenExpiration()
        };
    }
}
```

#### Flutter Client Implementation
```dart
// Flutter: Secure storage and biometric authentication
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

class AuthService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: IOSAccessibility.first_unlock_this_device,
    ),
  );
  
  final LocalAuthentication _localAuth = LocalAuthentication();
  
  Future<AuthResult> authenticateUser(String username, String password) async {
    try {
      final response = await _apiClient.post('/auth/login', {
        'username': username,
        'password': password,
        'device_id': await _getDeviceId(),
        'app_version': await _getAppVersion(),
      });
      
      if (response.data['requires_mfa']) {
        return AuthResult.requiresMFA(
          tempToken: response.data['temp_token'],
          userId: response.data['user_id'],
        );
      }
      
      await _storeSessionToken(response.data['session_token']);
      return AuthResult.success(response.data['user']);
      
    } catch (e) {
      _logAuthenticationError(username, e);
      throw AuthenticationException('Authentication failed');
    }
  }
  
  Future<bool> verifyMFA(String userId, String mfaCode, String tempToken) async {
    try {
      final response = await _apiClient.post('/auth/mfa-verify', {
        'user_id': userId,
        'mfa_code': mfaCode,
        'temp_token': tempToken,
      });
      
      await _storeSessionToken(response.data['session_token']);
      await _storeUserData(response.data['user']);
      
      return true;
    } catch (e) {
      return false;
    }
  }
  
  Future<bool> enableBiometricAuth() async {
    if (!await _localAuth.canCheckBiometrics) {
      return false;
    }
    
    final availableBiometrics = await _localAuth.getAvailableBiometrics();
    if (availableBiometrics.isEmpty) {
      return false;
    }
    
    final sessionToken = await _storage.read(key: 'session_token');
    if (sessionToken != null) {
      await _storage.write(key: 'biometric_enabled', value: 'true');
      return true;
    }
    
    return false;
  }
  
  Future<bool> authenticateWithBiometric() async {
    try {
      final isBiometricEnabled = await _storage.read(key: 'biometric_enabled');
      if (isBiometricEnabled != 'true') {
        return false;
      }
      
      final isAuthenticated = await _localAuth.authenticate(
        localizedReason: 'Authenticate to access wound care app',
        options: const AuthenticationOptions(
          biometricOnly: true,
          stickyAuth: true,
        ),
      );
      
      if (isAuthenticated) {
        final sessionToken = await _storage.read(key: 'session_token');
        return sessionToken != null && await _validateSessionToken(sessionToken);
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }
}
```

### 1.2 Role-Based Access Control (RBAC)

#### Permission System
```javascript
const PERMISSIONS = {
  PATIENT: {
    CREATE: 'patient:create',
    READ: 'patient:read',
    UPDATE: 'patient:update',
    DELETE: 'patient:delete'
  },
  ASSESSMENT: {
    CREATE: 'assessment:create',
    READ: 'assessment:read',
    UPDATE: 'assessment:update',
    DELETE: 'assessment:delete'
  },
  CARE_PLAN: {
    CREATE: 'care_plan:create',
    READ: 'care_plan:read',
    UPDATE: 'care_plan:update',
    DELETE: 'care_plan:delete'
  },
  THERAPY: {
    EXECUTE: 'therapy:execute',
    MONITOR: 'therapy:monitor',
    MODIFY: 'therapy:modify'
  },
  INVENTORY: {
    MANAGE: 'inventory:manage',
    VIEW: 'inventory:view'
  },
  REPORTS: {
    GENERATE: 'reports:generate',
    VIEW: 'reports:view',
    EXPORT: 'reports:export'
  },
  ADMIN: {
    USER_MANAGEMENT: 'admin:user_management',
    SYSTEM_CONFIG: 'admin:system_config',
    AUDIT_LOGS: 'admin:audit_logs'
  }
};

class AuthorizationService {
  async checkPermission(userId, permission) {
    const userRoles = await this.getUserRoles(userId);
    
    for (const role of userRoles) {
      const rolePermissions = await this.getRolePermissions(role.id);
      if (this.hasPermission(rolePermissions, permission)) {
        return true;
      }
    }
    
    return false;
  }
  
  hasPermission(permissions, requiredPermission) {
    return permissions.some(p => 
      p === requiredPermission || 
      p === 'all:*' || 
      this.matchesWildcard(p, requiredPermission)
    );
  }
  
  async createPermissionMiddleware() {
    return (requiredPermission) => {
      return async (req, res, next) => {
        try {
          const userId = req.user.id;
          const hasPermission = await this.checkPermission(userId, requiredPermission);
          
          if (!hasPermission) {
            return res.status(403).json({
              error: 'Insufficient permissions',
              required: requiredPermission
            });
          }
          
          next();
        } catch (error) {
          res.status(500).json({ error: 'Authorization check failed' });
        }
      };
    };
  }
}
```

#### Flutter Permission Checking
```dart
class PermissionService {
  late List<String> _userPermissions;
  
  Future<void> loadUserPermissions() async {
    final userData = await _storage.read(key: 'user_data');
    if (userData != null) {
      final user = jsonDecode(userData);
      _userPermissions = List<String>.from(user['permissions'] ?? []);
    }
  }
  
  bool hasPermission(String permission) {
    return _userPermissions.contains(permission) || 
           _userPermissions.contains('all:*');
  }
  
  bool canCreatePatient() => hasPermission('patient:create');
  bool canUpdateAssessment() => hasPermission('assessment:update');
  bool canExecuteTherapy() => hasPermission('therapy:execute');
  bool canManageInventory() => hasPermission('inventory:manage');
  bool canViewReports() => hasPermission('reports:view');
  
  Widget buildPermissionGatedWidget({
    required String permission,
    required Widget child,
    Widget? fallback,
  }) {
    if (hasPermission(permission)) {
      return child;
    } else {
      return fallback ?? Container();
    }
  }
}
```

## 2. Data Encryption

### 2.1 Encryption at Rest

#### Database Encryption
```sql
-- PostgreSQL Transparent Data Encryption setup
-- Enable encryption for sensitive columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive patient data
ALTER TABLE patients 
ADD COLUMN id_number_encrypted BYTEA,
ADD COLUMN medical_aid_number_encrypted BYTEA;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id_number_encrypted = pgp_sym_encrypt(NEW.id_number, current_setting('app.encryption_key'));
    NEW.medical_aid_number_encrypted = pgp_sym_encrypt(NEW.medical_aid_number, current_setting('app.encryption_key'));
    
    -- Clear plaintext values
    NEW.id_number = NULL;
    NEW.medical_aid_number = NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic encryption
CREATE TRIGGER encrypt_patient_data
    BEFORE INSERT OR UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION encrypt_sensitive_data();

-- Function to decrypt data for authorized access
CREATE OR REPLACE FUNCTION decrypt_patient_data(patient_id UUID, requester_id UUID)
RETURNS TABLE(
    id_number TEXT,
    medical_aid_number TEXT
) AS $$
BEGIN
    -- Check if requester has permission
    IF NOT EXISTS (
        SELECT 1 FROM user_permissions 
        WHERE user_id = requester_id 
        AND permission = 'patient:read_sensitive'
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to decrypt patient data';
    END IF;
    
    RETURN QUERY
    SELECT 
        pgp_sym_decrypt(p.id_number_encrypted, current_setting('app.encryption_key'))::TEXT,
        pgp_sym_decrypt(p.medical_aid_number_encrypted, current_setting('app.encryption_key'))::TEXT
    FROM patients p
    WHERE p.id = patient_id;
    
    -- Log access
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id)
    VALUES (requester_id, 'decrypt_sensitive_data', 'patient', patient_id);
END;
$$ LANGUAGE plpgsql;
```

#### File System Encryption
```javascript
const crypto = require('crypto');
const fs = require('fs').promises;

class FileEncryptionService {
  constructor(encryptionKey) {
    this.algorithm = 'aes-256-gcm';
    this.key = crypto.scryptSync(encryptionKey, 'salt', 32);
  }
  
  async encryptFile(filePath, data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from(filePath)); // Additional authenticated data
    
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    const encryptedData = Buffer.concat([iv, authTag, encrypted]);
    await fs.writeFile(filePath, encryptedData);
    
    return {
      filePath,
      size: encryptedData.length,
      encrypted: true
    };
  }
  
  async decryptFile(filePath) {
    const encryptedData = await fs.readFile(filePath);
    
    const iv = encryptedData.slice(0, 16);
    const authTag = encryptedData.slice(16, 32);
    const encrypted = encryptedData.slice(32);
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from(filePath));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }
}
```

### 2.2 Encryption in Transit

#### API Security
```javascript
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 auth requests per windowMs
  skipSuccessfulRequests: true,
});

app.use('/api/', apiLimiter);
app.use('/auth/', authLimiter);

// Certificate pinning middleware
app.use((req, res, next) => {
  const expectedFingerprint = process.env.EXPECTED_CERT_FINGERPRINT;
  const actualFingerprint = req.socket.getPeerCertificate()?.fingerprint;
  
  if (req.secure && expectedFingerprint && actualFingerprint !== expectedFingerprint) {
    return res.status(421).json({ error: 'Certificate mismatch' });
  }
  
  next();
});
```

#### Flutter Network Security
```dart
import 'package:dio/dio.dart';
import 'package:dio_certificate_pinning/dio_certificate_pinning.dart';

class SecureApiClient {
  late Dio _dio;
  
  SecureApiClient() {
    _dio = Dio();
    
    // Certificate pinning
    _dio.interceptors.add(
      CertificatePinningInterceptor(
        allowedSHAFingerprints: [
          'YOUR_CERTIFICATE_SHA_FINGERPRINT'
        ],
      ),
    );
    
    // Request/Response interceptors
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Add authentication token
          final token = _authService.getSessionToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          
          // Add request ID for tracking
          options.headers['X-Request-ID'] = _generateRequestId();
          
          handler.next(options);
        },
        onResponse: (response, handler) {
          // Log successful responses
          _logApiResponse(response);
          handler.next(response);
        },
        onError: (error, handler) {
          // Handle authentication errors
          if (error.response?.statusCode == 401) {
            _authService.logout();
            _navigationService.navigateToLogin();
          }
          
          _logApiError(error);
          handler.next(error);
        },
      ),
    );
  }
}
```

## 3. POPIA Compliance

### 3.1 Data Retention and Deletion

```javascript
class POPIAComplianceService {
  async implementRetentionPolicy() {
    const retentionPolicies = await DataRetentionPolicy.findAll({
      where: { is_active: true }
    });
    
    for (const policy of retentionPolicies) {
      await this.enforceRetentionPolicy(policy);
    }
  }
  
  async enforceRetentionPolicy(policy) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retention_period_days);
    
    switch (policy.data_type) {
      case 'patient_records':
        await this.archiveOldPatientRecords(cutoffDate, policy);
        break;
      case 'wound_images':
        await this.deleteOldWoundImages(cutoffDate, policy);
        break;
      case 'audit_logs':
        await this.archiveOldAuditLogs(cutoffDate, policy);
        break;
    }
  }
  
  async deletePatientData(patientId, requesterId, reason) {
    // Verify deletion authority
    const canDelete = await this.verifyDeletionAuthority(requesterId, patientId);
    if (!canDelete) {
      throw new Error('Insufficient authority to delete patient data');
    }
    
    // Log deletion request
    await AuditLog.create({
      user_id: requesterId,
      action: 'data_deletion_requested',
      resource_type: 'patient',
      resource_id: patientId,
      new_values: { reason },
      timestamp: new Date()
    });
    
    // Begin transaction for complete deletion
    const transaction = await sequelize.transaction();
    
    try {
      // Delete related records in order
      await WoundImage.destroy({ where: { patient_id: patientId }, transaction });
      await TherapySession.destroy({ where: { patient_id: patientId }, transaction });
      await CarePlan.destroy({ where: { patient_id: patientId }, transaction });
      await WoundAssessment.destroy({ where: { patient_id: patientId }, transaction });
      await MedicalHistory.destroy({ where: { patient_id: patientId }, transaction });
      await Patient.destroy({ where: { id: patientId }, transaction });
      
      await transaction.commit();
      
      // Log successful deletion
      await AuditLog.create({
        user_id: requesterId,
        action: 'data_deletion_completed',
        resource_type: 'patient',
        resource_id: patientId,
        timestamp: new Date()
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  async generateDataPortabilityReport(patientId, requesterId) {
    // Verify access rights
    const hasAccess = await this.verifyDataAccess(requesterId, patientId);
    if (!hasAccess) {
      throw new Error('Access denied for data portability request');
    }
    
    // Gather all patient data
    const patientData = await this.gatherPatientData(patientId);
    
    // Generate report in structured format
    const report = {
      patient: patientData.patient,
      medical_history: patientData.medicalHistory,
      assessments: patientData.assessments,
      care_plans: patientData.carePlans,
      therapy_sessions: patientData.therapySessions,
      wound_images: patientData.woundImages,
      generated_at: new Date(),
      generated_by: requesterId
    };
    
    // Encrypt report for secure transfer
    const encryptedReport = await this.encryptDataForTransfer(report);
    
    // Log data export
    await AuditLog.create({
      user_id: requesterId,
      action: 'data_export_generated',
      resource_type: 'patient',
      resource_id: patientId,
      timestamp: new Date()
    });
    
    return encryptedReport;
  }
}
```

### 3.2 Consent Management

```javascript
class ConsentManager {
  async recordConsent(patientId, consentType, consentGiven, details) {
    const consentRecord = await PatientConsent.create({
      patient_id: patientId,
      consent_type: consentType,
      consent_given: consentGiven,
      consent_details: details,
      recorded_at: new Date(),
      version: await this.getCurrentConsentVersion(consentType)
    });
    
    // Update patient's overall consent status
    await this.updatePatientConsentStatus(patientId);
    
    return consentRecord;
  }
  
  async checkConsent(patientId, purpose) {
    const consent = await PatientConsent.findOne({
      where: {
        patient_id: patientId,
        consent_type: purpose,
        consent_given: true
      },
      order: [['recorded_at', 'DESC']]
    });
    
    return consent !== null;
  }
  
  async withdrawConsent(patientId, consentType, reason) {
    await PatientConsent.create({
      patient_id: patientId,
      consent_type: consentType,
      consent_given: false,
      withdrawal_reason: reason,
      recorded_at: new Date()
    });
    
    // Handle consequences of withdrawal
    await this.handleConsentWithdrawal(patientId, consentType);
  }
}
```

## 4. Audit Logging

### 4.1 Comprehensive Audit Trail

```javascript
class AuditService {
  async logAction(userId, action, resourceType, resourceId, oldValues, newValues, metadata = {}) {
    try {
      await AuditLog.create({
        user_id: userId,
        action: action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: metadata.ipAddress,
        user_agent: metadata.userAgent,
        session_id: metadata.sessionId,
        timestamp: new Date()
      });
    } catch (error) {
      // Critical: If audit logging fails, the operation should fail
      logger.error('Audit logging failed', { userId, action, error });
      throw new Error('Audit logging failed - operation aborted');
    }
  }
  
  async generateAuditReport(startDate, endDate, filters = {}) {
    const whereClause = {
      timestamp: {
        [Op.between]: [startDate, endDate]
      }
    };
    
    if (filters.userId) whereClause.user_id = filters.userId;
    if (filters.action) whereClause.action = filters.action;
    if (filters.resourceType) whereClause.resource_type = filters.resourceType;
    
    const auditLogs = await AuditLog.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['username', 'first_name', 'last_name']
        }
      ],
      order: [['timestamp', 'DESC']]
    });
    
    return {
      logs: auditLogs,
      summary: await this.generateAuditSummary(auditLogs),
      generated_at: new Date()
    };
  }
}
```

### 4.2 Flutter Security Monitoring

```dart
class SecurityMonitor {
  static void logSecurityEvent(String event, Map<String, dynamic> details) {
    final logEntry = {
      'event': event,
      'details': details,
      'timestamp': DateTime.now().toIso8601String(),
      'device_id': DeviceInfo.deviceId,
      'app_version': AppInfo.version,
    };
    
    // Store locally for offline scenarios
    _secureStorage.write(
      key: 'security_log_${DateTime.now().millisecondsSinceEpoch}',
      value: jsonEncode(logEntry),
    );
    
    // Send to server when online
    _sendSecurityLog(logEntry);
  }
  
  static void detectAnomalousActivity() {
    // Monitor for unusual patterns
    _checkForRapidRequests();
    _checkForUnauthorizedAccess();
    _checkForDataExfiltrationAttempts();
  }
  
  static void _checkForRapidRequests() {
    final now = DateTime.now();
    final recentRequests = _requestTimestamps
        .where((timestamp) => now.difference(timestamp).inMinutes < 5)
        .length;
    
    if (recentRequests > 50) {
      logSecurityEvent('rapid_requests_detected', {
        'request_count': recentRequests,
        'time_window': '5_minutes'
      });
    }
  }
}
```

## 5. Session Management

### 5.1 Secure Session Handling

```javascript
class SessionManager {
  constructor() {
    this.activeSessions = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }
  
  async createSession(userId, deviceInfo) {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + this.sessionTimeout);
    
    const session = {
      id: sessionId,
      userId: userId,
      createdAt: new Date(),
      expiresAt: expiresAt,
      lastActivity: new Date(),
      deviceInfo: deviceInfo,
      isActive: true
    };
    
    // Store in database
    await UserSession.create(session);
    
    // Cache in memory
    this.activeSessions.set(sessionId, session);
    
    // Set cleanup timer
    setTimeout(() => this.cleanupSession(sessionId), this.sessionTimeout);
    
    return {
      sessionId: sessionId,
      token: await this.generateSessionToken(session),
      expiresAt: expiresAt
    };
  }
  
  async validateSession(sessionId, token) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session || !session.isActive) {
      return null;
    }
    
    if (session.expiresAt < new Date()) {
      await this.invalidateSession(sessionId);
      return null;
    }
    
    // Verify token
    const isValidToken = await this.verifySessionToken(token, session);
    if (!isValidToken) {
      return null;
    }
    
    // Update last activity
    session.lastActivity = new Date();
    await UserSession.update(
      { last_activity: session.lastActivity },
      { where: { id: sessionId } }
    );
    
    return session;
  }
  
  async invalidateSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      await UserSession.update(
        { is_active: false },
        { where: { id: sessionId } }
      );
      this.activeSessions.delete(sessionId);
    }
  }
  
  async invalidateAllUserSessions(userId) {
    // Invalidate all sessions for a user
    await UserSession.update(
      { is_active: false },
      { where: { user_id: userId } }
    );
    
    // Remove from memory cache
    for (const [sessionId, session] of this.activeSessions) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
      }
    }
  }
}
```

## 6. Security Testing and Monitoring

### 6.1 Automated Security Tests

```javascript
// Jest security tests
describe('Security Tests', () => {
  test('should reject weak passwords', async () => {
    const weakPasswords = ['123456', 'password', 'qwerty'];
    
    for (const password of weakPasswords) {
      await expect(
        authService.createUser('test@example.com', password)
      ).rejects.toThrow('Password does not meet security requirements');
    }
  });
  
  test('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE patients; --";
    
    await expect(
      patientService.searchPatients(maliciousInput)
    ).not.toThrow();
    
    // Verify patients table still exists
    const patients = await Patient.findAll();
    expect(patients).toBeDefined();
  });
  
  test('should enforce rate limiting', async () => {
    const requests = Array(10).fill().map(() => 
      request(app).post('/auth/login').send({
        username: 'test@example.com',
        password: 'wrongpassword'
      })
    );
    
    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

This comprehensive security implementation ensures that the WHASA wound-care nurse practitioner app meets enterprise-grade security standards while maintaining POPIA compliance and providing a seamless user experience for healthcare professionals.