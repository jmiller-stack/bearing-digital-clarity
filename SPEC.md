# Clarity Prototype: AI Clinical Note Generator
## Build Spec for RayRay — TONIGHT BUILD
### Deploy to: therapyai.bearingdigital.com (or new subdomain)

---

## What We're Building

A single-purpose prototype that proves the core value proposition: a therapist finishes a session, spends 2-3 minutes on a quick-entry form, and gets a complete, professionally formatted SOAP/DAP/BIRP note ready to paste into SimplePractice.

**No in-session recording. No client audio. No consent issues.** The therapist tells Clarity what happened. Clarity writes the note.

The demo tagline: *"Your session is over. Your note is done."*

---

## Scope — What to Build

### Feature 1: Structured Quick-Entry Form → AI Note Generation

This is the ONLY feature for tonight. One page. One flow. It must work end-to-end.

```
FLOW:
1. Therapist selects or enters basic session info
2. Therapist fills out a structured quick-entry form (2-3 minutes)
3. Therapist clicks "Generate Note"
4. AI produces a complete clinical note in their chosen format
5. Therapist reviews, edits sections inline if needed
6. Therapist clicks "Copy to Clipboard" → pastes into SimplePractice
```

### What NOT to Build Tonight

- User authentication / login
- Database persistence (localStorage is fine for demo)
- Client roster / management
- Treatment plan generation
- BPS assessment generation
- Audio recording / transcription
- Billing / Stripe
- PDF export
- Mobile responsive (desktop-only is fine)

---

## Page Structure

### Single Page Application — Three States

**State 1: Session Input Form**
**State 2: Generating (loading)**
**State 3: Generated Note (viewer/editor)**

---

## State 1: Session Input Form

### Section A: Session Metadata (top of form)

```
Client Name or Initials:    [text input — free text, used in note]
Session Number:              [number input — e.g., 5]
Session Date:                [date picker — defaults to today]
Duration:                    [dropdown: 30 / 45 / 50 / 60 / 90 min — default 50]
Session Type:                [dropdown: Individual / Couple / Family / Group]
Note Format:                 [radio buttons: SOAP / DAP / BIRP — default SOAP]
```

### Section B: Treatment Context (helps AI connect to clinical picture)

```
Primary Diagnosis:           [text input with common suggestions dropdown]
                             Suggestions: Major Depressive Disorder, Generalized 
                             Anxiety Disorder, PTSD, Panic Disorder, Adjustment 
                             Disorder, Social Anxiety, OCD, Bipolar, ADHD, 
                             Substance Use Disorder, Relationship Issues, Grief
                             (free text allowed for anything not in list)

Treatment Modality:          [dropdown: CBT / DBT / EMDR / Psychodynamic / 
                             ACT / MI / Solution-Focused / Person-Centered / 
                             Integrative / Other]

Current Treatment Goals:     [textarea — 1-3 sentences, optional]
                             Placeholder: "e.g., Reduce panic attacks from 5/week 
                             to 1/week. Improve sleep onset to under 30 minutes."
                             Helper text: "If provided, the note will reference 
                             progress toward these goals."
```

### Section C: Session Content (the core input — this is what the AI uses)

```
What did the client report?
[textarea — 2-4 sentences]
Placeholder: "What did the client say about their week, symptoms, homework, 
or concerns? Include any specific quotes if relevant."
Helper text: "This becomes the Subjective section of your SOAP note."

What interventions did you use?
[checkbox grid — select all that apply]
□ Cognitive restructuring       □ Behavioral activation
□ Exposure (in vivo)            □ Exposure (imaginal)
□ Relaxation / breathing        □ Mindfulness exercise
□ Psychoeducation               □ Thought records
□ Role play / rehearsal         □ Motivational interviewing
□ EMDR processing               □ Somatic techniques
□ Grief processing              □ Safety planning
□ Family/couples communication  □ Values clarification
□ Skills training (DBT)         □ Journaling assignment
□ Other: [text input]

Brief description of interventions used:
[textarea — 1-3 sentences]
Placeholder: "What specifically did you do? e.g., 'Reviewed thought log 
from last week. Client identified 3 cognitive distortions. Practiced 
reframing in session with Socratic questioning.'"

What did you observe about the client?
[structured mini-form]
Affect:        [dropdown: Depressed / Anxious / Flat / Constricted / 
               Euthymic / Bright / Labile / Irritable / Tearful]
Engagement:    [dropdown: Fully engaged / Mostly engaged / 
               Partially engaged / Minimally engaged / Resistant]
Eye Contact:   [dropdown: Consistent / Intermittent / Avoidant / N/A-Telehealth]
Appearance:    [dropdown: Well-groomed / Casually dressed / Disheveled / 
               Unremarkable / N/A-Telehealth]
Speech:        [dropdown: Normal rate & volume / Pressured / Slow / 
               Soft / Monotone / Unremarkable]
Thought Process: [dropdown: Logical & goal-directed / Tangential / 
                 Circumstantial / Racing / Perseverative / Unremarkable]

Additional observations: [textarea — optional, 1 sentence]
Placeholder: "Anything else notable? e.g., 'Client became tearful when 
discussing mother's illness.'"

How did the client respond to today's session?
[textarea — 1-2 sentences]
Placeholder: "How did the client respond to the interventions? Any 
breakthroughs, resistance, or notable moments?"

Progress toward treatment goals:
[radio buttons]
○ Significant progress
○ Some progress
○ No notable change
○ Regression
○ Too early to assess

Risk Assessment:
[radio buttons]
○ No risk indicators
○ Low risk — no imminent concern
○ Moderate risk — discussed safety plan
○ High risk — safety plan activated / crisis protocol

If moderate or high risk, briefly describe:
[textarea — conditional, only shows if moderate/high selected]
```

