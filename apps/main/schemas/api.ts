/**
 * ============ MOCK DATA HELPERS ============
 * For FE-first development before backend exists
 */

/**
 * Mock delay helper - simulates API latency
 */
export const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mock error helper - for testing error states
 */
export class MockApiError extends Error {
  constructor(
    message: string,
    public code: string = "MOCK_ERROR",
    public status: number = 500
  ) {
    super(message)
    this.name = "MockApiError"
  }
}

/**
 * Generates a mock ID (similar to DynamoDB UUID)
 */
export const mockId = (prefix: string = "id") =>
  `${prefix}#${Date.now()}${Math.random().toString(36).slice(2, 11)}`
