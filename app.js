const BACKEND_URL = window.BACKEND_URL || "https://web-production-d6d7d.up.railway.app";
const STORAGE_KEYS = {
  draft: "clarity_form_draft_v2",
  note: "clarity_generated_note_v2",
  userId: "clarity_user_id",
};

const HCC_TEMPLATE_NAME = "HCC SOAP Note";
const FALLBACK_TEMPLATES = [
  {
    id: "builtin-hcc-fallback",
    name: HCC_TEMPLATE_NAME,
    is_builtin: true,
    sections_json: [
      { key: "subjective_complaint_presenting_problem", short: "1", title: "Subjective Complaint / Presenting Problem", clipboard: "SUBJECTIVE COMPLAINT / PRESENTING PROBLEM" },
      { key: "objective", short: "2", title: "Objective", clipboard: "OBJECTIVE" },
      { key: "provider_assessment", short: "3", title: "Provider Assessment", clipboard: "PROVIDER ASSESSMENT" },
      { key: "clinical_interventions_used", short: "4", title: "Clinical Interventions used", clipboard: "CLINICAL INTERVENTIONS USED" },
      { key: "clients_response", short: "5", title: "Clients Response", clipboard: "CLIENTS RESPONSE" },
      { key: "progress_regression_toward_goals", short: "6", title: "Progress/Regression Toward Goals", clipboard: "PROGRESS/REGRESSION TOWARD GOALS" },
      { key: "insight_and_treatment_recommendations", short: "7", title: "Insight and Treatment Recommendations", clipboard: "INSIGHT AND TREATMENT RECOMMENDATIONS" },
      { key: "risk_check", short: "8", title: "Risk Check", clipboard: "RISK CHECK" },
      { key: "plan_recommendations_homework", short: "9", title: "Plan / Recommendations / Homework", clipboard: "PLAN / RECOMMENDATIONS / HOMEWORK" },
    ],
  },
];

const REQUIRED_FIELDS = [
  { key: "client_name", label: "Client Name" },
  { key: "client_report", label: "Client Report" },
  { key: "interventions_description", label: "Interventions Description" },
  { key: "affect", label: "Affect" },
  { key: "engagement", label: "Engagement" },
  { key: "eye_contact", label: "Eye Contact" },
  { key: "appearance", label: "Appearance" },
  { key: "speech", label: "Speech" },
  { key: "thought_process", label: "Thought Process" },
  { key: "client_response", label: "Client Response" },
  { key: "plan_next_session", label: "Plan for Next Session" },
];

const DEMO_DATA = {
  client_name: "Alex R.",
  session_number: "5",
  session_date: "",
  duration_minutes: "50",
  session_type: "Individual",
  note_format: "SOAP",
  note_template_name: HCC_TEMPLATE_NAME,
  primary_diagnosis: ["Generalized Anxiety Disorder", "Adjustment Disorder"],
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
  templates: [],
  defaultTemplateId: "",
  diagnoses: [],
  userId: "",
  copyResetTimers: new Map(),
};

