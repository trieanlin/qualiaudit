import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { buildBlindReviewPayload, runMockBlindReview } from '../lib/reviewer'
import { Audit } from './Audit'

describe('printable audit report controls', () => {
  it('defaults to a privacy-minimised report and requires an explicit choice for source text', () => {
    const reviews = runMockBlindReview(buildBlindReviewPayload(
      SAMPLE_PROJECT,
      SAMPLE_CODEBOOK,
      SAMPLE_EXCERPTS,
    ))
    render(
      <Audit
        project={SAMPLE_PROJECT}
        codebook={SAMPLE_CODEBOOK}
        excerpts={SAMPLE_EXCERPTS}
        frozen={{
          frozenAt: '2026-07-22T09:30:00.000Z',
          project: SAMPLE_PROJECT,
          codebook: SAMPLE_CODEBOOK,
          humanCoding: SAMPLE_EXCERPTS,
        }}
        reviews={reviews}
        resolutions={[]}
        reflexiveMemos={[]}
        codebookChanges={[]}
        onBack={vi.fn()}
        onOpenCase={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'HTML report' }))

    const omitSource = screen.getByRole('radio', { name: 'Omit excerpt and evidence text' }) as HTMLInputElement
    const includeSource = screen.getByRole('radio', { name: 'Include full source text' }) as HTMLInputElement

    expect(omitSource.checked).toBe(true)
    expect(includeSource.checked).toBe(false)
    expect(screen.getByText('Privacy-minimised copy · source quotes omitted')).toBeTruthy()

    fireEvent.click(includeSource)

    expect(includeSource.checked).toBe(true)
    expect(screen.getByText('Full analytic record · contains quoted source data')).toBeTruthy()
  })
})
