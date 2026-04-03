// src/test/setup.ts - Test setup file
import '@testing-library/jest-dom'

// Mock Supabase
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({ data: [], error: null })),
        })),
        order: vi.fn(() => ({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
          })),
        })),
      })),
    })),
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

// Mock crypto-js
vi.mock('crypto-js', () => ({
  default: {
    AES: {
      encrypt: vi.fn(() => ({
        ciphertext: { toString: vi.fn(() => 'mock-encrypted') },
      })),
      decrypt: vi.fn(() => ({
        toString: vi.fn(() => 'mock-decrypted'),
      })),
    },
    enc: {
      Hex: {
        parse: vi.fn(() => 'mock-hex'),
      },
      Base64: {
        stringify: vi.fn(() => 'mock-base64'),
        parse: vi.fn(() => ({ words: [], sigBytes: 0 })),
      },
      Utf8: {
        stringify: vi.fn(() => 'mock-utf8'),
      },
    },
    PBKDF2: vi.fn(() => ({
      toString: vi.fn(() => 'mock-derived-key'),
    })),
    lib: {
      WordArray: {
        random: vi.fn(() => ({
          words: [],
          sigBytes: 16,
        })),
        create: vi.fn(() => ({
          words: [],
          sigBytes: 0,
        })),
      },
    },
    mode: {
      CBC: {},
    },
    pad: {
      Pkcs7: {},
    },
    HmacSHA1: vi.fn(() => ({
      toString: vi.fn(() => 'mock-hmac'),
    })),
  },
}))