const elements = {
  form: document.querySelector("#note-form"),
  formView: document.querySelector("#form-view"),
  loadingView: document.querySelector("#loading-view"),
  noteView: document.querySelector("#note-view"),
  loadDemo: document.querySelector("#load-demo"),
  clearForm: document.querySelector("#clear-form"),
  openSettings: document.querySelector("#open-settings"),
  settingsOverlay: document.querySelector("#settings-overlay"),
  settingsClose: document.querySelector("#settings-close"),
  requestData: document.querySelector("#request-data"),
  deleteData: document.querySelector("#delete-data"),
  settingsMessage: document.querySelector("#settings-message"),
  baaLink: document.querySelector("#baa-link"),
  generateCaption: document.querySelector("#generate-caption"),
  formMessage: document.querySelector("#form-message"),
  loadingTitle: document.querySelector("#loading-title"),
  noteTitle: document.querySelector("#note-title"),
  noteMetadata: document.querySelector("#note-metadata"),
  noteDiagnosis: document.querySelector("#note-diagnosis"),
  noteSections: document.querySelector("#note-sections"),
  copyStatus: document.querySelector("#copy-status"),
  riskDetailsField: document.querySelector("#risk-details-field"),
  generateButton: document.querySelector("#generate-button"),
  attestCheckbox: document.querySelector("#attest-checkbox"),
  copyNote: document.querySelector("#copy-note"),
  regenerateNote: document.querySelector("#regenerate-note"),
  newNote: document.querySelector("#new-note"),
  finalizePurge: document.querySelector("#finalize-purge"),
  backToForm: document.querySelector("#back-to-form"),
  noteCardTemplate: document.querySelector("#note-card-template"),
  feedbackPanel: document.querySelector("#feedback-panel"),
  feedbackButtons: Array.from(document.querySelectorAll("[data-feedback-rating]")),
  feedbackNotes: document.querySelector("#feedback-notes"),
  submitFeedback: document.querySelector("#submit-feedback"),
  skipFeedback: document.querySelector("#skip-feedback"),
  feedbackMessage: document.querySelector("#feedback-message"),
  noteTemplate: document.querySelector("#note-template"),
  primaryDiagnosisInput: document.querySelector("#primary-diagnosis-input"),
  primaryDiagnosisList: document.querySelector("#primary-diagnosis-list"),
  primaryDiagnosisHidden: document.querySelector('input[name="primary_diagnosis"]'),
  primaryDiagnosisChips: document.querySelector("#primary-diagnosis-chips"),
};

init().catch((error) => {
  console.error(error);
  setInlineMessage(elements.formMessage, "Initialization failed. Refresh and try again.", "error");
});

async function init() {
  state.userId = ensureUserId();
  bindEvents();
  setupValidationUI();
  setDefaultDate();
  await loadTemplates();
  hydrateFromStorage();
  enforceTemplateSelection();
  syncFormatCaption();
  toggleRiskDetails();
  syncFeedbackButtons();
  syncDiagnosisField();
  if (elements.baaLink) elements.baaLink.href = `${BACKEND_URL}/legal/baa`;
}

function bindEvents() {
  const on = (el, event, fn) => el && el.addEventListener(event, fn);
  on(elements.form, "submit", handleGenerate);
  on(elements.attestCheckbox, "change", () => {
    if (elements.generateButton) {
      elements.generateButton.disabled = !elements.attestCheckbox.checked;
    }
  });
  on(elements.loadDemo, "click", loadDemoData);
  on(elements.clearForm, "click", handleClearForm);
  on(elements.copyNote, "click", handleCopyNote);
  on(elements.regenerateNote, "click", handleRegenerate);
  on(elements.newNote, "click", handleNewNote);
  on(elements.backToForm, "click", () => showView("form"));
  on(elements.finalizePurge, "click", handleFinalizePurge);
  on(elements.submitFeedback, "click", handleSubmitFeedback);
  on(elements.skipFeedback, "click", handleSkipFeedback);
  on(elements.openSettings, "click", openSettingsModal);
  on(elements.settingsClose, "click", closeSettingsModal);
  on(elements.requestData, "click", handleRequestData);
  on(elements.deleteData, "click", handleDeleteData);
  on(elements.settingsOverlay, "click", (event) => {
    if (event.target === elements.settingsOverlay) closeSettingsModal();
  });
  on(elements.noteTemplate, "change", () => {
    enforceTemplateSelection();
    persistDraft();
  });

  elements.feedbackButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.feedbackSelection = button.dataset.feedbackRating || "";
      syncFeedbackButtons();
      if (elements.feedbackMessage) clearInlineMessage(elements.feedbackMessage);
    });
  });

  on(elements.form, "change", (event) => {
    if (event.target.name === "note_format") {
      enforceTemplateSelection();
      syncFormatCaption();
    }

    if (event.target.name === "risk_level") {
      toggleRiskDetails();
    }

    clearValidationForTarget(event.target);
    persistDraft();
  });

  on(elements.form, "input", (event) => {
    clearValidationForTarget(event.target);
    persistDraft();
  });

  bindDiagnosisEvents();
}