### Section D: Plan for Next Session

```
Plan for next session:
[textarea — 1-2 sentences]
Placeholder: "What will you focus on next time? e.g., 'Begin exposure 
hierarchy for social anxiety. Review thought log homework.'"

Homework assigned:
[textarea — optional, 1 sentence]
Placeholder: "e.g., 'Complete thought log daily. Practice 4-7-8 
breathing twice per day. Read chapter 3 of workbook.'"

Next appointment:
[text input — optional]
Placeholder: "e.g., 'Next Tuesday at 2pm' or 'Weekly'"
```

### Section E: Generate Button

```
[ Generate Clinical Note ]    (large, prominent button)

Below button: "Note format: SOAP · Estimated generation time: 15-20 seconds"
(updates dynamically based on format selection)
```

---

## State 2: Generating (Loading)

Simple loading state while the API call processes.

```
Generating your [SOAP/DAP/BIRP] note...

[animated progress indicator]

"Clarity is drafting your note based on your session input.
 This typically takes 15-20 seconds."
```

---

## State 3: Generated Note (Viewer/Editor)

### Header
```
[DRAFT — For Clinician Review]
SOAP Progress Note
Client: Alex R.  |  Session #5  |  March 20, 2026  |  50 min  |  Individual
Diagnosis: Generalized Anxiety Disorder (F41.1)
```

### Note Sections (SOAP example)

Each section is displayed as a distinct card/block with:
- Section label (S / O / A / P)
- Section title (Subjective / Objective / Assessment / Plan)
- Generated content (professional clinical prose)
- "Edit" button → opens inline textarea for that section
- Section status indicator (unedited / edited)

```
┌─────────────────────────────────────────────────────┐
│ S — SUBJECTIVE                              [Edit]  │
│                                                     │
│ Client reports a reduction in anxious symptoms      │
│ since the last session. He noted that the breathing │
│ exercises introduced in Session #4 have been        │
│ "actually helping" and that he used the 4-7-8       │
│ technique twice this week during moments of acute   │
│ anxiety at work. Client reports sleep has improved   │
│ slightly, noting he is falling asleep within         │
│ approximately one hour compared to two hours         │
│ previously. He denies any suicidal ideation or       │
│ self-harm urges.                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ O — OBJECTIVE                               [Edit]  │
│                                                     │
│ Client presented as casually dressed with           │
│ unremarkable grooming. He was fully engaged          │
│ throughout the session, maintaining consistent eye    │
│ contact. Affect was euthymic with appropriate range. │
│ Speech was normal in rate and volume. Thought         │
│ process was logical and goal-directed. Client         │
│ demonstrated the ability to identify cognitive        │
│ distortions when prompted and successfully reframed   │
│ two of three automatic negative thoughts in session.  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ A — ASSESSMENT                              [Edit]  │
│                                                     │
│ Client is demonstrating some progress toward         │
│ treatment goals. Anxiety symptoms appear to be       │
│ responding to CBT interventions, with particular     │
│ benefit from relaxation techniques. Cognitive         │
│ restructuring skills are developing, though client    │
│ continues to require therapist prompting to           │
│ identify distortions independently. Sleep             │
│ improvement is encouraging but remains below          │
│ functional baseline. No safety concerns at this time. │
│ Diagnostic impression remains consistent with         │
│ Generalized Anxiety Disorder (F41.1).                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ P — PLAN                                    [Edit]  │
│                                                     │
│ Continue CBT framework with focus on independent     │
│ identification of cognitive distortions. Introduce    │
│ worry time scheduling as an additional anxiety        │
│ management strategy. Assign homework: daily thought   │
│ log with emphasis on identifying distortions without  │
│ therapist guidance; continue 4-7-8 breathing twice    │
│ daily. Next session: individual, weekly.              │
└─────────────────────────────────────────────────────┘
```

