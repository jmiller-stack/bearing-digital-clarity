const WORKER_URL = "https://openrouter-proxy.bearingdigital.workers.dev";
const STORAGE_KEYS = {
  draft: "clarity_form_draft_v1",
  note: "clarity_generated_note_v1",
};

const SECTION_CONFIG = {
  SOAP: [
    { key: "subjective", short: "S", title: "Subjective", clipboard: "SUBJECTIVE" },
    { key: "objective", short: "O", title: "Objective", clipboard: "OBJECTIVE" },
    { key: "assessment", short: "A", title: "Assessment", clipboard: "ASSESSMENT" },
    { key: "plan", short: "P", title: "Plan", clipboard: "PLAN" },
  ],
  DAP: [
    { key: "data", short: "D", title: "Data", clipboard: "DATA" },
    { key: "assessment", short: "A", title: "Assessment", clipboard: "ASSESSMENT" },
    { key: "plan", short: "P", title: "Plan", clipboard: "PLAN" },
  ],
  BIRP: [
    { key: "behavior", short: "B", title: "Behavior", clipboard: "BEHAVIOR" },
    { key: "intervention", short: "I", title: "Intervention", clipboard: "INTERVENTION" },
    { key: "response", short: "R", title: "Response", clipboard: "RESPONSE" },
    { key: "plan", short: "P", title: "Plan", clipboard: "PLAN" },
  ],
};

const SYSTEM_PROMPTS = {
  SOAP: `You are a clinical documentation assistant working with a licensed therapist (LCSW-C). Generate a SOAP progress note from the structured session data provided by the therapist.

RULES:
- Write in professional clinical language appropriate for a medical record.
- Use third person: "Client reports...", "Client denies...", "Client was observed to...".
- Include specific details from the therapist's input. Do not generalize or fabricate.
- Include the ICD-10 code for the diagnosis if you can identify it.
- Reference treatment goals if provided.
- Note session continuity by referencing session number when clinically relevant.

SECTION GUIDELINES:
- Subjective: client self-report, symptom changes, homework completion, reported mood/affect, significant quotes or statements, and denial of SI/HI when risk level is low or none.
- Objective: therapist observations mapped from the structured data including affect, engagement, eye contact, appearance, speech, thought process, and any skills or behaviors observed in session.
- Assessment: clinical interpretation of the session, exact reported progress level, treatment response, diagnostic consistency, emerging themes, and risk assessment.
- Plan: next session focus, homework assigned, interventions to continue or introduce, frequency, and next appointment if noted.

OUTPUT FORMAT:
Return only a valid JSON object with exactly four keys: "subjective", "objective", "assessment", and "plan".
Each value must be a string of 3-6 sentences of professional clinical prose.
No markdown. No code fences. No extra text outside the JSON.

IMPORTANT:
This is a draft for clinician review and approval.`,
  DAP: `You are a clinical documentation assistant working with a licensed therapist (LCSW-C). Generate a DAP progress note from the structured session data provided by the therapist.

RULES:
- Write in professional clinical language appropriate for a medical record.
- Use third person and stay specific to the provided details.
- Do not fabricate facts or add information that was not supplied.
- Include the ICD-10 code for the diagnosis if you can identify it.
- Reference treatment goals if provided and note session continuity when clinically relevant.

SECTION GUIDELINES:
- Data: combine client report, therapist observations, interventions used, and response to interventions into a cohesive factual account of the session.
- Assessment: provide clinical interpretation, exact reported progress level, diagnostic consistency, treatment response, and risk assessment.
- Plan: outline next session focus, homework, interventions to continue or introduce, frequency, and next appointment if provided.

OUTPUT FORMAT:
Return only a valid JSON object with exactly three keys: "data", "assessment", and "plan".
Each value must be a string of 3-6 sentences of professional clinical prose.
No markdown. No code fences. No extra text outside the JSON.

IMPORTANT:
This is a draft for clinician review and approval.`,
  BIRP: `You are a clinical documentation assistant working with a licensed therapist (LCSW-C). Generate a BIRP progress note from the structured session data provided by the therapist.

RULES:
- Write in professional clinical language appropriate for a medical record.
- Use third person and remain grounded in the therapist's structured input.
- Do not fabricate facts or add unsupported clinical detail.
- Include the ICD-10 code for the diagnosis if you can identify it.
- Reference treatment goals if provided and note session continuity when clinically relevant.

SECTION GUIDELINES:
- Behavior: summarize the client's presentation, symptoms, self-report, and observable behavior.
- Intervention: describe what the therapist did in session, using the selected interventions and description.
- Response: capture how the client responded to the interventions, treatment engagement, progress, and risk considerations.
- Plan: cover next session focus, homework, follow-up, and next appointment details if available.

OUTPUT FORMAT:
Return only a valid JSON object with exactly four keys: "behavior", "intervention", "response", and "plan".
Each value must be a string of 3-6 sentences of professional clinical prose.
No markdown. No code fences. No extra text outside the JSON.

IMPORTANT:
This is a draft for clinician review and approval.`,
};

