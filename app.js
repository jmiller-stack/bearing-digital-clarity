const BACKEND_URL = window.BACKEND_URL || "https://web-production-d6d7d.up.railway.app";
const STORAGE_KEYS = {
  draft: "clarity_form_draft_v2",
  note: "clarity_generated_note_v2",
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
    'Client reported that breathing exercises from last session have been helpful. Said he used the 4-7-8 technique twice this week during anxiety spikes at work and it helped. Reports only 2 panic-like episodes this week, down from 5 last week. Sleep is slightly better - falling asleep in about an hour instead of two. Says he still struggles with catastrophic thinking about work performance but is "starting to catch it."',
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
    'Client responded well to cognitive restructuring exercise. Expressed surprise at being able to reframe his thoughts. Said "I didn\'t realize how much I was catastrophizing." Showed genuine engagement with worry scheduling concept.',
  progress: "Some progress",
  risk_level: "No risk indicators",
  risk_details: "",
  plan_next_session:
    "Continue cognitive restructuring with focus on independent distortion identification. Begin worry time scheduling. Review thought log with emphasis on catching distortions without therapist prompting.",
  homework:
    "Daily thought log - identify at least one cognitive distortion per day and attempt reframe. Continue 4-7-8 breathing 2x/day. Try 15-minute scheduled worry time once this week.",
  next_appointment: "Weekly - next Tuesday 2pm",
};

const state = {
  currentView: "form",
  latestRequest: null,
  generatedNote: null,
  currentNoteId: null,
  feedbackSelection: "",
  feedbackSubmitted: false,
  feedbackPending: false,
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
  feedbackPanel: document.querySelector("#feedback-panel"),
  feedbackButtons: Array.from(document.querySelectorAll("[data-feedback-rating]")),
  feedbackNotes: document.querySelector("#feedback-notes"),
  submitFeedback: document.querySelector("#submit-feedback"),
  skipFeedback: document.querySelector("#skip-feedback"),
  feedbackMessage: document.querySelector("#feedback-message"),
};

init();

function init() {
  setDefaultDate();
  hydrateFromStorage();
  bindEvents();
  syncFormatCaption();
  toggleRiskDetails();
  syncFeedbackButtons();
}

