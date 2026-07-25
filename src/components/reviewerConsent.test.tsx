import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SAMPLE_CODEBOOK, SAMPLE_EXCERPTS, SAMPLE_PROJECT } from '../data/sample'
import { REVIEWER_CONSENT_VERSION } from '../lib/reviewerProtocol'
import { FreezeReview } from './FreezeReview'

afterEach(() => {
  vi.unstubAllGlobals()
})
function configResponse(configured: boolean) {
  return new Response(JSON.stringify({
    provider: 'OpenAI API',
    configured,
    model: configured ? 'configured-review-model' : null,
    region: 'Not specified by this deployment',
    retention: 'store=false; default abuse-monitoring logs may retain content for up to 30 days',
    responsesStored: false,
    consentVersion: REVIEWER_CONSENT_VERSION,
    promptVersion: 'blind-review-v0.2',
    schemaVersion: 'blind-review-schema-v0.2',
    requestTimeoutMs: 45_000,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('reviewer transmission consent', () => {
  it('keeps the no-transmission local reviewer as the usable default', () => {
    render(
      <FreezeReview
        project={SAMPLE_PROJECT}
        codebook={SAMPLE_CODEBOOK}
        excerpts={SAMPLE_EXCERPTS}
        onBack={vi.fn()}
        onFreeze={vi.fn()}
      />,
    )

    expect(screen.getByRole('radio', { name: /Local deterministic reviewer/ })).toBeChecked()
    expect(screen.getByRole('button', { name: /Freeze & run local blind review/ })).toBeEnabled()
    expect(screen.getByText(/No third-party transmission/)).toBeInTheDocument()
  })

  it('does not allow a remote review when the deployment is not configured', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => configResponse(false)))
    const user = userEvent.setup()
    render(
      <FreezeReview
        project={SAMPLE_PROJECT}
        codebook={SAMPLE_CODEBOOK}
        excerpts={SAMPLE_EXCERPTS}
        onBack={vi.fn()}
        onFreeze={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('radio', { name: /OpenAI reviewer/ }))

    expect(await screen.findByText(/Real review is not configured/)).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: /Freeze & send blind payload/ })).toBeDisabled()
  })

  it('requires explicit consent before enabling a configured remote review', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => configResponse(true)))
    const user = userEvent.setup()
    const onFreeze = vi.fn()
    render(
      <FreezeReview
        project={SAMPLE_PROJECT}
        codebook={SAMPLE_CODEBOOK}
        excerpts={SAMPLE_EXCERPTS}
        onBack={vi.fn()}
        onFreeze={onFreeze}
      />,
    )

    await user.click(screen.getByRole('radio', { name: /OpenAI reviewer/ }))
    await waitFor(() => expect(screen.getByText('configured-review-model')).toBeInTheDocument())
    const sendButton = screen.getByRole('button', { name: /Freeze & send blind payload/ })
    expect(sendButton).toBeDisabled()

    await user.click(screen.getByRole('checkbox'))
    expect(sendButton).toBeEnabled()
    await user.click(sendButton)

    expect(onFreeze).toHaveBeenCalledWith('openai')
  })
})