const DEMO_DATA = {
  client_name: "Alex R.",
  session_number: "5",
  session_date: "",
  duration_minutes: "50",
  session_type: "Individual",
  note_format: "SOAP",
  primary_diagnosis: "Generalized Anxiety Disorder",
  treatment_modality: "CBT",
  treatment_goals:
    "Reduce anxiety symptoms. Improve sleep onset to under 30 min. Develop independent coping skills.",
  client_report:
    'Client reported that breathing exercises from last session have been helpful. Said he used the 4-7-8 technique twice this week during anxiety spikes at work and it helped. Reports only 2 panic-like episodes this week, down from 5 last week. Sleep is slightly better — falling asleep in about an hour instead of two. Says he still struggles with catastrophic thinking about work performance but is "starting to catch it."',
  interventions_checked: [
    "Cognitive restructuring",
    "Relaxation / breathing",
    "Thought records",
    "Psychoeducation",
  ],
  interventions_other: "",
  interventions_description:
    "Reviewed thought log from past week. Client identified 3 automatic negative thoughts related to work performance. Used Socratic questioning to examine evidence for and against each thought. Client successfully reframed 2 of 3. Reinforced 4-7-8 breathing technique. Introduced concept of worry scheduling.",
  affect: "Euthymic",
  engagement: "Fully engaged",
  eye_contact: "Consistent",
  appearance: "Casually dressed",
  speech: "Normal rate & volume",
  thought_process: "Logical & goal-directed",
  additional_observations:
    "Client appeared more relaxed than previous sessions. Smiled several times when discussing progress.",
  client_response:
    `Client responded well to cognitive restructuring exercise. Expressed surprise at being able to reframe his thoughts. Said "I didn't realize how much I was catastrophizing." Showed genuine engagement with worry scheduling concept.`,
  progress: "Some progress",
  risk_level: "No risk indicators",
  risk_details: "",
  plan_next_session:
    "Continue cognitive restructuring with focus on independent distortion identification. Begin worry time scheduling. Review thought log with emphasis on catching distortions without therapist prompting.",
  homework:
    "Daily thought log — identify at least one cognitive distortion per day and attempt reframe. Continue 4-7-8 breathing 2x/day. Try 15-minute scheduled worry time once this week.",
  next_appointment: "Weekly — next Tuesday 2pm",
};

const state = {
  currentView: "form",
  latestRequest: null,
  generatedNote: null,
};

const elements = {
  form: document.querySelector("#note-form"),
  formView: document.querySelector("#form-view"),
  loadingView: document.querySelector("#loading-view"),
  noteView: document.querySelector("#note-view"),
  loadDemo: document.querySelector("#load-demo"),
  clearForm: document.querySelector("#clear-form"),
  generateCaption: document.querySelector("#generate-caption"),
  formMessage: document.querySelector("#form-message"),
  loadingTitle: document.querySelector("#loading-title"),
  noteTitle: document.querySelector("#note-title"),
  noteMetadata: document.querySelector("#note-metadata"),
  noteDiagnosis: document.querySelector("#note-diagnosis"),
  noteSections: document.querySelector("#note-sections"),
  copyStatus: document.querySelector("#copy-status"),
  riskDetailsField: document.querySelector("#risk-details-field"),
  copyNote: document.querySelector("#copy-note"),
  regenerateNote: document.querySelector("#regenerate-note"),
  newNote: document.querySelector("#new-note"),
  backToForm: document.querySelector("#back-to-form"),
  noteCardTemplate: document.querySelector("#note-card-template"),
};

init();