function bindDiagnosisEvents() {
  if (!elements.primaryDiagnosisInput || !elements.primaryDiagnosisChips) return;

  elements.primaryDiagnosisChips.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-diagnosis]");
    if (removeButton) {
      removeDiagnosis(removeButton.dataset.removeDiagnosis || "");
      return;
    }

    elements.primaryDiagnosisInput.focus();
  });

  elements.primaryDiagnosisInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitDiagnosisInput();
    }
  });

  elements.primaryDiagnosisInput.addEventListener("blur", () => {
    commitDiagnosisInput();
  });
}

function ensureUserId() {
  const existing = localStorage.getItem(STORAGE_KEYS.userId);
  if (existing) return existing;
  const nextValue = createUuid();
  localStorage.setItem(STORAGE_KEYS.userId, nextValue);
  return nextValue;
}

function createUuid() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

async function loadTemplates() {
  let templates = FALLBACK_TEMPLATES;

  try {
    const response = await apiRequest("/api/templates");
    if (Array.isArray(response?.templates) && response.templates.length) {
      templates = response.templates;
    }
  } catch (error) {
    console.error("Template load failed:", error);
  }

  state.templates = templates;
  renderTemplateOptions();
}

function renderTemplateOptions() {
  if (!elements.noteTemplate) return;

  const previousValue = elements.noteTemplate.value;
  elements.noteTemplate.innerHTML = "";

  state.templates.forEach((template) => {
    const option = document.createElement("option");
    option.value = String(template.id);
    option.textContent = template.name;
    option.dataset.templateName = template.name;
    elements.noteTemplate.appendChild(option);
  });

  const defaultTemplate = state.templates.find((template) => template.name === HCC_TEMPLATE_NAME) || state.templates[0];
  state.defaultTemplateId = defaultTemplate ? String(defaultTemplate.id) : "";

  if (previousValue && state.templates.some((template) => String(template.id) === previousValue)) {
    elements.noteTemplate.value = previousValue;
  } else if (state.defaultTemplateId) {
    elements.noteTemplate.value = state.defaultTemplateId;
  }
}

function hydrateFromStorage() {
  const savedDraft = safelyParseJSON(localStorage.getItem(STORAGE_KEYS.draft));
  if (savedDraft) {
    applyFormData(savedDraft);
  } else {
    applyDefaultTemplateSelection();
  }

  const savedNote = safelyParseJSON(localStorage.getItem(STORAGE_KEYS.note));
  if (savedNote && savedNote.request && savedNote.response && savedNote.noteId) {
    state.latestRequest = savedNote.request;
    state.generatedNote = normalizeSavedNote(savedNote.response);
    state.currentNoteId = savedNote.noteId;
    state.feedbackSubmitted = Boolean(savedNote.feedbackSubmitted);
    state.feedbackPending = Boolean(savedNote.feedbackPending);
    renderGeneratedNote(state.generatedNote);
    updateFeedbackVisibility(state.feedbackPending);
    showView("note");
  }
}

function normalizeSavedNote(note) {
  return {
    format: note.format,
    templateName: note.templateName || note.template_name || note.metadata?.template_name || "",
    metadata: note.metadata,
    sections: Array.isArray(note.sections) ? note.sections : [],
  };
}

function handleClearForm() {
  resetFormToDefaults();
}

function loadDemoData() {
  DEMO_DATA.session_date = formatDateForInput(new Date());
  applyFormData(DEMO_DATA);
  enforceTemplateSelection();
  toggleRiskDetails();
  persistDraft();
  clearAllValidationErrors();
  setInlineMessage(elements.formMessage, "Demo session loaded.", "success");
}

function applyFormData(data) {
  const nextData = { ...data };
  const selectedTemplate = resolveTemplateValue(nextData.note_template_id, nextData.note_template_name);
  if (selectedTemplate) {
    elements.noteTemplate.value = String(selectedTemplate.id);
  } else {
    applyDefaultTemplateSelection();
  }

  Object.entries(nextData).forEach(([key, value]) => {
    if (key === "interventions_checked" && Array.isArray(value)) {
      const checkboxes = elements.form.querySelectorAll('input[name="interventions_checked"]');
      checkboxes.forEach((checkbox) => {
        checkbox.checked = value.includes(checkbox.value);
      });
      return;
    }

    if (key === "primary_diagnosis") {
      setDiagnoses(value);
      return;
    }

    if (key === "note_template_id" || key === "note_template_name") {
      return;
    }

    const field = elements.form.elements[key];
    if (!field) return;

    if (field instanceof RadioNodeList) {
      field.value = value;
      syncCheckedValue(key, value);
      return;
    }

    field.value = value;
  });

  enforceTemplateSelection();
  syncDiagnosisField();
}