### Action Buttons (below the note)

```
[ Copy to Clipboard ]     [ Regenerate Entire Note ]     [ New Note ]

"Copy to Clipboard" copies the full note as plain text, formatted with 
section headers, ready to paste into SimplePractice or any EHR.

Format of clipboard output:

PROGRESS NOTE — DRAFT
Client: Alex R.
Session #5 | March 20, 2026 | 50 minutes | Individual
Diagnosis: Generalized Anxiety Disorder (F41.1)
Modality: CBT

SUBJECTIVE:
[content]

OBJECTIVE:
[content]

ASSESSMENT:
[content]

PLAN:
[content]

---
Generated by Clarity | Draft for clinician review and approval
```

### DAP and BIRP Variations

If DAP selected, sections are:
- D — DATA (combines client report + therapist observations)
- A — ASSESSMENT (clinical interpretation)
- P — PLAN (next steps)

If BIRP selected, sections are:
- B — BEHAVIOR (observed client behaviors and presentation)
- I — INTERVENTION (what the therapist did)
- R — RESPONSE (how the client responded)
- P — PLAN (next steps and homework)

The quick-entry form is identical regardless of format. The AI prompt adapts the output structure based on the selected format. The same input data maps naturally to all three formats.

---

## High-Level Architecture

```
┌─────────────────────────────────────────┐
│         FRONTEND (Single Page)          │
│  Vanilla HTML + CSS + JS                │
│  Host: therapyai.bearingdigital.com     │
│                                         │
│  • Quick-entry form                     │
│  • Loading state                        │
│  • Note viewer/editor                   │
│  • Copy-to-clipboard                    │
│                                         │
│  Data: form state in memory             │
│  No database. No auth. No persistence.  │
└──────────────────┬──────────────────────┘
                   │ 
                   │ POST /api/generate-note
                   │ (JSON payload)
                   ▼
┌─────────────────────────────────────────┐
│         BACKEND (Lightweight)           │
│  Python (FastAPI or Flask)              │
│  Single endpoint                        │
│                                         │
│  1. Receive form data as JSON           │
│  2. Select prompt template (SOAP/DAP/   │
│     BIRP) based on format field         │
│  3. Assemble prompt: system prompt +    │
│     structured form data                │
│  4. Call Anthropic API                  │
│     (claude-sonnet-4-20250514)          │
│  5. Parse response into sections        │
│  6. Return JSON with sections           │
│                                         │
│  No database. No auth.                  │
│  Single file: app.py                    │
└──────────────────┬──────────────────────┘
                   │
                   │ Anthropic Messages API
                   ▼
┌─────────────────────────────────────────┐
│         ANTHROPIC API                   │
│  Model: claude-sonnet-4-20250514        │
│  Max tokens: 2000                       │
│  Temperature: 0.3 (low for clinical     │
│  consistency)                           │
└─────────────────────────────────────────┘
```

### Backend: Single File (app.py)

```python
# Pseudocode structure — RayRay builds the real implementation

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from anthropic import Anthropic
from pydantic import BaseModel

app = FastAPI()
# Add CORS for frontend domain
client = Anthropic()  # uses ANTHROPIC_API_KEY env var

class NoteRequest(BaseModel):
    client_name: str
    session_number: int
    session_date: str
    duration_minutes: int
    session_type: str
    note_format: str  # "SOAP" | "DAP" | "BIRP"
    primary_diagnosis: str
    treatment_modality: str
    treatment_goals: str  # optional
    client_report: str
    interventions_checked: list[str]
    interventions_description: str
    affect: str
    engagement: str
    eye_contact: str
    appearance: str
    speech: str
    thought_process: str
    additional_observations: str
    client_response: str
    progress: str
    risk_level: str
    risk_details: str  # optional
    plan_next_session: str
    homework: str
    next_appointment: str

class NoteResponse(BaseModel):
    format: str
    sections: dict  # keys vary by format
    metadata: dict  # client_name, session_number, date, etc.

@app.post("/api/generate-note")
async def generate_note(request: NoteRequest) -> NoteResponse:
    # 1. Select system prompt based on format
    system_prompt = get_system_prompt(request.note_format)
    
    # 2. Build user prompt from structured form data
    user_prompt = build_user_prompt(request)
    
    # 3. Call Anthropic API
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        temperature=0.3,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}]
    )
    
    # 4. Parse response into sections
    sections = parse_sections(response.content[0].text, request.note_format)
    
    # 5. Return
    return NoteResponse(
        format=request.note_format,
        sections=sections,
        metadata={
            "client_name": request.client_name,
            "session_number": request.session_number,
            "session_date": request.session_date,
            "duration_minutes": request.duration_minutes,
            "session_type": request.session_type,
            "diagnosis": request.primary_diagnosis,
            "modality": request.treatment_modality
        }
    )
```

