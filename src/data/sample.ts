import type { CodeDefinition, HumanCodedExcerpt, ProjectBrief } from '../types'

export const SAMPLE_PROJECT: ProjectBrief = {
  id: 'synthetic-home-sleep-review',
  name: 'Staying with home sleep monitoring',
  researchQuestion: 'How do older adults describe what helps or hinders sustained engagement with home sleep monitoring?',
  analysisMode: 'codebook',
  aiRole: 'Offer an independent, evidence-linked reading that helps the researcher examine coding decisions; never determine the final code.',
  createdAt: '2026-07-22T09:00:00.000Z',
}

export const SAMPLE_CODEBOOK: CodeDefinition[] = [
  {
    code: 'ROUTINE_FIT',
    definition: 'How monitoring fits, or fails to fit, into everyday routines and spaces.',
    include_when: 'The excerpt links continued use to habits, timing, location, or practical routines.',
    exclude_when: 'The main issue is a device fault or difficulty interpreting results.',
    example: 'Keeping the charger beside an everyday object made setup easier to remember.',
  },
  {
    code: 'FAMILY_FEEDBACK',
    definition: 'How feedback, encouragement, or involvement from family shapes engagement.',
    include_when: 'A family member discusses results, encourages use, or participates in monitoring.',
    exclude_when: 'The emphasis is unwanted observation, surveillance, or control.',
    example: 'A relative checking the weekly summary made progress feel visible.',
  },
  {
    code: 'TECHNICAL_FRICTION',
    definition: 'Device or setup problems that interrupt use or create extra effort.',
    include_when: 'Charging, connectivity, sensors, indicators, or failures obstruct use.',
    exclude_when: 'The device works but does not fit the participant’s routine.',
    example: 'An unfamiliar warning light made the participant unsure whether data was recorded.',
  },
  {
    code: 'PRIVACY_BOUNDARY',
    definition: 'Negotiation of who can see, discuss, or influence personal monitoring data.',
    include_when: 'The participant describes feeling watched, exposed, controlled, or selective about sharing.',
    exclude_when: 'Family involvement is welcomed and privacy is not salient.',
    example: 'The participant paused monitoring when visitors stayed over.',
  },
  {
    code: 'PERCEIVED_VALUE',
    definition: 'Whether the monitoring feels meaningful, useful, or worth continuing.',
    include_when: 'The participant evaluates benefit, relevance, learning, or actionable value.',
    exclude_when: 'The excerpt only reports a technical problem with no evaluation of usefulness.',
    example: 'The chart became useful once a clinician explained how it related to daytime fatigue.',
  },
]

export const SAMPLE_EXCERPTS: HumanCodedExcerpt[] = [
  {
    excerpt_id: 'SYN-001',
    source_id: 'fictional-interview-01',
    excerpt: 'I left the charger beside the kettle. Then it became part of making tea before bed, rather than another health task to remember.',
    context: 'The fictional participant is discussing what helped them continue after the first week.',
    human_code: 'ROUTINE_FIT',
    human_rationale: 'The account connects continued use to embedding charging in an existing evening routine.',
    human_confidence: 'high',
    second_coder_code: 'ROUTINE_FIT',
    second_coder_rationale: 'The kettle acts as a cue within an established habit.',
  },
  {
    excerpt_id: 'SYN-002',
    source_id: 'fictional-interview-02',
    excerpt: 'My daughter liked looking at the weekly score with me, but if she asked twice in one day I started to feel as though I was being checked up on.',
    context: 'The fictional participant had chosen to share the app summary with one family member.',
    human_code: 'FAMILY_FEEDBACK',
    human_rationale: 'Family involvement is both supportive and uncomfortable, with the human coder foregrounding the shared review.',
    human_confidence: 'medium',
    second_coder_code: 'PRIVACY_BOUNDARY',
    second_coder_rationale: 'Feeling checked up on makes control and observation central.',
  },
  {
    excerpt_id: 'SYN-003',
    source_id: 'fictional-interview-03',
    excerpt: 'The red light came on after I moved the sensor. I could not tell whether it was still recording, so I left it in the drawer for three nights.',
    human_code: 'TECHNICAL_FRICTION',
    human_rationale: 'An unclear device indicator directly interrupts monitoring.',
    human_confidence: 'high',
  },
  {
    excerpt_id: 'SYN-004',
    source_id: 'fictional-interview-04',
    excerpt: 'At first the numbers were just numbers. When the nurse explained the pattern beside my tired afternoons, I could see why another month might be useful.',
    context: 'This is a fictional account of a follow-up appointment.',
    human_code: 'PERCEIVED_VALUE',
    human_rationale: 'Clinical interpretation changes the participant’s view of the monitor’s value.',
    human_confidence: 'high',
  },
  {
    excerpt_id: 'SYN-005',
    source_id: 'fictional-interview-05',
    excerpt: 'When my sister stayed in the guest room, I stopped wearing it. I did not want the questions at breakfast, even though the monitor itself was easy enough.',
    human_code: 'ROUTINE_FIT',
    human_rationale: 'A change in the home routine coincides with pausing use.',
    human_confidence: 'medium',
  },
  {
    excerpt_id: 'SYN-006',
    source_id: 'fictional-open-response-12',
    excerpt: 'I am not sure what it means yet.',
    context: 'No preceding response was included in the exported row.',
    human_code: 'PERCEIVED_VALUE',
    human_rationale: 'Tentatively treated as uncertainty about the usefulness of results.',
    human_confidence: 'low',
  },
  {
    excerpt_id: 'SYN-007',
    source_id: 'fictional-interview-06',
    excerpt: 'My wife kept asking whether I had worn it, which was reassuring on busy days and irritating on the others. It helped, but it also felt like being watched.',
    human_code: 'FAMILY_FEEDBACK',
    human_rationale: 'The coder foregrounded practical encouragement from a spouse.',
    human_confidence: 'medium',
    second_coder_code: 'PRIVACY_BOUNDARY',
    second_coder_rationale: 'The explicit language of being watched raises a privacy interpretation.',
  },
  {
    excerpt_id: 'SYN-008',
    source_id: 'fictional-interview-07',
    excerpt: 'That changed the week after the battery failed.',
    context: 'The export does not include the preceding turn that explains what “that” refers to.',
    human_code: 'TECHNICAL_FRICTION',
    human_rationale: 'Battery failure is the only explicit substantive cue.',
    human_confidence: 'low',
  },
]

export const SAMPLE_NOTICE = 'Fictional demonstration data — no real participant information.'
