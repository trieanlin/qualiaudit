import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { Materials } from './Materials'
import { Setup } from './Setup'

describe('frozen record safeguards', () => {
  it('makes the project framing read-only after the review snapshot is frozen', () => {
    render(<Setup project={SAMPLE_PROJECT} locked onContinue={vi.fn()} />)

    expect(screen.getByText('Frozen record')).toBeInTheDocument()
    expect(screen.getByLabelText('Project name')).toBeDisabled()
    expect(screen.getByRole('button', { name: /Reflexive Thematic Analysis/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Return to review queue/ })).toBeEnabled()
  })

  it('prevents a CSV or Excel import from replacing frozen review materials', () => {
    render(
      <Materials
        codebook={SAMPLE_CODEBOOK}
        excerpts={SAMPLE_EXCERPTS}
        locked
        onChangeCodebook={vi.fn()}
        onChangeExcerpts={vi.fn()}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByText(/exact snapshot used for the independent review/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import CSV / Excel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Return to review queue/ })).toBeEnabled()
  })
})