### AI Prompt (SOAP — Primary Format)

```
SYSTEM PROMPT:
You are a clinical documentation assistant working with a licensed 
therapist (LCSW-C). Generate a SOAP progress note from the structured 
session data provided by the therapist.

RULES:
- Write in professional clinical language appropriate for a medical record
- Use third person: "Client reports...", "Client denies...", "Client 
  was observed to..."
- Include SPECIFIC details from the therapist's input — do not 
  generalize or fabricate
- Include the ICD-10 code for the diagnosis if you can identify it
- Reference treatment goals if provided
- Note session continuity (reference session number)

SECTION GUIDELINES:
S (Subjective): Client's self-report as conveyed by the therapist. 
  Include symptom changes, homework completion, mood/affect as reported, 
  and any significant quotes or statements. Include denial of SI/HI 
  when risk level is low/none.

O (Objective): Therapist's observations mapped from the structured 
  data — affect, engagement, eye contact, appearance, speech, thought 
  process. Include any quantitative measures. Note demonstrated skills 
  or behaviors observed in session.

A (Assessment): Clinical interpretation of the session. Reference 
  progress toward treatment goals (use exact progress level reported). 
  Note treatment response, diagnostic consistency, any emerging themes, 
  and risk assessment. This section reflects the therapist's clinical 
  reasoning.

P (Plan): Next session focus, homework assigned, interventions to 
  continue or introduce, frequency, and next appointment if noted. 
  Include any referrals or coordination needed.

OUTPUT FORMAT: Return ONLY a JSON object with four keys: 
"subjective", "objective", "assessment", "plan". Each value is a 
string of 3-6 sentences of professional clinical prose. No markdown. 
No extra text outside the JSON.

IMPORTANT: This is a DRAFT for clinician review and approval.

USER PROMPT:
SESSION INFORMATION:
- Client: {client_name}
- Session #{session_number} | {session_date} | {duration_minutes} min | {session_type}
- Diagnosis: {primary_diagnosis}
- Treatment Modality: {treatment_modality}
- Current Treatment Goals: {treatment_goals or "Not specified"}

CLIENT REPORT:
{client_report}

INTERVENTIONS USED:
Techniques: {comma-separated list of checked interventions}
Description: {interventions_description}

THERAPIST OBSERVATIONS:
- Affect: {affect}
- Engagement: {engagement}
- Eye Contact: {eye_contact}
- Appearance: {appearance}
- Speech: {speech}
- Thought Process: {thought_process}
- Additional: {additional_observations or "None noted"}

CLIENT RESPONSE TO SESSION:
{client_response}

PROGRESS TOWARD GOALS: {progress}

RISK ASSESSMENT: {risk_level}
{risk_details if provided}

PLAN:
- Next session focus: {plan_next_session}
- Homework: {homework or "None assigned"}
- Next appointment: {next_appointment or "To be scheduled"}

Generate a SOAP progress note.
```

For DAP and BIRP, the system prompt changes the section definitions and output JSON keys:
- DAP: keys are "data", "assessment", "plan"
- BIRP: keys are "behavior", "intervention", "response", "plan"

The user prompt remains identical — the same structured input maps to all three formats.

---

## Pre-Loaded Demo Data

Include a "Load Demo" button that pre-fills the form with this data so you can show it without typing:

