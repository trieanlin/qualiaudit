import { describe, expect, it } from 'vitest'
import {
  ACTIVE_REVIEWER_PROTOCOL,
  ACTIVE_REVIEWER_PROTOCOL_ID,
  OPENAI_PROMPT_VERSION,
  OPENAI_SCHEMA_VERSION,
  REVIEWER_PROTOCOL_REGISTRY,
} from './reviewerRegistry'

describe('reviewer protocol registry', () => {
  it('resolves the active prompt and schema from a named immutable registry entry', () => {
    expect(ACTIVE_REVIEWER_PROTOCOL_ID).toBe('blind-review-v0.2')
    expect(REVIEWER_PROTOCOL_REGISTRY[ACTIVE_REVIEWER_PROTOCOL_ID]).toBe(ACTIVE_REVIEWER_PROTOCOL)
    expect(ACTIVE_REVIEWER_PROTOCOL.promptVersion).toBe(OPENAI_PROMPT_VERSION)
    expect(ACTIVE_REVIEWER_PROTOCOL.schemaVersion).toBe(OPENAI_SCHEMA_VERSION)
    expect(ACTIVE_REVIEWER_PROTOCOL.instructions).toContain(
      'The human first-pass codes and rationales are deliberately absent. Do not infer or claim to know them.',
    )
  })
})