function resolveTemplateValue(templateId, templateName) {
  if (templateId && state.templates.some((template) => String(template.id) === String(templateId))) {
    return state.templates.find((template) => String(template.id) === String(templateId));
  }

  if (templateName) {
    return state.templates.find((template) => template.name === templateName) || null;
  }

  return null;
}

function applyDefaultTemplateSelection() {
  if (elements.noteTemplate && state.defaultTemplateId) {
    elements.noteTemplate.value = state.defaultTemplateId;
  }
}

function setDiagnoses(value) {
  state.diagnoses = normalizeDiagnoses(value);
  renderDiagnosisChips();
  syncDiagnosisField();
  clearFieldError("primary_diagnosis");
}

function normalizeDiagnoses(value) {
  const rawValues = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return rawValues
    .map((item) => String(item).trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index);
}

function renderDiagnosisChips() {
  if (!elements.primaryDiagnosisList) return;
  elements.primaryDiagnosisList.innerHTML = "";

  state.diagnoses.forEach((diagnosis) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `
      <span>${escapeHtml(diagnosis)}</span>
      <button type="button" class="chip-remove" data-remove-diagnosis="${escapeAttribute(diagnosis)}" aria-label="Remove ${escapeAttribute(diagnosis)}">×</button>
    `;
    elements.primaryDiagnosisList.appendChild(chip);
  });
}

function syncDiagnosisField() {
  if (elements.primaryDiagnosisHidden) {
    elements.primaryDiagnosisHidden.value = JSON.stringify(state.diagnoses);
  }
}

function commitDiagnosisInput() {
  if (!elements.primaryDiagnosisInput) return;
  const nextValue = elements.primaryDiagnosisInput.value.trim().replace(/,+$/, "");
  if (!nextValue) {
    elements.primaryDiagnosisInput.value = "";
    return;
  }

  setDiagnoses([...state.diagnoses, nextValue]);
  elements.primaryDiagnosisInput.value = "";
  persistDraft();
}

function removeDiagnosis(diagnosis) {
  setDiagnoses(state.diagnoses.filter((item) => item !== diagnosis));
  persistDraft();
}

function syncCheckedValue(name, value) {
  const candidates = elements.form.querySelectorAll(`[name="${name}"]`);
  candidates.forEach((input) => {
    input.checked = input.value === value;
  });
}