```
Client: Alex R.
Session #: 5
Date: [today's date]
Duration: 50 minutes
Type: Individual
Format: SOAP
Diagnosis: Generalized Anxiety Disorder
Modality: CBT
Goals: Reduce anxiety symptoms. Improve sleep onset to under 30 min. 
       Develop independent coping skills.

Client Report: Client reported that breathing exercises from last 
session have been helpful. Said he used the 4-7-8 technique twice 
this week during anxiety spikes at work and it helped. Reports only 
2 panic-like episodes this week, down from 5 last week. Sleep is 
slightly better — falling asleep in about an hour instead of two. 
Says he still struggles with catastrophic thinking about work 
performance but is "starting to catch it."

Interventions: [checked] Cognitive restructuring, Relaxation/breathing, 
Thought records, Psychoeducation
Description: Reviewed thought log from past week. Client identified 
3 automatic negative thoughts related to work performance. Used 
Socratic questioning to examine evidence for and against each thought. 
Client successfully reframed 2 of 3. Reinforced 4-7-8 breathing 
technique. Introduced concept of worry scheduling.

Affect: Euthymic
Engagement: Fully engaged
Eye Contact: Consistent
Appearance: Casually dressed
Speech: Normal rate & volume
Thought Process: Logical & goal-directed
Additional Observations: Client appeared more relaxed than previous 
sessions. Smiled several times when discussing progress.

Client Response: Client responded well to cognitive restructuring 
exercise. Expressed surprise at being able to reframe his thoughts. 
Said "I didn't realize how much I was catastrophizing." Showed genuine 
engagement with worry scheduling concept.

Progress: Some progress
Risk: No risk indicators

Plan Next Session: Continue cognitive restructuring with focus on 
independent distortion identification. Begin worry time scheduling. 
Review thought log with emphasis on catching distortions without 
therapist prompting.

Homework: Daily thought log — identify at least one cognitive 
distortion per day and attempt reframe. Continue 4-7-8 breathing 
2x/day. Try 15-minute scheduled worry time once this week.

Next Appointment: Weekly — next Tuesday 2pm
```

---

## Design Notes

### Aesthetic Direction
- Warm, calm, professional. This is a clinical tool, not a consumer app.
- Color palette: sage greens, cream/warm whites, soft grays. Same family as the waitlist page.
- Typography: clean serif for headers (DM Serif Display), clean sans for body (DM Sans).
- The form should feel like a well-designed clinical intake — organized, clear, not overwhelming.
- The generated note should look like a professional document, not a chat response.
- Generous whitespace. No clutter.

### UX Priorities
- The form must feel FAST. A therapist between sessions has 10 minutes. If the form feels like work, they won't use it.
- Checkboxes over textareas wherever possible. Clicking is faster than typing.
- Smart defaults: today's date, 50 min duration, SOAP format, "No risk indicators."
- The "Generate Note" button should be impossible to miss.
- The generated note should have clear visual hierarchy — section labels prominent, content readable.
- "Copy to Clipboard" should give a clear success confirmation ("Copied!").
- The edit mode should be obvious and quick — click "Edit" on any section, change text, click "Save."

### What Your Wife Should Test Tomorrow

Give her this script:

1. Open the page. Does it feel professional and trustworthy?
2. Think of a client you saw this week. Fill out the form for that session. Time yourself — it should take 2-3 minutes.
3. Click Generate. Read the output carefully.
4. Clinical accuracy: Is the note something you could submit with minor edits? Or would you need to rewrite significant portions?
5. Language quality: Does it sound like a clinical note you'd write? Or does it sound like AI?
6. Missing information: Did the form capture everything you'd need for a complete note? What's missing?
7. Format: Try generating in all three formats (SOAP, DAP, BIRP). Which does your practice use? Does the output match expectations?
8. Copy to clipboard and paste into a blank document. Is the formatting clean? Would it paste well into SimplePractice?
9. Overall: Would you use this every day? What would make you use it every day?

Record her answers. They determine what gets refined before beta.

---

## Deployment Checklist

```
□ Backend deployed (any hosting with Python — Railway, Render, Fly.io, 
  or even localhost tunneled with ngrok for tonight's test)
□ ANTHROPIC_API_KEY set as environment variable
□ Frontend deployed to therapyai.bearingdigital.com (or subdomain)
□ CORS configured to allow frontend domain
□ Demo data "Load Demo" button works
□ Generate flow works end-to-end (form → API → note display)
□ Copy to Clipboard works
□ All three formats (SOAP/DAP/BIRP) generate correctly
□ Tested with 2-3 different session scenarios
```

---

*End of prototype spec. RayRay: build this tonight. Single page frontend, single endpoint backend, single API call. Ship it. Let the wife test it tomorrow. Her feedback determines everything that comes next.*