function bindEvents() {
  const on = (el, event, fn) => el && el.addEventListener(event, fn);
  on(elements.form, "submit", handleGenerate);
  on(elements.loadDemo, "click", loadDemoData);
  on(elements.clearForm, "click", handleClearForm);
  on(elements.copyNote, "click", handleCopyNote);
  on(elements.regenerateNote, "click", handleRegenerate);
  on(elements.newNote, "click", handleNewNote);
  on(elements.backToForm, "click", () => showView("form"));
  on(elements.submitFeedback, "click", handleSubmitFeedback);
  on(elements.skipFeedback, "click", handleSkipFeedback);

  elements.feedbackButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.feedbackSelection = button.dataset.feedbackRating || "";
      syncFeedbackButtons();
      if (elements.feedbackMessage) clearInlineMessage(elements.feedbackMessage);
    });
  });

  on(elements.form, "change", (event) => {
    if (event.target.name === "note_format") {
      syncFormatCaption();
    }

    if (event.target.name === "risk_level") {
      toggleRiskDetails();
    }

    persistDraft();
  });

  on(elements.form, "input", () => {
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
  if (savedNote && savedNote.request && savedNote.response && savedNote.noteId) {
    state.latestRequest = savedNote.request;
    state.generatedNote = savedNote.response;
    state.currentNoteId = savedNote.noteId;
    state.feedbackSubmitted = Boolean(savedNote.feedbackSubmitted);
    state.feedbackPending = Boolean(savedNote.feedbackPending);
    renderGeneratedNote(savedNote.response);
    updateFeedbackVisibility(state.feedbackPending);
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
    const response = await apiRequest("/api/generate-note", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    state.currentNoteId = response.note_id;
    state.generatedNote = {
      format: response.format,
      metadata: response.metadata,
      sections: response.sections,
    };
    resetFeedbackState();
    persistGeneratedNote();
    renderGeneratedNote(state.generatedNote);
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
    const cardMessage = fragment.querySelector(".section-message");

    label.textContent = `${section.short} — ${section.title}`;
    title.textContent = section.title;
    status.textContent = section.edited ? "Edited" : "Unedited";
    status.classList.toggle("edited", section.edited);
    content.textContent = section.content;
    textarea.value = section.content;

    editToggle.addEventListener("click", () => {
      editPanel.classList.toggle("is-hidden");
      clearInlineMessage(cardMessage);
      if (!editPanel.classList.contains("is-hidden")) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    });

    saveEdit.addEventListener("click", async () => {
      const nextValue = textarea.value.trim();
      if (!nextValue || !state.generatedNote || !state.currentNoteId) {
        return;
      }

      const previousValue = state.generatedNote.sections[index].content;
      if (previousValue === nextValue) {
        editPanel.classList.add("is-hidden");
        return;
      }

      saveEdit.disabled = true;
      setInlineMessage(cardMessage, "Saving edit...", "success");

      try {
        await apiRequest(`/api/notes/${state.currentNoteId}/edits`, {
          method: "POST",
          body: JSON.stringify({
            edits: {
              [section.key]: nextValue,
            },
          }),
        });

        state.generatedNote.sections[index].content = nextValue;
        state.generatedNote.sections[index].edited = true;
        persistGeneratedNote();
        renderGeneratedNote(state.generatedNote);
      } catch (error) {
        console.error(error);
        setInlineMessage(cardMessage, error.message || "Edit save failed.", "error");
        saveEdit.disabled = false;
      }
    });

    cancelEdit.addEventListener("click", () => {
      textarea.value = state.generatedNote.sections[index].content;
      editPanel.classList.add("is-hidden");
      clearInlineMessage(cardMessage);
    });

    card.dataset.sectionKey = section.key;
    elements.noteSections.appendChild(fragment);
  });
}

async function handleCopyNote() {
  if (!state.generatedNote || !state.currentNoteId) {
    return;
  }

  const finalOutput = buildClipboardOutput(state.generatedNote);

  try {
    await navigator.clipboard.writeText(finalOutput);
    await apiRequest(`/api/notes/${state.currentNoteId}/copied`, {
      method: "POST",
      body: JSON.stringify({ final_output: finalOutput }),
    });
    state.feedbackPending = true;
    setInlineMessage(elements.copyStatus, "Copied to clipboard.", "success");
    updateFeedbackVisibility(true);
    persistGeneratedNote();
  } catch (error) {
    console.error(error);
    setInlineMessage(elements.copyStatus, error.message || "Clipboard copy failed.", "error");
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
    const response = await apiRequest("/api/generate-note", {
      method: "POST",
      body: JSON.stringify(state.latestRequest),
    });

    state.currentNoteId = response.note_id;
    state.generatedNote = {
      format: response.format,
      metadata: response.metadata,
      sections: response.sections,
    };
    resetFeedbackState();
    persistGeneratedNote();
    renderGeneratedNote(state.generatedNote);
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
  state.currentNoteId = null;
  state.feedbackSubmitted = false;
  state.feedbackPending = false;
  resetFeedbackState();
  localStorage.removeItem(STORAGE_KEYS.note);
  clearInlineMessage(elements.copyStatus);
  elements.noteSections.innerHTML = "";
  showView("form");
}

async function handleSubmitFeedback() {
  if (!state.currentNoteId) {
    return;
  }

  if (!state.feedbackSelection) {
    setInlineMessage(elements.feedbackMessage, "Choose a feedback rating first.", "error");
    return;
  }

  elements.submitFeedback.disabled = true;
  setInlineMessage(elements.feedbackMessage, "Saving feedback...", "success");

  try {
    await apiRequest(`/api/notes/${state.currentNoteId}/feedback`, {
      method: "POST",
      body: JSON.stringify({
        feedback_rating: state.feedbackSelection,
        feedback_notes: elements.feedbackNotes.value.trim(),
      }),
    });

    state.feedbackSubmitted = true;
    state.feedbackPending = false;
    persistGeneratedNote();
    setInlineMessage(elements.feedbackMessage, "Feedback saved.", "success");
    window.setTimeout(() => {
      updateFeedbackVisibility(false);
    }, 900);
  } catch (error) {
    console.error(error);
    elements.submitFeedback.disabled = false;
    setInlineMessage(elements.feedbackMessage, error.message || "Feedback save failed.", "error");
  }
}

function handleSkipFeedback() {
  state.feedbackSubmitted = true;
  state.feedbackPending = false;
  persistGeneratedNote();
  updateFeedbackVisibility(false);
}

function buildClipboardOutput(note) {
  const lines = [
    "PROGRESS NOTE - DRAFT",
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
  if (!elements.form) return;
  const riskLevel = elements.form.elements.risk_level.value;
  const shouldShow = riskLevel.startsWith("Moderate") || riskLevel.startsWith("High");
  if (elements.riskDetailsField) elements.riskDetailsField.classList.toggle("is-hidden", !shouldShow);
  if (!shouldShow && elements.form.elements.risk_details) {
    elements.form.elements.risk_details.value = "";
  }
}

function syncFormatCaption() {
  const format = elements.form.elements.note_format.value || "SOAP";
  elements.generateCaption.textContent = `Note format: ${format} · Estimated generation time: 15-20 seconds`;
}

function syncFeedbackButtons() {
  elements.feedbackButtons.forEach((button) => {
    const selected = button.dataset.feedbackRating === state.feedbackSelection;
    button.classList.toggle("is-selected", selected);
  });
}

function resetFeedbackState() {
  state.feedbackSelection = "";
  state.feedbackSubmitted = false;
  state.feedbackPending = false;
  if (elements.feedbackNotes) elements.feedbackNotes.value = "";
  if (elements.submitFeedback) elements.submitFeedback.disabled = false;
  syncFeedbackButtons();
  if (elements.feedbackMessage) clearInlineMessage(elements.feedbackMessage);
  updateFeedbackVisibility(false);
}

function updateFeedbackVisibility(visible) {
  if (elements.feedbackPanel) elements.feedbackPanel.classList.toggle("is-hidden", !visible);
}

function showView(nextView) {
  state.currentView = nextView;
  if (elements.formView) elements.formView.classList.toggle("is-hidden", nextView !== "form");
  if (elements.loadingView) elements.loadingView.classList.toggle("is-hidden", nextView !== "loading");
  if (elements.noteView) elements.noteView.classList.toggle("is-hidden", nextView !== "note");
}

function persistDraft() {
  localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(collectFormData()));
}

function persistGeneratedNote() {
  if (!state.generatedNote || !state.latestRequest || !state.currentNoteId) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEYS.note,
    JSON.stringify({
      noteId: state.currentNoteId,
      request: state.latestRequest,
      response: state.generatedNote,
      feedbackSubmitted: state.feedbackSubmitted,
      feedbackPending: state.feedbackPending,
    }),
  );
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body,
  });

  const text = await response.text();
  const parsed = safelyParseJSON(text);

  if (!response.ok) {
    const message = parsed?.detail || parsed?.message || `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return parsed;
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
