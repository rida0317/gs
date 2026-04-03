// src/utils/rateLimiter.ts
// 🔒 SECURITY: Rate limiting to prevent brute force attacks

const RATE_LIMIT_KEY = 'rate_limit_attempts'
const MAX_ATTEMPTS = 100 // Maximum attempts before lockout (disabled for testing)
const LOCKOUT_DURATION = 1 * 60 * 1000 // 1 minute in milliseconds (reduced for testing)

export interface RateLimitInfo {
  attempts: number
  firstAttempt: number
  lockedUntil?: number
  isLocked: boolean
  remainingAttempts: number
  retryAfter?: number
}

/**
 * 🔒 Get rate limit info for a specific key (email/IP)
 */
export function getRateLimitInfo(key: string): RateLimitInfo {
  const storageKey = `${RATE_LIMIT_KEY}_${key}`
  const data = localStorage.getItem(storageKey)
  
  if (!data) {
    return {
      attempts: 0,
      firstAttempt: 0,
      isLocked: false,
      remainingAttempts: MAX_ATTEMPTS
    }
  }
  
  try {
    const parsed = JSON.parse(data) as RateLimitInfo
    
    // Check if lockout has expired
    if (parsed.lockedUntil && Date.now() >= parsed.lockedUntil) {
      // Lockout expired, reset
      clearRateLimit(key)
      return {
        attempts: 0,
        firstAttempt: 0,
        isLocked: false,
        remainingAttempts: MAX_ATTEMPTS
      }
    }
    
    // Calculate retry after time
    const retryAfter = parsed.lockedUntil 
      ? Math.ceil((parsed.lockedUntil - Date.now()) / 1000)
      : undefined
    
    return {
      ...parsed,
      retryAfter
    }
  } catch {
    return {
      attempts: 0,
      firstAttempt: 0,
      isLocked: false,
      remainingAttempts: MAX_ATTEMPTS
    }
  }
}

/**
 * 🔒 Record a failed attempt
 * Returns true if the user should be locked out
 */
export function recordFailedAttempt(key: string): { locked: boolean; info: RateLimitInfo } {
  const storageKey = `${RATE_LIMIT_KEY}_${key}`
  const currentInfo = getRateLimitInfo(key)
  
  const now = Date.now()
  const newAttempts = currentInfo.attempts + 1
  
  let newInfo: RateLimitInfo
  
  if (newAttempts >= MAX_ATTEMPTS) {
    // Lock out the user
    newInfo = {
      attempts: newAttempts,
      firstAttempt: currentInfo.firstAttempt || now,
      lockedUntil: now + LOCKOUT_DURATION,
      isLocked: true,
      remainingAttempts: 0,
      retryAfter: LOCKOUT_DURATION / 1000
    }
  } else {
    // Just record the attempt
    newInfo = {
      attempts: newAttempts,
      firstAttempt: currentInfo.firstAttempt || now,
      isLocked: false,
      remainingAttempts: MAX_ATTEMPTS - newAttempts
    }
  }
  
  // Save to localStorage (encrypted would be better, but this is simple)
  localStorage.setItem(storageKey, JSON.stringify(newInfo))
  
  return {
    locked: newInfo.isLocked,
    info: newInfo
  }
}

/**
 * 🔒 Record a successful login (reset the counter)
 */
export function recordSuccessfulLogin(key: string): void {
  const storageKey = `${RATE_LIMIT_KEY}_${key}`
  localStorage.removeItem(storageKey)
}

/**
 * 🔒 Clear rate limit data for a specific key
 */
export function clearRateLimit(key: string): void {
  const storageKey = `${RATE_LIMIT_KEY}_${key}`
  localStorage.removeItem(storageKey)
}

/**
 * 🔒 Check if an action is allowed
 * Returns true if the action can proceed
 */
export function isActionAllowed(key: string): { allowed: boolean; info: RateLimitInfo } {
  const info = getRateLimitInfo(key)
  
  if (info.isLocked) {
    return {
      allowed: false,
      info
    }
  }
  
  return {
    allowed: true,
    info
  }
}

/**
 * 🔒 Get formatted error message for rate limit
 */
export function getRateLimitErrorMessage(info: RateLimitInfo): string {
  if (!info.isLocked) {
    if (info.remainingAttempts === 0) {
      return '⚠️ Account locked. Please try again later.'
    } else if (info.remainingAttempts <= 2) {
      return `⚠️ Warning: ${info.remainingAttempts} attempt(s) remaining before lockout.`
    }
    return ''
  }
  
  const minutes = Math.ceil((info.retryAfter || 0) / 60)
  return `🔒 Account locked due to too many failed attempts. Please try again in ${minutes} minute(s).`
}

/**
 * 🔒 Clean up old rate limit entries (older than 24 hours)
 * Call this periodically to prevent localStorage bloat
 */
export function cleanupOldRateLimits(): void {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(RATE_LIMIT_KEY)) {
      try {
        const data = localStorage.getItem(key)
        if (data) {
          const parsed = JSON.parse(data) as RateLimitInfo
          
          // Remove if older than 24 hours and not locked
          if (!parsed.isLocked && now - parsed.firstAttempt > maxAge) {
            localStorage.removeItem(key)
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
}

// Run cleanup on module load (once per session)
if (typeof window !== 'undefined') {
  cleanupOldRateLimits()
}

/**
 * 🔒 Decorator/wrapper for rate-limited actions
 * Usage: withRateLimit('login_' + email, () => login(email, password))
 */
export async function withRateLimit<T>(
  key: string,
  action: () => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string; info: RateLimitInfo }> {
  // Check if action is allowed
  const { allowed, info } = isActionAllowed(key)
  
  if (!allowed) {
    return {
      success: false,
      error: getRateLimitErrorMessage(info),
      info
    }
  }
  
  try {
    // Execute the action
    const result = await action()
    
    // Success - reset the counter
    recordSuccessfulLogin(key)
    
    return {
      success: true,
      result,
      info: getRateLimitInfo(key)
    }
  } catch (error: any) {
    // Failed - record the attempt
    const { locked, info: newInfo } = recordFailedAttempt(key)
    
    return {
      success: false,
      error: error?.message || 'Action failed',
      info: newInfo
    }
  }
}
