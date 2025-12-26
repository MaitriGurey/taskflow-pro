import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// Mock crypto.randomUUID for consistent IDs in tests
vi.stubGlobal('crypto', {
  randomUUID: () => Math.random().toString(36).substring(2, 15),
})

