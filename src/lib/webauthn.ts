import { supabase } from '@/integrations/supabase/client';

/**
 * Utility functions for WebAuthn (biometric authentication)
 * Supports fingerprint, face recognition, and other biometric methods
 */

// Convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Check if we're running in an iframe (like Lovable preview)
 */
function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

/**
 * Check if WebAuthn is supported in the current browser
 */
export function isWebAuthnSupported(): boolean {
  // WebAuthn no funciona en iframes por políticas de seguridad
  if (isInIframe()) {
    return false;
  }
  
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
}

/**
 * Register biometric credentials for a user
 */
export async function registerBiometric(userId: string): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn no es soportado en este navegador');
  }

  try {
    // Create credential options
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Dovita Core',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: userId,
        displayName: 'Usuario',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    };

    // Request credential creation
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error('No se pudo crear la credencial');
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    // Store credential in database
    const { error } = await supabase.from('user_biometric_credentials').insert({
      user_id: userId,
      credential_id: credential.id,
      public_key: arrayBufferToBase64(response.getPublicKey()!),
      device_name: navigator.userAgent.includes('Mac') ? 'MacBook' : 
                   navigator.userAgent.includes('iPhone') ? 'iPhone' :
                   navigator.userAgent.includes('Android') ? 'Android' : 'Dispositivo',
    });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error registering biometric:', error);
    throw error;
  }
}

/**
 * Check if user has biometric credentials enabled
 */
export async function hasBiometricEnabled(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_biometric_credentials')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking biometric status:', error);
    return false;
  }
}

/**
 * Authenticate user with biometric
 */
export async function authenticateWithBiometric(): Promise<{ success: boolean; userId?: string }> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn no es soportado en este navegador');
  }

  try {
    // Get all registered credentials
    const { data: credentials, error: fetchError } = await supabase
      .from('user_biometric_credentials')
      .select('credential_id, user_id');

    if (fetchError) throw fetchError;
    if (!credentials || credentials.length === 0) {
      throw new Error('No hay credenciales registradas');
    }

    // Create authentication options
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: credentials.map((cred) => ({
        id: base64ToArrayBuffer(cred.credential_id),
        type: 'public-key',
      })),
      timeout: 60000,
      userVerification: 'required',
    };

    // Request authentication
    const credential = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Autenticación cancelada');
    }

    // Find user by credential ID
    const matchedCredential = credentials.find((c) => c.credential_id === credential.id);
    if (!matchedCredential) {
      throw new Error('Credencial no encontrada');
    }

    // Update last_used_at
    await supabase
      .from('user_biometric_credentials')
      .update({ last_used_at: new Date().toISOString() })
      .eq('credential_id', credential.id);

    return {
      success: true,
      userId: matchedCredential.user_id,
    };
  } catch (error) {
    console.error('Error authenticating with biometric:', error);
    return { success: false };
  }
}

/**
 * Disable biometric authentication for a user
 */
export async function disableBiometric(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_biometric_credentials')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error disabling biometric:', error);
    throw error;
  }
}
