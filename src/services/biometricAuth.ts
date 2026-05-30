/**
 * WealthOS — Biometric Authentication Service
 * 
 * Wraps expo-local-authentication for Face ID / Fingerprint unlock.
 * Runs strictly on-device using the system's secure enclave hardware.
 * Cost: ₹0.00 — No servers, no external APIs.
 */

import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricResult {
  success: boolean;
  biometricType: 'faceid' | 'fingerprint' | 'none';
  error?: string;
}

/**
 * Check if the device supports biometric authentication
 */
export const checkBiometricSupport = async (): Promise<{
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return { hasHardware, isEnrolled, supportedTypes };
  } catch (error) {
    console.warn('Biometric support check failed:', error);
    return { hasHardware: false, isEnrolled: false, supportedTypes: [] };
  }
};

/**
 * Get a friendly name for the biometric type available
 */
export const getBiometricTypeName = (
  types: LocalAuthentication.AuthenticationType[]
): 'faceid' | 'fingerprint' | 'none' => {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'faceid';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  return 'none';
};

/**
 * Authenticate the user using biometrics.
 * 
 * - If no biometric hardware → returns success (bypass)
 * - If hardware exists but user hasn't enrolled → returns success (bypass)
 * - If enrolled → prompts biometric authentication
 * 
 * @returns BiometricResult with success flag and biometric type used
 */
export const authenticateUser = async (): Promise<BiometricResult> => {
  try {
    // 1. Check hardware availability
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return { success: true, biometricType: 'none' };
    }

    // 2. Check if user has enrolled biometrics
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return { success: true, biometricType: 'none' };
    }

    // 3. Get biometric type for context
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const biometricType = getBiometricTypeName(supportedTypes);

    // 4. Trigger the biometric prompt
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock WealthOS',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });

    return {
      success: result.success,
      biometricType,
      error: result.success ? undefined : 'Authentication failed or cancelled',
    };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      biometricType: 'none',
      error: error instanceof Error ? error.message : 'Unknown authentication error',
    };
  }
};

export default authenticateUser;