function init() {
  setDefaultDate();
  hydrateFromStorage();
  bindEvents();
  syncFormatCaption();
  toggleRiskDetails();
}

function bindEvents() {
  elements.form.addEventListener("submit", handleGenerate);
  elements.loadDemo.addEventListener("click", loadDemoData);
  elements.clearForm.addEventListener("click", handleClearForm);
  elements.copyNote.addEventListener("click", handleCopyNote);
  elements.regenerateNote.addEventListener("click", handleRegenerate);
  elements.newNote.addEventListener("click", handleNewNote);
  elements.backToForm.addEventListener("click", () => showView("form"));

  elements.form.addEventListener("change", (event) => {
    if (event.target.name === "note_format") {
      syncFormatCaption();
    }

    if (event.target.name === "risk_level") {
      toggleRiskDetails();
    }

    persistDraft();
  });

  elements.form.addEventListener("input", () => {
    persistDraft();
  });
}

function setDefaultDate() {
  const dateField = elements.form.elements.session_date;
  if (!dateField.value) {
    dateField.value = formatDateForInput(new Date());
  }
}

function hydrateFromStorage() {
  const savedDraft = safelyParseJSON(localStorage.getItem(STORAGE_KEYS.draft));
  if (savedDraft) {
    applyFormData(savedDraft);
  }

  const savedNote = safelyParseJSON(localStorage.getItem(STORAGE_KEYS.note));
  if (savedNote && savedNote.request && savedNote.response) {
    state.latestRequest = savedNote.request;
    state.generatedNote = savedNote.response;
    renderGeneratedNote(savedNote.response);
    showView("note");
  }
}

function handleClearForm() {
  elements.form.reset();
  setDefaultDate();
  elements.form.elements.duration_minutes.value = "50";
  elements.form.elements.session_type.value = "Individual";
  elements.form.elements.treatment_modality.value = "CBT";
  elements.form.elements.note_format.value = "SOAP";
  elements.form.elements.progress.value = "Some progress";
  elements.form.elements.risk_level.value = "No risk indicators";
  syncCheckedValue("note_format", "SOAP");
  syncCheckedValue("progress", "Some progress");
  syncCheckedValue("risk_level", "No risk indicators");
  toggleRiskDetails();
  syncFormatCaption();
  clearInlineMessage(elements.formMessage);
  localStorage.removeItem(STORAGE_KEYS.draft);
}

function loadDemoData() {
  DEMO_DATA.session_date = formatDateForInput(new Date());
  applyFormData(DEMO_DATA);
  syncFormatCaption();
  toggleRiskDetails();
  persistDraft();
  setInlineMessage(elements.formMessage, "Demo session loaded.", "success");
}

function applyFormData(data) {
  Object.entries(data).forEach(([key, value]) => {
    if (key === "interventions_checked" && Array.isArray(value)) {
      const checkboxes = elements.form.querySelectorAll('input[name="interventions_checked"]');
      checkboxes.forEach((checkbox) => {
        checkbox.checked = value.includes(checkbox.value);
      });
      return;
    }

    const field = elements.form.elements[key];
    if (!field) {
      return;
    }

    if (field instanceof RadioNodeList) {
      field.value = value;
      syncCheckedValue(key, value);
      return;
    }

    field.value = value;
  });
}

function syncCheckedValue(name, value) {
  const candidates = elements.form.querySelectorAll(`[name="${name}"]`);
  candidates.forEach((input) => {
    input.checked = input.value === value;
  });
}

