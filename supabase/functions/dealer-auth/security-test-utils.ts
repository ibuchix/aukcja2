/**
 * Security testing utilities for validating secure password handling
 * This module helps ensure no sensitive data leaks into logs
 */

import { validateAuthLogSecurity } from "./security-validator.ts";
import { logInfo, logWarning, logError } from "./logging.ts";

/**
 * Test suite for secure password handling
 */
export class SecurityTestSuite {
  private static testResults: Array<{ test: string; passed: boolean; details?: string }> = [];

  /**
   * Run all security tests
   */
  static runAllTests(): boolean {
    this.testResults = [];
    
    // Test 1: Ensure password data is properly redacted
    this.testPasswordRedaction();
    
    // Test 2: Ensure character codes are filtered
    this.testCharacterCodeFiltering();
    
    // Test 3: Ensure length information is filtered
    this.testLengthFiltering();
    
    // Test 4: Ensure API keys are redacted
    this.testApiKeyRedaction();
    
    // Test 5: Test circular reference handling
    this.testCircularReferences();
    
    // Report results
    this.reportResults();
    
    return this.testResults.every(result => result.passed);
  }

  /**
   * Test that passwords are properly redacted
   */
  private static testPasswordRedaction(): void {
    const testData = {
      email: "test@example.com",
      password: "secretpassword123",
      normalizedPassword: "normalized_secret",
      pwd: "anothersecret"
    };

    const isSecure = validateAuthLogSecurity(testData);
    
    if (isSecure) {
      this.testResults.push({
        test: "Password Redaction",
        passed: true
      });
    } else {
      this.testResults.push({
        test: "Password Redaction",
        passed: false,
        details: "Password data not properly redacted"
      });
    }
  }

  /**
   * Test that character codes are filtered
   */
  private static testCharacterCodeFiltering(): void {
    const testData = {
      email: "test@example.com",
      firstCharCode: 65,
      lastCharCode: 90,
      charCodeAt: 72
    };

    const isSecure = validateAuthLogSecurity(testData);
    
    if (isSecure) {
      this.testResults.push({
        test: "Character Code Filtering",
        passed: true
      });
    } else {
      this.testResults.push({
        test: "Character Code Filtering",
        passed: false,
        details: "Character codes not properly filtered"
      });
    }
  }

  /**
   * Test that length information is filtered
   */
  private static testLengthFiltering(): void {
    const testData = {
      email: "test@example.com",
      passwordLength: 12,
      originalLength: 15,
      normalizedLength: 14
    };

    const isSecure = validateAuthLogSecurity(testData);
    
    if (isSecure) {
      this.testResults.push({
        test: "Length Information Filtering",
        passed: true
      });
    } else {
      this.testResults.push({
        test: "Length Information Filtering",
        passed: false,
        details: "Length information not properly filtered"
      });
    }
  }

  /**
   * Test that API keys are redacted
   */
  private static testApiKeyRedaction(): void {
    const testData = {
      email: "test@example.com",
      apiKey: "sk_test_12345",
      api_key: "secret_key_67890",
      accessToken: "bearer_token_abcdef"
    };

    const isSecure = validateAuthLogSecurity(testData);
    
    if (isSecure) {
      this.testResults.push({
        test: "API Key Redaction",
        passed: true
      });
    } else {
      this.testResults.push({
        test: "API Key Redaction",
        passed: false,
        details: "API keys not properly redacted"
      });
    }
  }

  /**
   * Test circular reference handling
   */
  private static testCircularReferences(): void {
    const obj: any = { email: "test@example.com" };
    obj.circular = obj; // Create circular reference

    try {
      const isSecure = validateAuthLogSecurity(obj);
      this.testResults.push({
        test: "Circular Reference Handling",
        passed: true
      });
    } catch (error) {
      this.testResults.push({
        test: "Circular Reference Handling",
        passed: false,
        details: `Error handling circular references: ${error.message}`
      });
    }
  }

  /**
   * Report test results
   */
  private static reportResults(): void {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    logInfo("Security test results", {
      totalTests,
      passedTests,
      failedTests,
      allPassed: failedTests === 0
    });

    if (failedTests > 0) {
      const failures = this.testResults.filter(r => !r.passed);
      logError("Security test failures detected", failures);
    }
  }

  /**
   * Get latest test results
   */
  static getTestResults(): Array<{ test: string; passed: boolean; details?: string }> {
    return [...this.testResults];
  }
}

/**
 * Quick validation function for production use
 */
export function validateSecureLogging(): boolean {
  try {
    return SecurityTestSuite.runAllTests();
  } catch (error) {
    logError("Error running security validation", error);
    return false;
  }
}

/**
 * Log security compliance status
 */
export function logSecurityCompliance(): void {
  const isCompliant = validateSecureLogging();
  
  if (isCompliant) {
    logInfo("Security compliance check passed - no sensitive data in logs", {
      timestamp: new Date().toISOString(),
      status: "COMPLIANT"
    });
  } else {
    logWarning("Security compliance check failed - potential sensitive data exposure", {
      timestamp: new Date().toISOString(),
      status: "NON_COMPLIANT",
      action: "Review logging configuration"
    });
  }
}