(function (global) {
  const ExamApp = global.ExamApp = global.ExamApp || {};
  const runtime = ExamApp.runtime = ExamApp.runtime || {
    reviewStorageKey: "exam-review:latest"
  };

  function setRuntime(values) {
    Object.assign(runtime, values || {});
    return runtime;
  }

  function getRuntime() {
    return runtime;
  }

  function readReviewSnapshot() {
    const raw = sessionStorage.getItem(runtime.reviewStorageKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (error) {
      sessionStorage.removeItem(runtime.reviewStorageKey);
      return null;
    }
  }

function mergeExamAnswers(examData, answersData) {
  if (!examData || !Array.isArray(examData.questions)) return examData;

  const answerMap = answersData && typeof answersData === "object" && answersData.questions && typeof answersData.questions === "object"
    ? answersData.questions
    : {};

  return {
    ...examData,
    questions: examData.questions.map((question) => ({
      ...question,
      ...(answerMap[question.id] || {})
    }))
  };
}

  function formatReviewSavedAt(value) {
    if (!value) return "--";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";

    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function getAppBasePath() {
    const path = window.location.pathname.replace(/\/+$/, "");

    if (path.endsWith("/bai-thi")) {
      return path.slice(0, -"/bai-thi".length);
    }

    if (path.endsWith("/ket-qua-bai-thi")) {
      return path.slice(0, -"/ket-qua-bai-thi".length);
    }

    return "";
  }

  function buildReviewPageUrl() {
    const basePath = getAppBasePath();
    return `${window.location.origin}${basePath}/ket-qua-bai-thi/`;
  }

  function buildExamPageUrl(questionNumber) {
    const basePath = getAppBasePath();
    const url = new URL(`${window.location.origin}${basePath}/bai-thi/`);

    if (Number.isFinite(questionNumber)) {
      url.searchParams.set("question", String(questionNumber));
    }

    return url.toString();
  }

  function getRequestedQuestionNumber() {
    const value = Number(new URLSearchParams(window.location.search).get("question"));
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  function stopSpokenAudio() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
  }

  function speakAudioPrompt(text) {
    if (!text || !("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function animateAudioButton(button) {
    if (!button) return;
    button.classList.remove("exam-page__audio-button--pulse");
    void button.offsetWidth;
    button.classList.add("exam-page__audio-button--pulse");
  }

  function formatTimer(totalSeconds) {
    const safeSeconds = Math.max(0, totalSeconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(" : ");
  }

  function renderCubeShape(columns) {
    const maxRows = Math.max(...columns.map((column) => Math.max(...column))) + 1;
    const shape = document.createElement("div");
    shape.className = "exam-page__cube-shape";
    shape.style.setProperty("--cols", columns.length);
    shape.style.setProperty("--rows", maxRows);

    columns.forEach((column, colIndex) => {
      column.forEach((rowValue) => {
        const cell = document.createElement("span");
        cell.className = "exam-page__cube";
        cell.style.setProperty("--col", colIndex + 1);
        cell.style.setProperty("--row", maxRows - rowValue);
        shape.appendChild(cell);
      });
    });

    return shape;
  }

  function renderLineFigure(kind, labels) {
    const card = document.createElement("div");
    card.className = "exam-page__line-card d-grid bg-white";

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 180 120");
    svg.setAttribute("class", "exam-page__line-svg");

    const defs = {
      segment_rise: { x1: 36, y1: 82, x2: 146, y2: 72, endpoints: true },
      line_horizontal: { x1: 34, y1: 72, x2: 148, y2: 72, endpoints: false },
      segment_vertical: { x1: 90, y1: 22, x2: 90, y2: 100, endpoints: true },
      line_diagonal: { x1: 58, y1: 26, x2: 120, y2: 98, endpoints: false },
      segment_fall: { x1: 42, y1: 46, x2: 142, y2: 74, endpoints: true }
    };

    const shape = defs[kind];
    if (!shape) return card;

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", shape.x1);
    line.setAttribute("y1", shape.y1);
    line.setAttribute("x2", shape.x2);
    line.setAttribute("y2", shape.y2);
    line.setAttribute("class", "exam-page__line-stroke");
    svg.appendChild(line);

    if (shape.endpoints) {
      [
        [shape.x1, shape.y1],
        [shape.x2, shape.y2]
      ].forEach(([cx, cy]) => {
        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", cx);
        dot.setAttribute("cy", cy);
        dot.setAttribute("r", "2.4");
        dot.setAttribute("class", "exam-page__line-dot");
        svg.appendChild(dot);
      });
    }

    const [firstLabel, secondLabel] = labels;
    const labelOffset = {
      segment_rise: [[-6, -8], [4, -8]],
      line_horizontal: [[-8, -8], [4, -8]],
      segment_vertical: [[8, 0], [8, 2]],
      line_diagonal: [[8, -4], [6, 4]],
      segment_fall: [[6, -6], [6, -2]]
    };

    [[shape.x1, shape.y1, firstLabel], [shape.x2, shape.y2, secondLabel]].forEach(([x, y, text], index) => {
      const label = document.createElementNS(svgNS, "text");
      const [dx, dy] = labelOffset[kind][index];
      label.setAttribute("x", x + dx);
      label.setAttribute("y", y + dy);
      label.setAttribute("class", "exam-page__line-label");
      label.textContent = text;
      svg.appendChild(label);
    });

    card.appendChild(svg);
    return card;
  }

  function saveReviewSnapshot() {
    const answeredCount = Object.values(runtime.responses).filter((state) => {
      if (!state) return false;

      if (Array.isArray(state.selectedOptions) && state.selectedOptions.length > 0) {
        return true;
      }

      if (state.selectedLeft !== null) {
        return true;
      }

      if (state.pairs && Object.keys(state.pairs).length > 0) {
        return true;
      }

      if (state.classifyPlacements && Object.keys(state.classifyPlacements).length > 0) {
        return true;
      }

      if (Array.isArray(state.sortOrder) && state.sortOrder.length > 0) {
        return true;
      }

      if (Array.isArray(state.fillBlankAnswers) && state.fillBlankAnswers.some((value) => String(value || "").trim() !== "")) {
        return true;
      }

      return false;
    }).length;

    sessionStorage.setItem(runtime.reviewStorageKey, JSON.stringify({
      examTitle: runtime.exam.header?.title || "",
      answeredCount,
      totalQuestions: runtime.questions.length,
      savedAt: new Date().toISOString(),
      questions: runtime.questions,
      responses: runtime.responses
    }));
  }

  function getTimerDuration() {
    const configuredDuration = Number(runtime.exam.timer?.duration_seconds);
    if (Number.isFinite(configuredDuration) && configuredDuration > 0) {
      return configuredDuration;
    }

    const rawValue = String(runtime.exam.timer?.value || "00 : 30 : 00");
    const parts = rawValue.split(":").map((part) => Number(part.trim()));

    if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
      return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }

    return 1800;
  }

  function showSubmitModal() {
    if (!runtime.submitModalEl || typeof global.bootstrap === "undefined") return;
    global.bootstrap.Modal.getOrCreateInstance(runtime.submitModalEl).show();
  }

  function stopTimer() {
    if (runtime.timerInterval) {
      global.clearInterval(runtime.timerInterval);
      runtime.timerInterval = null;
    }
  }

  function updateTimerDisplay(remainingSeconds) {
    if (!runtime.timerEl) return;
    runtime.timerEl.textContent = formatTimer(remainingSeconds);
  }

  function handleTimerExpired() {
    stopTimer();
    sessionStorage.removeItem(runtime.storageKey);
    updateTimerDisplay(0);

    if (!runtime.autoSubmitShown) {
      runtime.autoSubmitShown = true;
      showSubmitModal();
    }
  }

  function startTimer() {
    if (!runtime.timerEl) return;

    const durationSeconds = getTimerDuration();
    let deadline = Number(sessionStorage.getItem(runtime.storageKey));

    if (!Number.isFinite(deadline) || deadline <= Date.now()) {
      deadline = Date.now() + (durationSeconds * 1000);
      sessionStorage.setItem(runtime.storageKey, String(deadline));
    }

    const tick = function () {
      if (runtime.examResult && !runtime.examResult.hidden) {
        stopTimer();
        return;
      }

      const remainingSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      updateTimerDisplay(remainingSeconds);

      if (remainingSeconds <= 0) {
        handleTimerExpired();
      }
    };

    tick();

    if (!runtime.timerInterval) {
      runtime.timerInterval = global.setInterval(tick, 1000);
    }
  }

  function getQuestionState(questionId) {
    if (!runtime.responses[questionId]) {
      runtime.responses[questionId] = {
        selectedLeft: null,
        pairs: {},
        classifyPlacements: {},
        sortOrder: null,
        selectedOptions: [],
        fillBlankAnswers: []
      };
    }

    if (!Array.isArray(runtime.responses[questionId].selectedOptions)) {
      runtime.responses[questionId].selectedOptions = [];
    }

    if (!Array.isArray(runtime.responses[questionId].fillBlankAnswers)) {
      runtime.responses[questionId].fillBlankAnswers = [];
    }

    return runtime.responses[questionId];
  }

  function renderQuestion(question) {
    stopSpokenAudio();
    runtime.questionIndexEl.textContent = `Câu hỏi ${question.number}`;
    runtime.questionPromptEl.textContent = question.prompt;
    runtime.questionAuxEl.style.display = "none";
    runtime.pagerCurrentEl.textContent = question.number;

    if (question.type === "single_choice") {
      ExamApp.renderMultiplicationVisual(question);
      ExamApp.renderSingleChoiceOptions(question);
    }

    if (question.type === "image_choice") {
      ExamApp.renderImageChoiceVisual(question);
      ExamApp.renderImageChoiceOptions(question);
    }

    if (question.type === "fill_blank") {
      ExamApp.renderFillBlankQuestion(question);
    }

    if (question.type === "matching") {
      ExamApp.renderMatchingQuestion(question);
    }

    if (question.type === "classify_lines") {
      ExamApp.renderClassifyLinesQuestion(question);
    }

    if (question.type === "sort_numbers") {
      ExamApp.renderSortNumbersQuestion(question);
    }

    if (question.type === "animal_choice") {
      ExamApp.renderAnimalChoiceQuestion(question);
    }

    if (question.type === "audio_choice") {
      ExamApp.renderAudioChoiceQuestion(question);
    }

    runtime.chipButtons.forEach((button) => {
      const chipNumber = Number(button.dataset.questionChip);
      button.classList.toggle("exam-page__question-chip--current", chipNumber === question.number);
    });

    runtime.prevButton.disabled = runtime.currentIndex === 0;
    runtime.prevButton.classList.toggle("exam-page__pager-button--muted", runtime.currentIndex === 0);
    runtime.nextButton.disabled = runtime.currentIndex === runtime.questions.length - 1;
    runtime.nextButton.classList.toggle("exam-page__pager-button--muted", runtime.currentIndex === runtime.questions.length - 1);
  }

  function bindEvents() {
    runtime.prevButton.addEventListener("click", function () {
      if (runtime.currentIndex === 0) return;
      runtime.currentIndex -= 1;
      renderQuestion(runtime.questions[runtime.currentIndex]);
    });

    runtime.nextButton.addEventListener("click", function () {
      if (runtime.currentIndex >= runtime.questions.length - 1) return;
      runtime.currentIndex += 1;
      renderQuestion(runtime.questions[runtime.currentIndex]);
    });

    runtime.chipButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const chipNumber = Number(button.dataset.questionChip);
        const targetIndex = runtime.questions.findIndex((question) => question.number === chipNumber);
        if (targetIndex === -1) return;
        runtime.currentIndex = targetIndex;
        renderQuestion(runtime.questions[runtime.currentIndex]);
      });
    });

    global.addEventListener("resize", function () {
      const question = runtime.questions[runtime.currentIndex];
      if (question && question.type === "matching") {
        renderQuestion(question);
      }
    });

    if (runtime.submitConfirmButton && runtime.examHeader && runtime.examMain && runtime.examResult) {
      runtime.submitConfirmButton.addEventListener("click", function () {
        stopTimer();
        saveReviewSnapshot();
        sessionStorage.removeItem(runtime.storageKey);
        runtime.examHeader.hidden = true;
        runtime.examMain.hidden = true;
        runtime.examResult.hidden = false;
        global.scrollTo({ top: 0, behavior: "auto" });
      });
    }

    if (runtime.resultViewButton) {
      runtime.resultViewButton.addEventListener("click", function () {
        saveReviewSnapshot();
        global.location.href = buildReviewPageUrl();
      });
    }

    if (runtime.resultFinishButton) {
      runtime.resultFinishButton.addEventListener("click", function () {
        sessionStorage.removeItem(runtime.storageKey);
        global.location.href = "/tracnghiem/vao-thi-trang-nguyen-2023/";
      });
    }
  }

  function initExamApp() {
    const dataNode = document.getElementById("exam-data");
    const answersNode = document.getElementById("exam-answers");
    const app = document.querySelector("[data-exam-app]");
    const reviewRoot = document.querySelector("[data-exam-review-root]");

    setRuntime({
      dataNode,
      answersNode,
      app,
      reviewRoot,
      reviewStorageKey: runtime.reviewStorageKey || "exam-review:latest"
    });

    if ((!dataNode || !app) && reviewRoot) {
      if (typeof ExamApp.renderReviewPage === "function") {
        ExamApp.renderReviewPage();
      }
      return;
    }

    if (!dataNode || !app) return;

    const examData = JSON.parse(dataNode.textContent);
    const answersData = answersNode ? JSON.parse(answersNode.textContent) : null;
    const exam = mergeExamAnswers(examData, answersData);
    const questions = exam.questions || [];
    if (!questions.length) return;

    let currentIndex = 0;
    const responses = {};
    const savedReviewSnapshot = readReviewSnapshot();
    const requestedQuestionNumber = getRequestedQuestionNumber();

    if (savedReviewSnapshot?.examTitle === (exam.header?.title || "")
      && savedReviewSnapshot.responses
      && typeof savedReviewSnapshot.responses === "object") {
      Object.assign(responses, savedReviewSnapshot.responses);
    }

    if (requestedQuestionNumber !== null) {
      const requestedIndex = questions.findIndex((question) => question.number === requestedQuestionNumber);
      if (requestedIndex !== -1) {
        currentIndex = requestedIndex;
      }
    }

    setRuntime({
      exam,
      questions,
      responses,
      currentIndex,
      questionIndexEl: app.querySelector("[data-question-index]"),
      questionPromptEl: app.querySelector("[data-question-prompt]"),
      questionAuxEl: app.querySelector("[data-question-aux]"),
      visualEl: app.querySelector("[data-question-visual]"),
      optionsEl: app.querySelector("[data-question-options]"),
      pagerCurrentEl: document.querySelector("[data-pager-current]"),
      prevButton: document.querySelector("[data-pager-prev]"),
      nextButton: document.querySelector("[data-pager-next]"),
      chipButtons: Array.from(document.querySelectorAll("[data-question-chip]")),
      timerEl: document.querySelector("[data-exam-timer]"),
      examHeader: document.querySelector("[data-exam-header]"),
      examMain: document.querySelector("[data-exam-main]"),
      submitModalEl: document.getElementById("examSubmitModal"),
      submitConfirmButton: document.querySelector("[data-exam-submit-confirm]"),
      examResult: document.querySelector("[data-exam-result]"),
      resultFinishButton: document.querySelector(".exam-result__finish"),
      resultViewButton: document.querySelector(".exam-result__view-results"),
      storageKey: `exam-deadline:${exam.header?.title || "default"}`,
      timerInterval: null,
      autoSubmitShown: false,
      activeClassifyPointerDrag: null,
      activeSortPointerDrag: null
    });

    bindEvents();
    startTimer();
    renderQuestion(questions[runtime.currentIndex]);
  }

  ExamApp.setRuntime = setRuntime;
  ExamApp.getRuntime = getRuntime;
  ExamApp.readReviewSnapshot = readReviewSnapshot;
  ExamApp.mergeExamAnswers = mergeExamAnswers;
  ExamApp.formatReviewSavedAt = formatReviewSavedAt;
  ExamApp.getAppBasePath = getAppBasePath;
  ExamApp.buildReviewPageUrl = buildReviewPageUrl;
  ExamApp.buildExamPageUrl = buildExamPageUrl;
  ExamApp.getRequestedQuestionNumber = getRequestedQuestionNumber;
  ExamApp.saveReviewSnapshot = saveReviewSnapshot;
  ExamApp.stopSpokenAudio = stopSpokenAudio;
  ExamApp.speakAudioPrompt = speakAudioPrompt;
  ExamApp.animateAudioButton = animateAudioButton;
  ExamApp.formatTimer = formatTimer;
  ExamApp.getTimerDuration = getTimerDuration;
  ExamApp.showSubmitModal = showSubmitModal;
  ExamApp.stopTimer = stopTimer;
  ExamApp.updateTimerDisplay = updateTimerDisplay;
  ExamApp.handleTimerExpired = handleTimerExpired;
  ExamApp.startTimer = startTimer;
  ExamApp.getQuestionState = getQuestionState;
  ExamApp.renderCubeShape = renderCubeShape;
  ExamApp.renderLineFigure = renderLineFigure;
  ExamApp.renderQuestion = renderQuestion;
  ExamApp.bootstrap = initExamApp;
})(window);