function collectFormData() {
  const formData = new FormData(elements.form);
  const payload = {
    client_name: formData.get("client_name")?.trim() || "",
    session_number: formData.get("session_number")?.trim() || "",
    session_date: formData.get("session_date") || "",
    duration_minutes: formData.get("duration_minutes") || "50",
    session_type: formData.get("session_type") || "Individual",
    note_format: formData.get("note_format") || "SOAP",
    primary_diagnosis: formData.get("primary_diagnosis")?.trim() || "",
    treatment_modality: formData.get("treatment_modality") || "CBT",
    treatment_goals: formData.get("treatment_goals")?.trim() || "",
    client_report: formData.get("client_report")?.trim() || "",
    interventions_checked: formData.getAll("interventions_checked"),
    interventions_other: formData.get("interventions_other")?.trim() || "",
    interventions_description: formData.get("interventions_description")?.trim() || "",
    affect: formData.get("affect") || "",
    engagement: formData.get("engagement") || "",
    eye_contact: formData.get("eye_contact") || "",
    appearance: formData.get("appearance") || "",
    speech: normalizeAmpersands(formData.get("speech") || ""),
    thought_process: normalizeAmpersands(formData.get("thought_process") || ""),
    additional_observations: formData.get("additional_observations")?.trim() || "",
    client_response: formData.get("client_response")?.trim() || "",
    progress: formData.get("progress") || "",
    risk_level: formData.get("risk_level") || "No risk indicators",
    risk_details: formData.get("risk_details")?.trim() || "",
    plan_next_session: formData.get("plan_next_session")?.trim() || "",
    homework: formData.get("homework")?.trim() || "",
    next_appointment: formData.get("next_appointment")?.trim() || "",
  };

  if (payload.interventions_other) {
    payload.interventions_checked = [...payload.interventions_checked, payload.interventions_other];
  }

  return payload;
}

function validateForm(payload) {
  const requiredFields = [
    ["client_name", "Client name or initials"],
    ["session_number", "Session number"],
    ["session_date", "Session date"],
    ["primary_diagnosis", "Primary diagnosis"],
    ["client_report", "Client report"],
    ["interventions_description", "Interventions description"],
    ["affect", "Affect"],
    ["engagement", "Engagement"],
    ["eye_contact", "Eye contact"],
    ["appearance", "Appearance"],
    ["speech", "Speech"],
    ["thought_process", "Thought process"],
    ["client_response", "Client response"],
    ["plan_next_session", "Plan for next session"],
  ];

  const missing = requiredFields.find(([key]) => !payload[key]);
  if (missing) {
    return `Complete "${missing[1]}" before generating the note.`;
  }

  if (!payload.interventions_checked.length) {
    return "Select at least one intervention or enter one in the Other field.";
  }

  if (
    (payload.risk_level.startsWith("Moderate") || payload.risk_level.startsWith("High")) &&
    !payload.risk_details
  ) {
    return "Add risk details for moderate or high risk sessions.";
  }

  return "";
}

async function handleGenerate(event) {
  event.preventDefault();
  clearInlineMessage(elements.formMessage);
  clearInlineMessage(elements.copyStatus);

  const payload = collectFormData();
  const validationMessage = validateForm(payload);
  if (validationMessage) {
    setInlineMessage(elements.formMessage, validationMessage, "error");
    return;
  }

  state.latestRequest = payload;
  persistDraft();
  showLoading(payload.note_format);

  try {
    const aiResponse = await generateNoteFromWorker(payload);
    state.generatedNote = aiResponse;
    localStorage.setItem(
      STORAGE_KEYS.note,
      JSON.stringify({
        request: payload,
        response: aiResponse,
      }),
    );
    renderGeneratedNote(aiResponse);
    showView("note");
  } catch (error) {
    console.error(error);
    showView("form");
    setInlineMessage(
      elements.formMessage,
      error.message || "The note could not be generated. Try again.",
      "error",
    );
  }
}

function showLoading(noteFormat) {
  elements.loadingTitle.textContent = `Generating your ${noteFormat} note...`;
  showView("loading");
}

