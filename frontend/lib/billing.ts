/**
 * Billing and feature gating utilities.
 */

import { createClient } from '@/lib/supabase/client';
import { api } from './api';

let profileCache: { is_pro: boolean } | null = null;
let profileCacheTime: number = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Get user's Pro status from cache or API.
 */
export async function getUserProStatus(): Promise<boolean> {
  const now = Date.now();
  
  // Return cached value if still valid
  if (profileCache && (now - profileCacheTime) < CACHE_DURATION) {
    return profileCache.is_pro;
  }
  
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return false;
    }
    
    const profile = await api.billing.getProfile();
    profileCache = { is_pro: profile.is_pro };
    profileCacheTime = now;
    
    return profile.is_pro;
  } catch (error) {
    console.error('Error fetching Pro status:', error);
    return false;
  }
}

/**
 * Clear the profile cache (useful after payment success).
 */
export function clearProfileCache() {
  profileCache = null;
  profileCacheTime = 0;
}

/**
 * Check if a feature should be available based on Pro status.
 * Use this in components to conditionally render Pro features.
 */
export async function isProFeatureAvailable(): Promise<boolean> {
  return await getUserProStatus();
}