function collectFormData() {
  const formData = new FormData(elements.form);
  const selectedTemplate = getSelectedTemplate();
  const payload = {
    client_name: formData.get("client_name")?.trim() || "",
    session_number: formData.get("session_number")?.trim() || "",
    session_date: formData.get("session_date") || "",
    duration_minutes: formData.get("duration_minutes") || "50",
    session_type: formData.get("session_type") || "Individual",
    note_format: formData.get("note_format") || "SOAP",
    note_template_id: selectedTemplate ? Number(selectedTemplate.id) : null,
    note_template_name: selectedTemplate?.name || "",
    primary_diagnosis: [...state.diagnoses],
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
  clearAllValidationErrors();
  let firstInvalid = null;

  REQUIRED_FIELDS.forEach((fieldConfig) => {
    const value = payload[fieldConfig.key];
    if (value) return;
    showFieldError(fieldConfig.key, `${fieldConfig.label} is required.`);
    firstInvalid ||= fieldConfig.key;
  });

  if (!payload.interventions_checked.length) {
    setInlineMessage(elements.formMessage, "Select at least one intervention or enter one in the Other field.", "error");
    firstInvalid ||= "interventions_description";
  }

  if (
    (payload.risk_level.startsWith("Moderate") || payload.risk_level.startsWith("High")) &&
    !payload.risk_details
  ) {
    showFieldError("risk_details", "Risk details are required for moderate or high risk sessions.");
    firstInvalid ||= "risk_details";
  }

  if (firstInvalid) {
    focusField(firstInvalid);
    return "Please correct the highlighted fields.";
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
    if (!elements.formMessage.textContent) {
      setInlineMessage(elements.formMessage, validationMessage, "error");
    }
    return;
  }

  state.latestRequest = payload;
  persistDraft();
  showLoading(payload.note_template_name || payload.note_format);

  try {
    const response = await apiRequest("/api/generate-note", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    state.currentNoteId = response.note_id;
    state.generatedNote = {
      format: response.format,
      templateName: response.template_name || payload.note_template_name,
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

function showLoading(label) {
  elements.loadingTitle.textContent = `Generating your ${label} note...`;
  showView("loading");
}

function renderGeneratedNote(note) {
  const title = note.templateName || `${note.format} Progress Note`;
  const metadataParts = [
    note.metadata.client_name ? `Client: ${note.metadata.client_name}` : "",
    note.metadata.session_number ? `Session #${note.metadata.session_number}` : "",
    note.metadata.session_date ? formatDateLong(note.metadata.session_date) : "",
    note.metadata.duration_minutes ? `${note.metadata.duration_minutes} min` : "",
    note.metadata.session_type || "",
  ].filter(Boolean);

  elements.noteTitle.textContent = title;
  elements.noteMetadata.textContent = metadataParts.join("  |  ");
  elements.noteDiagnosis.textContent = `Diagnoses: ${note.metadata.diagnosis} · Modality: ${note.metadata.modality || "Not specified"}`;

  elements.noteSections.innerHTML = "";
  note.sections.forEach((section, index) => {
    const fragment = elements.noteCardTemplate.content.cloneNode(true);
    const label = fragment.querySelector(".note-card-label");
    const titleEl = fragment.querySelector(".note-card-title");
    const status = fragment.querySelector(".section-status");
    const content = fragment.querySelector(".note-card-content");
    const sectionCopy = fragment.querySelector(".section-copy");
    const editToggle = fragment.querySelector(".edit-toggle");
    const editPanel = fragment.querySelector(".edit-panel");
    const textarea = fragment.querySelector("textarea");
    const saveEdit = fragment.querySelector(".save-edit");
    const cancelEdit = fragment.querySelector(".cancel-edit");
    const cardMessage = fragment.querySelector(".section-message");

    label.textContent = `${section.short} — ${section.title}`;
    titleEl.textContent = section.title;
    status.textContent = section.edited ? "Edited" : "Unedited";
    status.classList.toggle("edited", section.edited);
    content.textContent = section.content;
    textarea.value = section.content;

    sectionCopy.addEventListener("click", async () => {
      const timerKey = `${section.key}-${index}`;
      try {
        await navigator.clipboard.writeText(section.content);
        sectionCopy.textContent = "Copied!";
        window.clearTimeout(state.copyResetTimers.get(timerKey));
        state.copyResetTimers.set(
          timerKey,
          window.setTimeout(() => {
            sectionCopy.textContent = "Copy";
            state.copyResetTimers.delete(timerKey);
          }, 2000),
        );
      } catch (error) {
        console.error(error);
        setInlineMessage(cardMessage, "Section copy failed.", "error");
      }
    });

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
      if (!nextValue || !state.generatedNote || !state.currentNoteId) return;

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

    elements.noteSections.appendChild(fragment);
  });
}

async function handleCopyNote() {
  if (!state.generatedNote || !state.currentNoteId) return;

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
  showLoading(state.latestRequest.note_template_name || state.latestRequest.note_format);

  try {
    const response = await apiRequest("/api/generate-note", {
      method: "POST",
      body: JSON.stringify(state.latestRequest),
    });

    state.currentNoteId = response.note_id;
    state.generatedNote = {
      format: response.format,
      templateName: response.template_name || state.latestRequest.note_template_name,
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
  resetGeneratedState();
  resetFormToDefaults();
  showView("form");
}

async function handleFinalizePurge() {
  if (state.currentNoteId) {
    try {
      await apiRequest(`/api/notes/${state.currentNoteId}/purge`, { method: "DELETE" });
    } catch (error) {
      console.error("Purge failed:", error);
    }
  }

  resetGeneratedState();
  resetFormToDefaults();
  showView("form");
}

function resetGeneratedState() {
  state.generatedNote = null;
  state.currentNoteId = null;
  state.latestRequest = null;
  state.feedbackSubmitted = false;
  state.feedbackPending = false;
  resetFeedbackState();
  localStorage.removeItem(STORAGE_KEYS.note);
  elements.noteSections.innerHTML = "";
  clearInlineMessage(elements.copyStatus);
}

function resetFormToDefaults() {
  elements.form.reset();
  setDiagnoses([]);
  setDefaultDate();
  applyDefaultTemplateSelection();
  elements.form.elements.duration_minutes.value = "50";
  elements.form.elements.session_type.value = "Individual";
  elements.form.elements.treatment_modality.value = "CBT";
  elements.form.elements.note_format.value = "SOAP";
  elements.form.elements.progress.value = "Some progress";
  elements.form.elements.risk_level.value = "No risk indicators";
  syncCheckedValue("note_format", "SOAP");
  syncCheckedValue("progress", "Some progress");
  syncCheckedValue("risk_level", "No risk indicators");
  if (elements.primaryDiagnosisInput) elements.primaryDiagnosisInput.value = "";
  if (elements.attestCheckbox) elements.attestCheckbox.checked = false;
  if (elements.generateButton) elements.generateButton.disabled = true;
  clearInlineMessage(elements.formMessage);
  clearAllValidationErrors();
  toggleRiskDetails();
  enforceTemplateSelection();
  syncFormatCaption();
  localStorage.removeItem(STORAGE_KEYS.draft);
}

async function handleSubmitFeedback() {
  if (!state.currentNoteId) return;

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

function openSettingsModal() {
  if (elements.settingsOverlay) elements.settingsOverlay.classList.remove("is-hidden");
  if (elements.settingsMessage) clearInlineMessage(elements.settingsMessage);
}

function closeSettingsModal() {
  if (elements.settingsOverlay) elements.settingsOverlay.classList.add("is-hidden");
}

async function handleRequestData() {
  if (elements.requestData) elements.requestData.disabled = true;
  setInlineMessage(elements.settingsMessage, "Preparing your data export…", "success");

  try {
    const data = await apiRequest("/api/user/data");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `clarity-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setInlineMessage(elements.settingsMessage, "Download started.", "success");
  } catch (error) {
    console.error(error);
    setInlineMessage(elements.settingsMessage, error.message || "Export failed. Try again.", "error");
  } finally {
    if (elements.requestData) elements.requestData.disabled = false;
  }
}

async function handleDeleteData() {
  const confirmed = window.confirm(
    "Are you sure? This will permanently delete all your Clarity data and cannot be undone.",
  );
  if (!confirmed) return;

  if (elements.deleteData) elements.deleteData.disabled = true;
  setInlineMessage(elements.settingsMessage, "Deleting all data…", "success");

  try {
    const result = await apiRequest("/api/user/data", { method: "DELETE" });
    const count = result.records_deleted ?? 0;
    setInlineMessage(
      elements.settingsMessage,
      `Done. ${count} session record${count !== 1 ? "s" : ""} permanently deleted.`,
      "success",
    );
    resetGeneratedState();
    resetFormToDefaults();
    showView("form");
  } catch (error) {
    console.error(error);
    setInlineMessage(elements.settingsMessage, error.message || "Deletion failed. Try again.", "error");
  } finally {
    if (elements.deleteData) elements.deleteData.disabled = false;
  }
}

function buildClipboardOutput(note) {
  const lines = [
    "PROGRESS NOTE - DRAFT",
    `Client: ${note.metadata.client_name}`,
    `Session #${note.metadata.session_number || ""} | ${note.metadata.session_date ? formatDateLong(note.metadata.session_date) : ""} | ${note.metadata.duration_minutes || ""} minutes | ${note.metadata.session_type || ""}`,
    `Diagnoses: ${note.metadata.diagnosis}`,
    `Modality: ${note.metadata.modality || "Not specified"}`,
  ];

  if (note.templateName) {
    lines.push(`Template: ${note.templateName}`);
  }

  lines.push("");

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
    clearFieldError("risk_details");
  }
}

function enforceTemplateSelection() {
  const selectedTemplate = getSelectedTemplate();
  if (!selectedTemplate) return;

  if (selectedTemplate.name === HCC_TEMPLATE_NAME) {
    elements.form.elements.note_format.value = "SOAP";
    syncCheckedValue("note_format", "SOAP");
  }

  syncFormatCaption();
}

function getSelectedTemplate() {
  if (!elements.noteTemplate) return null;
  return state.templates.find((template) => String(template.id) === elements.noteTemplate.value) || null;
}

function syncFormatCaption() {
  const format = elements.form.elements.note_format.value || "SOAP";
  const template = getSelectedTemplate();
  const templateLabel = template?.name || HCC_TEMPLATE_NAME;
  elements.generateCaption.textContent = `Template: ${templateLabel} · Note format: ${format} · Estimated generation time: 15-20 seconds`;
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
  if (!state.generatedNote || !state.latestRequest || !state.currentNoteId) return;

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
      "X-User-Id": state.userId,
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

function setupValidationUI() {
  REQUIRED_FIELDS.forEach(({ key }) => {
    const container = getFieldContainer(key);
    if (!container) return;
    container.dataset.fieldKey = key;
    ensureFieldErrorElement(container);
    decorateRequiredLabel(container);
  });

  const riskDetailsContainer = getFieldContainer("risk_details");
  if (riskDetailsContainer) {
    riskDetailsContainer.dataset.fieldKey = "risk_details";
    ensureFieldErrorElement(riskDetailsContainer);
  }
}

function decorateRequiredLabel(container) {
  const label = container.querySelector(":scope > span, :scope > legend");
  if (!label || label.querySelector(".required-indicator")) return;
  const indicator = document.createElement("span");
  indicator.className = "required-indicator";
  indicator.textContent = " *";
  label.appendChild(indicator);
}

function ensureFieldErrorElement(container) {
  let errorElement = container.querySelector(":scope > .field-error");
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.className = "field-error";
    container.appendChild(errorElement);
  }
  return errorElement;
}

function getFieldContainer(fieldKey) {
  if (fieldKey === "primary_diagnosis") {
    return elements.primaryDiagnosisChips?.closest(".field") || null;
  }

  const field = elements.form?.elements[fieldKey];
  if (!field) return null;
  if (field instanceof RadioNodeList) {
    return elements.form.querySelector(`[name="${fieldKey}"]`)?.closest(".field") || null;
  }
  return field.closest(".field");
}

function getFieldControl(fieldKey) {
  if (fieldKey === "primary_diagnosis") return elements.primaryDiagnosisChips;
  return elements.form?.elements[fieldKey] || null;
}

function showFieldError(fieldKey, message) {
  const container = getFieldContainer(fieldKey);
  const control = getFieldControl(fieldKey);
  if (!container) return;
  container.classList.add("has-error");
  control?.classList?.add("is-invalid");
  ensureFieldErrorElement(container).textContent = message;
}

function clearFieldError(fieldKey) {
  const container = getFieldContainer(fieldKey);
  const control = getFieldControl(fieldKey);
  if (!container) return;
  container.classList.remove("has-error");
  control?.classList?.remove("is-invalid");
  const errorElement = container.querySelector(":scope > .field-error");
  if (errorElement) errorElement.textContent = "";
}

function clearAllValidationErrors() {
  REQUIRED_FIELDS.forEach(({ key }) => clearFieldError(key));
  clearFieldError("risk_details");
}

function clearValidationForTarget(target) {
  if (!target) return;
  const name = target.name;
  if (name) {
    clearFieldError(name);
  }
}

function focusField(fieldKey) {
  const control = getFieldControl(fieldKey);
  const target = control instanceof RadioNodeList ? control[0] : control;
  target?.focus?.();
  target?.scrollIntoView?.({ block: "center", behavior: "smooth" });
}

function setInlineMessage(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("success", "error");
  if (type) element.classList.add(type);
}

function clearInlineMessage(element) {
  setInlineMessage(element, "", "");
}

function safelyParseJSON(value) {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function setDefaultDate() {
  const dateField = elements.form.elements.session_date;
  if (!dateField.value) {
    dateField.value = formatDateForInput(new Date());
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}