async function generateNoteFromWorker(payload) {
  const systemPrompt = SYSTEM_PROMPTS[payload.note_format];
  const userPrompt = buildUserPrompt(payload);

  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4-5",
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const responseText = await response.text();
  const responseBody = safelyParseJSON(responseText);

  if (!response.ok) {
    const message =
      responseBody?.error?.message ||
      responseBody?.message ||
      `Worker request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const rawContent = responseBody?.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("The worker returned no note content.");
  }

  const parsedSections = parseWorkerContent(rawContent);
  validateSectionShape(payload.note_format, parsedSections);

  return {
    format: payload.note_format,
    metadata: buildMetadata(payload),
    sections: buildSectionState(payload.note_format, parsedSections),
  };
}

function buildUserPrompt(payload) {
  const goals = payload.treatment_goals || "Not specified";
  const additional = payload.additional_observations || "None noted";
  const homework = payload.homework || "None assigned";
  const nextAppointment = payload.next_appointment || "To be scheduled";
  const riskDetails = payload.risk_details ? `RISK DETAILS: ${payload.risk_details}` : "";
  const interventions = payload.interventions_checked.join(", ");

  return `SESSION INFORMATION:
- Client: ${payload.client_name}
- Session #${payload.session_number} | ${formatDateLong(payload.session_date)} | ${payload.duration_minutes} min | ${payload.session_type}
- Diagnosis: ${payload.primary_diagnosis}
- Treatment Modality: ${payload.treatment_modality}
- Current Treatment Goals: ${goals}

CLIENT REPORT:
${payload.client_report}

INTERVENTIONS USED:
Techniques: ${interventions}
Description: ${payload.interventions_description}

THERAPIST OBSERVATIONS:
- Affect: ${payload.affect}
- Engagement: ${payload.engagement}
- Eye Contact: ${payload.eye_contact}
- Appearance: ${payload.appearance}
- Speech: ${payload.speech}
- Thought Process: ${payload.thought_process}
- Additional: ${additional}

CLIENT RESPONSE TO SESSION:
${payload.client_response}

PROGRESS TOWARD GOALS: ${payload.progress}

RISK ASSESSMENT: ${payload.risk_level}
${riskDetails}

PLAN:
- Next session focus: ${payload.plan_next_session}
- Homework: ${homework}
- Next appointment: ${nextAppointment}

Generate a ${payload.note_format} progress note.`;
}

function parseWorkerContent(rawContent) {
  if (typeof rawContent === "string") {
    return parseJSONString(rawContent);
  }

  if (Array.isArray(rawContent)) {
    const text = rawContent
      .map((entry) => (typeof entry === "string" ? entry : entry?.text || ""))
      .join("")
      .trim();
    return parseJSONString(text);
  }

  throw new Error("Unexpected response format from the worker.");
}

function parseJSONString(content) {
  const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
  const parsed = safelyParseJSON(cleaned);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("The note response was not valid JSON.");
  }
  return parsed;
}

function validateSectionShape(format, sections) {
  const requiredKeys = SECTION_CONFIG[format].map((section) => section.key);
  const missing = requiredKeys.find((key) => typeof sections[key] !== "string" || !sections[key].trim());
  if (missing) {
    throw new Error(`The generated ${format} note was missing the "${missing}" section.`);
  }
}

function buildMetadata(payload) {
  return {
    client_name: payload.client_name,
    session_number: payload.session_number,
    session_date: payload.session_date,
    duration_minutes: payload.duration_minutes,
    session_type: payload.session_type,
    diagnosis: payload.primary_diagnosis,
    modality: payload.treatment_modality,
  };
}

function buildSectionState(format, generatedSections) {
  return SECTION_CONFIG[format].map((section) => ({
    ...section,
    content: generatedSections[section.key].trim(),
    edited: false,
  }));
}

function renderGeneratedNote(note) {
  elements.noteTitle.textContent = `${note.format} Progress Note`;
  elements.noteMetadata.textContent = [
    `Client: ${note.metadata.client_name}`,
    `Session #${note.metadata.session_number}`,
    formatDateLong(note.metadata.session_date),
    `${note.metadata.duration_minutes} min`,
    note.metadata.session_type,
  ].join("  |  ");
  elements.noteDiagnosis.textContent = `Diagnosis: ${note.metadata.diagnosis} · Modality: ${note.metadata.modality}`;

  elements.noteSections.innerHTML = "";
  note.sections.forEach((section, index) => {
    const fragment = elements.noteCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".note-card");
    const label = fragment.querySelector(".note-card-label");
    const title = fragment.querySelector(".note-card-title");
    const status = fragment.querySelector(".section-status");
    const content = fragment.querySelector(".note-card-content");
    const editToggle = fragment.querySelector(".edit-toggle");
    const editPanel = fragment.querySelector(".edit-panel");
    const textarea = fragment.querySelector("textarea");
    const saveEdit = fragment.querySelector(".save-edit");
    const cancelEdit = fragment.querySelector(".cancel-edit");

    label.textContent = `${section.short} — ${section.title}`;
    title.textContent = section.title;
    status.textContent = section.edited ? "Edited" : "Unedited";
    status.classList.toggle("edited", section.edited);
    content.textContent = section.content;
    textarea.value = section.content;

    editToggle.addEventListener("click", () => {
      editPanel.classList.toggle("is-hidden");
      if (!editPanel.classList.contains("is-hidden")) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    });

    saveEdit.addEventListener("click", () => {
      const nextValue = textarea.value.trim();
      if (!nextValue) {
        return;
      }

      state.generatedNote.sections[index].content = nextValue;
      state.generatedNote.sections[index].edited = true;
      persistGeneratedNote();
      renderGeneratedNote(state.generatedNote);
    });

    cancelEdit.addEventListener("click", () => {
      textarea.value = state.generatedNote.sections[index].content;
      editPanel.classList.add("is-hidden");
    });

    card.dataset.sectionKey = section.key;
    elements.noteSections.appendChild(fragment);
  });
}

async function handleCopyNote() {
  if (!state.generatedNote) {
    return;
  }

  try {
    await navigator.clipboard.writeText(buildClipboardOutput(state.generatedNote));
    setInlineMessage(elements.copyStatus, "Copied to clipboard.", "success");
  } catch (error) {
    console.error(error);
    setInlineMessage(elements.copyStatus, "Clipboard copy failed. Copy manually from the page.", "error");
  }
}

async function handleRegenerate() {
  if (!state.latestRequest) {
    showView("form");
    return;
  }

  clearInlineMessage(elements.copyStatus);
  showLoading(state.latestRequest.note_format);

  try {
    const aiResponse = await generateNoteFromWorker(state.latestRequest);
    state.generatedNote = aiResponse;
    persistGeneratedNote();
    renderGeneratedNote(aiResponse);
    showView("note");
  } catch (error) {
    console.error(error);
    showView("note");
    setInlineMessage(
      elements.copyStatus,
      error.message || "Regeneration failed. Try again.",
      "error",
    );
  }
}

function handleNewNote() {
  state.generatedNote = null;
  localStorage.removeItem(STORAGE_KEYS.note);
  clearInlineMessage(elements.copyStatus);
  showView("form");
  elements.noteSections.innerHTML = "";
}

function buildClipboardOutput(note) {
  const lines = [
    "PROGRESS NOTE — DRAFT",
    `Client: ${note.metadata.client_name}`,
    `Session #${note.metadata.session_number} | ${formatDateLong(note.metadata.session_date)} | ${note.metadata.duration_minutes} minutes | ${note.metadata.session_type}`,
    `Diagnosis: ${note.metadata.diagnosis}`,
    `Modality: ${note.metadata.modality}`,
    "",
  ];

  note.sections.forEach((section) => {
    lines.push(`${section.clipboard}:`);
    lines.push(section.content);
    lines.push("");
  });

  lines.push("---");
  lines.push("Generated by Clarity | Draft for clinician review and approval");
  return lines.join("\n");
}

function toggleRiskDetails() {
  const riskLevel = elements.form.elements.risk_level.value;
  const shouldShow = riskLevel.startsWith("Moderate") || riskLevel.startsWith("High");
  elements.riskDetailsField.classList.toggle("is-hidden", !shouldShow);
  if (!shouldShow) {
    elements.form.elements.risk_details.value = "";
  }
}

function syncFormatCaption() {
  const format = elements.form.elements.note_format.value || "SOAP";
  elements.generateCaption.textContent = `Note format: ${format} · Estimated generation time: 15-20 seconds`;
}

function showView(nextView) {
  state.currentView = nextView;
  elements.formView.classList.toggle("is-hidden", nextView !== "form");
  elements.loadingView.classList.toggle("is-hidden", nextView !== "loading");
  elements.noteView.classList.toggle("is-hidden", nextView !== "note");
}

function persistDraft() {
  localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(collectFormData()));
}

function persistGeneratedNote() {
  if (!state.generatedNote || !state.latestRequest) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEYS.note,
    JSON.stringify({
      request: state.latestRequest,
      response: state.generatedNote,
    }),
  );
}

function setInlineMessage(element, message, type) {
  element.textContent = message;
  element.classList.remove("success", "error");
  if (type) {
    element.classList.add(type);
  }
}

function clearInlineMessage(element) {
  setInlineMessage(element, "", "");
}

function safelyParseJSON(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function formatDateForInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDateLong(input) {
  const value = typeof input === "string" ? `${input}T12:00:00` : input;
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function normalizeAmpersands(value) {
  return value.replace(/&amp;/g, "&");
}
