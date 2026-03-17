(function () {
  const dataNode = document.getElementById("exam-data");
  const app = document.querySelector("[data-exam-app]");
  if (!dataNode || !app) return;

  const exam = JSON.parse(dataNode.textContent);
  const questions = exam.questions || [];
  if (!questions.length) return;

  let currentIndex = 0;
  const responses = {};

  const questionIndexEl = app.querySelector("[data-question-index]");
  const questionPromptEl = app.querySelector("[data-question-prompt]");
  const questionAuxEl = app.querySelector("[data-question-aux]");
  const visualEl = app.querySelector("[data-question-visual]");
  const optionsEl = app.querySelector("[data-question-options]");
  const pagerCurrentEl = document.querySelector("[data-pager-current]");
  const prevButton = document.querySelector("[data-pager-prev]");
  const nextButton = document.querySelector("[data-pager-next]");
  const chipButtons = Array.from(document.querySelectorAll("[data-question-chip]"));
  const timerEl = document.querySelector("[data-exam-timer]");
  const examHeader = document.querySelector("[data-exam-header]");
  const examMain = document.querySelector("[data-exam-main]");
  const submitModalEl = document.getElementById("examSubmitModal");
  const submitConfirmButton = document.querySelector("[data-exam-submit-confirm]");
  const examResult = document.querySelector("[data-exam-result]");
  const resultFinishButton = document.querySelector(".exam-result__finish");
  const storageKey = `exam-deadline:${exam.header?.title || "default"}`;
  let timerInterval = null;
  let autoSubmitShown = false;

  function formatTimer(totalSeconds) {
    const safeSeconds = Math.max(0, totalSeconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(" : ");
  }

  function getTimerDuration() {
    const configuredDuration = Number(exam.timer?.duration_seconds);
    if (Number.isFinite(configuredDuration) && configuredDuration > 0) {
      return configuredDuration;
    }

    const rawValue = String(exam.timer?.value || "00 : 30 : 00");
    const parts = rawValue.split(":").map((part) => Number(part.trim()));

    if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
      return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }

    return 1800;
  }

  function showSubmitModal() {
    if (!submitModalEl || typeof bootstrap === "undefined") return;
    bootstrap.Modal.getOrCreateInstance(submitModalEl).show();
  }

  function stopTimer() {
    if (timerInterval) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimerDisplay(remainingSeconds) {
    if (!timerEl) return;
    timerEl.textContent = formatTimer(remainingSeconds);
  }

  function handleTimerExpired() {
    stopTimer();
    sessionStorage.removeItem(storageKey);
    updateTimerDisplay(0);

    if (!autoSubmitShown) {
      autoSubmitShown = true;
      showSubmitModal();
    }
  }

  function startTimer() {
    if (!timerEl) return;

    const durationSeconds = getTimerDuration();
    let deadline = Number(sessionStorage.getItem(storageKey));

    if (!Number.isFinite(deadline) || deadline <= Date.now()) {
      deadline = Date.now() + (durationSeconds * 1000);
      sessionStorage.setItem(storageKey, String(deadline));
    }

    const tick = function () {
      if (examResult && !examResult.hidden) {
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

    if (!timerInterval) {
      timerInterval = window.setInterval(tick, 1000);
    }
  }

  function getQuestionState(questionId) {
    if (!responses[questionId]) {
      responses[questionId] = {
        selectedLeft: null,
        pairs: {},
        classifyPlacements: {},
        sortOrder: null,
        selectedOptions: []
      };
    }

    if (!Array.isArray(responses[questionId].selectedOptions)) {
      responses[questionId].selectedOptions = [];
    }

    return responses[questionId];
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

  function renderMultiplicationVisual(question) {
    visualEl.className = "exam-page__visual";
    visualEl.innerHTML = "";

    const groups = document.createElement("div");
    groups.className = "exam-page__visual-groups d-flex flex-wrap justify-content-center";

    for (let group = 0; group < question.visual.group_count; group += 1) {
      const groupEl = document.createElement("div");
      groupEl.className = "exam-page__visual-group d-inline-flex";

      for (let item = 0; item < question.visual.item_count; item += 1) {
        const itemEl = document.createElement("span");
        itemEl.className = "exam-page__visual-item";
        itemEl.textContent = "🍉";
        groupEl.appendChild(itemEl);
      }

      groups.appendChild(groupEl);
    }

    const formula = document.createElement("div");
    formula.className = "exam-page__formula d-inline-flex align-items-center";
    formula.setAttribute("aria-hidden", "true");
    formula.innerHTML = `
      <span class="exam-page__formula-box"></span>
      <span class="exam-page__formula-sign">×</span>
      <span class="exam-page__formula-box"></span>
      <span class="exam-page__formula-sign">=</span>
      <span class="exam-page__formula-box"></span>
    `;

    visualEl.append(groups, formula);
  }

  function renderImageChoiceVisual(question) {
    visualEl.className = "exam-page__visual exam-page__visual--image-choice";
    visualEl.innerHTML = "";

    const intro = document.createElement("p");
    intro.className = "exam-page__question-note";
    intro.textContent = question.intro;
    visualEl.appendChild(intro);

    const sources = document.createElement("div");
    sources.className = "exam-page__source-shapes d-flex justify-content-center";

    question.source_shapes.forEach((shapeData) => {
      const frame = document.createElement("div");
      frame.className = "exam-page__source-shape d-grid";
      frame.appendChild(renderCubeShape(shapeData.columns));
      sources.appendChild(frame);
    });

    visualEl.appendChild(sources);

    const prompt = document.createElement("p");
    prompt.className = "exam-page__question-note exam-page__question-note--secondary";
    prompt.textContent = question.question_text;
    visualEl.appendChild(prompt);
  }

  function renderSingleChoiceOptions(question) {
    optionsEl.className = "exam-page__options d-grid";
    optionsEl.setAttribute("role", "radiogroup");
    optionsEl.innerHTML = "";

    question.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      label.className = "exam-page__option position-relative d-flex align-items-center bg-transparent border-0 text-start";
      label.htmlFor = `question-${question.number}-option-${optionIndex + 1}`;
      label.innerHTML = `
        <input class="exam-page__option-input" type="radio" name="question-${question.number}" id="question-${question.number}-option-${optionIndex + 1}">
        <span class="exam-page__option-radio" aria-hidden="true"></span>
        <span class="exam-page__option-key">${option.key}</span>
        <span class="exam-page__option-text">${option.text}</span>
      `;
      optionsEl.appendChild(label);
    });
  }

  function renderImageChoiceOptions(question) {
    optionsEl.className = "exam-page__options exam-page__options--image-choice d-grid";
    optionsEl.setAttribute("role", "radiogroup");
    optionsEl.innerHTML = "";

    question.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      label.className = "exam-page__image-option position-relative d-grid align-items-center";
      label.htmlFor = `question-${question.number}-option-${optionIndex + 1}`;

      const input = document.createElement("input");
      input.className = "exam-page__option-input";
      input.type = "radio";
      input.name = `question-${question.number}`;
      input.id = `question-${question.number}-option-${optionIndex + 1}`;

      const radio = document.createElement("span");
      radio.className = "exam-page__option-radio";
      radio.setAttribute("aria-hidden", "true");

      const key = document.createElement("span");
      key.className = "exam-page__image-option-key";
      key.textContent = option.key;

      const visual = document.createElement("div");
      visual.className = "exam-page__image-option-visual d-flex align-items-center";
      visual.appendChild(renderCubeShape(option.shape.columns));

      label.append(input, radio, key, visual);
      optionsEl.appendChild(label);
    });
  }

  function renderFillBlankQuestion(question) {
    visualEl.className = "exam-page__visual exam-page__visual--fill-blank";
    visualEl.innerHTML = "";

    const intro = document.createElement("p");
    intro.className = "exam-page__question-note exam-page__question-note--fill-intro";
    intro.textContent = question.intro;
    visualEl.appendChild(intro);

    const list = document.createElement("div");
    list.className = "exam-page__fill-list d-grid";

    question.blanks.forEach((blank, blankIndex) => {
      const row = document.createElement("label");
      row.className = "exam-page__fill-row d-flex align-items-center";
      row.innerHTML = `
        <span class="exam-page__fill-text">${blank.before}</span>
        <input class="exam-page__fill-input" type="text" inputmode="numeric" aria-label="Ô trống ${blankIndex + 1} câu hỏi ${question.number}">
        <span class="exam-page__fill-text">${blank.after}</span>
      `;
      list.appendChild(row);
    });

    visualEl.appendChild(list);
    optionsEl.className = "exam-page__options exam-page__options--empty d-none";
    optionsEl.removeAttribute("role");
    optionsEl.innerHTML = "";
  }

  function renderMatchingQuestion(question) {
    const state = getQuestionState(question.id);
    visualEl.className = "exam-page__visual exam-page__visual--matching";
    visualEl.innerHTML = "";

    const board = document.createElement("div");
    board.className = "exam-page__matching-board position-relative d-grid align-items-start";

    const overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    overlay.setAttribute("class", "exam-page__matching-lines");
    overlay.setAttribute("aria-hidden", "true");

    const leftColumn = document.createElement("div");
    leftColumn.className = "exam-page__matching-column exam-page__matching-column--left position-relative d-grid";

    question.left_items.forEach((item, itemIndex) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "exam-page__matching-tile exam-page__matching-tile--left d-flex align-items-center border-0 text-start w-100";
      tile.dataset.matchLeft = String(itemIndex);
      tile.textContent = item;
      tile.classList.toggle("exam-page__matching-tile--selected", state.selectedLeft === itemIndex);
      tile.classList.toggle("exam-page__matching-tile--matched", Object.prototype.hasOwnProperty.call(state.pairs, itemIndex));
      tile.addEventListener("click", function () {
        state.selectedLeft = state.selectedLeft === itemIndex ? null : itemIndex;
        renderQuestion(question);
      });
      leftColumn.appendChild(tile);
    });

    const rightColumn = document.createElement("div");
    rightColumn.className = "exam-page__matching-column exam-page__matching-column--right position-relative d-grid";

    question.right_items.forEach((item, itemIndex) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "exam-page__matching-tile exam-page__matching-tile--right d-flex align-items-center border-0 text-start w-100";
      tile.dataset.matchRight = String(itemIndex);
      tile.textContent = item;
      const linkedLeftIndex = Object.keys(state.pairs).find((leftIndex) => state.pairs[leftIndex] === itemIndex);
      tile.classList.toggle("exam-page__matching-tile--matched", linkedLeftIndex !== undefined);
      tile.addEventListener("click", function () {
        if (state.selectedLeft === null) return;

        Object.keys(state.pairs).forEach((leftIndex) => {
          if (state.pairs[leftIndex] === itemIndex) {
            delete state.pairs[leftIndex];
          }
        });

        state.pairs[state.selectedLeft] = itemIndex;
        state.selectedLeft = null;
        renderQuestion(question);
      });
      rightColumn.appendChild(tile);
    });

    board.append(overlay, leftColumn, rightColumn);
    visualEl.appendChild(board);
    drawMatchingLines(board, overlay, state.pairs);

    optionsEl.className = "exam-page__options exam-page__options--empty d-none";
    optionsEl.removeAttribute("role");
    optionsEl.innerHTML = "";
  }

  function drawMatchingLines(board, overlay, pairs) {
    const boardRect = board.getBoundingClientRect();
    const width = boardRect.width;
    const height = boardRect.height;
    overlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
    overlay.setAttribute("width", width);
    overlay.setAttribute("height", height);
    overlay.innerHTML = "";

    Object.entries(pairs).forEach(([leftIndex, rightIndex]) => {
      const leftTile = board.querySelector(`[data-match-left="${leftIndex}"]`);
      const rightTile = board.querySelector(`[data-match-right="${rightIndex}"]`);
      if (!leftTile || !rightTile) return;

      const leftRect = leftTile.getBoundingClientRect();
      const rightRect = rightTile.getBoundingClientRect();
      const x1 = leftRect.right - boardRect.left;
      const y1 = leftRect.top + leftRect.height / 2 - boardRect.top;
      const markerRadius = 10;
      const x2 = rightRect.left - boardRect.left;
      const y2 = rightRect.top + rightRect.height / 2 - boardRect.top;
      const markerCenterX = x2;
      const pathEndX = markerCenterX - markerRadius;
      const delta = Math.max((pathEndX - x1) * 0.38, 56);

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${x1} ${y1} C ${x1 + delta} ${y1}, ${pathEndX - delta} ${y2}, ${pathEndX} ${y2}`);
      path.setAttribute("class", "exam-page__matching-path");
      overlay.appendChild(path);

      const markerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      markerGroup.setAttribute("class", "exam-page__matching-marker");

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", markerCenterX);
      circle.setAttribute("cy", y2);
      circle.setAttribute("r", "10");
      circle.setAttribute("class", "exam-page__matching-marker-circle");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", markerCenterX);
      text.setAttribute("y", y2 + 1);
      text.setAttribute("class", "exam-page__matching-marker-text");
      text.textContent = "×";

      markerGroup.append(circle, text);
      overlay.appendChild(markerGroup);
    });
  }

  function renderClassifyLinesQuestion(question) {
    const state = getQuestionState(question.id);
    visualEl.className = "exam-page__visual exam-page__visual--classify";
    visualEl.innerHTML = "";

    const sourceTray = document.createElement("div");
    sourceTray.className = "exam-page__classify-source d-grid";
    setupClassifyDropzone(sourceTray, question, null);

    question.source_items.forEach((item, itemIndex) => {
      const placement = state.classifyPlacements[itemIndex];
      if (placement !== undefined && placement !== null) return;
      sourceTray.appendChild(renderDraggableLineCard(question, item, itemIndex));
    });

    const bucketGrid = document.createElement("div");
    bucketGrid.className = "exam-page__classify-buckets d-grid";

    question.buckets.forEach((bucket, bucketIndex) => {
      const bucketEl = document.createElement("section");
      bucketEl.className = "exam-page__classify-bucket position-relative";
      const title = document.createElement("h3");
      title.className = "exam-page__classify-bucket-title";
      title.textContent = bucket.title;

      const dropzone = document.createElement("div");
      dropzone.className = "exam-page__classify-dropzone d-grid";
      setupClassifyDropzone(dropzone, question, bucketIndex);

      question.source_items.forEach((item, itemIndex) => {
        if (state.classifyPlacements[itemIndex] !== bucketIndex) return;
        dropzone.appendChild(renderDraggableLineCard(question, item, itemIndex));
      });

      bucketEl.append(title, dropzone);
      bucketGrid.appendChild(bucketEl);
    });

    visualEl.append(sourceTray, bucketGrid);

    optionsEl.className = "exam-page__options exam-page__options--empty d-none";
    optionsEl.removeAttribute("role");
    optionsEl.innerHTML = "";
  }

  function renderDraggableLineCard(question, item, itemIndex) {
    const card = renderLineFigure(item.kind, item.labels);
    card.classList.add("exam-page__line-card--draggable");
    card.draggable = true;
    card.dataset.classifyItem = String(itemIndex);
    card.addEventListener("dragstart", function (event) {
      event.dataTransfer.setData("text/plain", JSON.stringify({
        questionId: question.id,
        itemIndex
      }));
      event.dataTransfer.effectAllowed = "move";
      requestAnimationFrame(function () {
        card.classList.add("exam-page__line-card--dragging");
      });
    });
    card.addEventListener("dragend", function () {
      card.classList.remove("exam-page__line-card--dragging");
    });
    return card;
  }

  function setupClassifyDropzone(dropzone, question, bucketIndex) {
    dropzone.addEventListener("dragover", function (event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      dropzone.classList.add("exam-page__classify-dropzone--hover");
    });

    dropzone.addEventListener("dragleave", function () {
      dropzone.classList.remove("exam-page__classify-dropzone--hover");
    });

    dropzone.addEventListener("drop", function (event) {
      event.preventDefault();
      dropzone.classList.remove("exam-page__classify-dropzone--hover");

      let payload;
      try {
        payload = JSON.parse(event.dataTransfer.getData("text/plain"));
      } catch (error) {
        return;
      }

      if (!payload || payload.questionId !== question.id) return;

      const state = getQuestionState(question.id);
      state.classifyPlacements[payload.itemIndex] = bucketIndex;

      if (bucketIndex === null) {
        delete state.classifyPlacements[payload.itemIndex];
      }

      renderQuestion(question);
    });
  }

  function renderSortNumbersQuestion(question) {
    const state = getQuestionState(question.id);
    if (!Array.isArray(state.sortOrder)) {
      state.sortOrder = question.numbers.map((_, index) => index);
    }

    visualEl.className = "exam-page__visual exam-page__visual--sort";
    visualEl.innerHTML = "";

    const tray = document.createElement("div");
    tray.className = "exam-page__sort-tray d-flex align-items-start flex-wrap";

    state.sortOrder.forEach((itemIndex) => {
      const value = question.numbers[itemIndex];
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "exam-page__sort-chip d-inline-flex align-items-center justify-content-center";
      chip.draggable = true;
      chip.dataset.sortIndex = String(itemIndex);
      chip.textContent = value;
      chip.addEventListener("dragstart", function (event) {
        event.dataTransfer.setData("text/plain", JSON.stringify({
          questionId: question.id,
          itemIndex
        }));
        event.dataTransfer.effectAllowed = "move";
        requestAnimationFrame(function () {
          chip.classList.add("exam-page__sort-chip--dragging");
        });
      });
      chip.addEventListener("dragend", function () {
        chip.classList.remove("exam-page__sort-chip--dragging");
      });
      tray.appendChild(chip);
    });

    tray.addEventListener("dragover", function (event) {
      event.preventDefault();
      const activeChip = tray.querySelector(".exam-page__sort-chip--dragging");
      const afterElement = getSortDragAfterElement(tray, event.clientX);
      if (!activeChip) return;

      if (afterElement == null) {
        tray.appendChild(activeChip);
      } else if (afterElement !== activeChip) {
        tray.insertBefore(activeChip, afterElement);
      }
    });

    tray.addEventListener("drop", function (event) {
      event.preventDefault();
      let payload;
      try {
        payload = JSON.parse(event.dataTransfer.getData("text/plain"));
      } catch (error) {
        return;
      }

      if (!payload || payload.questionId !== question.id) return;

      const nextOrder = Array.from(tray.querySelectorAll("[data-sort-index]")).map((node) => Number(node.dataset.sortIndex));
      state.sortOrder = nextOrder;
      renderQuestion(question);
    });

    visualEl.appendChild(tray);

    optionsEl.className = "exam-page__options exam-page__options--empty d-none";
    optionsEl.removeAttribute("role");
    optionsEl.innerHTML = "";
  }

  function getSortDragAfterElement(container, pointerX) {
    const elements = [...container.querySelectorAll(".exam-page__sort-chip:not(.exam-page__sort-chip--dragging)")];

    return elements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = pointerX - box.left - box.width / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }

      return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  }

  function renderAnimalChoiceQuestion(question) {
    visualEl.className = "exam-page__visual exam-page__visual--animal-choice";
    visualEl.innerHTML = "";

    const prompt = document.createElement("p");
    prompt.className = "exam-page__question-note exam-page__question-note--animal";
    prompt.textContent = question.question_text;
    visualEl.appendChild(prompt);

    const grid = document.createElement("div");
    grid.className = "exam-page__animal-grid d-grid";

    question.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      label.className = "exam-page__animal-option position-relative d-grid align-items-center";
      label.htmlFor = `question-${question.number}-option-${optionIndex + 1}`;
      label.innerHTML = `
        <input class="exam-page__option-input" type="radio" name="question-${question.number}" id="question-${question.number}-option-${optionIndex + 1}">
        <span class="exam-page__option-radio exam-page__option-radio--animal" aria-hidden="true"></span>
        <span class="exam-page__animal-key">${option.key}</span>
        <span class="exam-page__animal-figure d-grid" aria-hidden="true">${option.emoji}</span>
        <span class="visually-hidden">${option.label}</span>
      `;
      grid.appendChild(label);
    });

    visualEl.appendChild(grid);

    optionsEl.className = "exam-page__options exam-page__options--empty d-none";
    optionsEl.removeAttribute("role");
    optionsEl.innerHTML = "";
  }

  function renderAudioChoiceQuestion(question) {
    const state = getQuestionState(question.id);
    const maxSelections = question.selection_limit || 1;
    visualEl.className = "exam-page__visual exam-page__visual--audio-choice";
    visualEl.innerHTML = "";

    const hero = document.createElement("div");
    hero.className = "exam-page__audio-hero d-grid";
    hero.innerHTML = `
      <div class="exam-page__audio-picture d-grid" aria-hidden="true">${question.picture_emoji}</div>
      <div class="exam-page__audio-word">${question.picture_word}</div>
    `;

    const leadButton = document.createElement("span");
    leadButton.className = "exam-page__audio-button exam-page__audio-button--lead d-inline-flex align-items-center justify-content-center bg-white";
    leadButton.setAttribute("aria-hidden", "true");
    leadButton.innerHTML = `
      <span class="exam-page__audio-button-icon" aria-hidden="true">🔊</span>
    `;

    visualEl.append(hero, leadButton);

    optionsEl.className = "exam-page__options exam-page__options--audio d-grid";
    optionsEl.setAttribute("role", maxSelections > 1 ? "group" : "radiogroup");
    optionsEl.innerHTML = "";

    question.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      const isChecked = state.selectedOptions.includes(optionIndex);
      label.className = "exam-page__audio-option position-relative d-grid align-items-center";
      label.htmlFor = `question-${question.number}-option-${optionIndex + 1}`;
      label.innerHTML = `
        <input class="exam-page__option-input" type="${maxSelections > 1 ? "checkbox" : "radio"}" name="question-${question.number}" id="question-${question.number}-option-${optionIndex + 1}" ${isChecked ? "checked" : ""}>
        <span class="exam-page__option-radio" aria-hidden="true"></span>
        <span class="exam-page__audio-option-key">${option.key}</span>
        <span class="exam-page__audio-button" aria-hidden="true">
          <span class="exam-page__audio-button-icon" aria-hidden="true">🔊</span>
        </span>
      `;

      const input = label.querySelector(".exam-page__option-input");
      input.addEventListener("change", function () {
        if (maxSelections === 1) {
          state.selectedOptions = input.checked ? [optionIndex] : [];
          renderQuestion(question);
          return;
        }

        if (input.checked) {
          if (state.selectedOptions.includes(optionIndex)) {
            return;
          }

          if (state.selectedOptions.length >= maxSelections) {
            input.checked = false;
            return;
          }

          state.selectedOptions = [...state.selectedOptions, optionIndex];
        } else {
          state.selectedOptions = state.selectedOptions.filter((selectedIndex) => selectedIndex !== optionIndex);
        }

        renderQuestion(question);
      });

      optionsEl.appendChild(label);
    });
  }

  function renderQuestion(question) {
    questionIndexEl.textContent = `Câu hỏi ${question.number}`;
    questionPromptEl.textContent = question.prompt;
    questionAuxEl.style.display = "none";
    pagerCurrentEl.textContent = question.number;

    if (question.type === "single_choice") {
      renderMultiplicationVisual(question);
      renderSingleChoiceOptions(question);
    }

    if (question.type === "image_choice") {
      renderImageChoiceVisual(question);
      renderImageChoiceOptions(question);
    }

    if (question.type === "fill_blank") {
      renderFillBlankQuestion(question);
    }

    if (question.type === "matching") {
      renderMatchingQuestion(question);
    }

    if (question.type === "classify_lines") {
      renderClassifyLinesQuestion(question);
    }

    if (question.type === "sort_numbers") {
      renderSortNumbersQuestion(question);
    }

    if (question.type === "animal_choice") {
      renderAnimalChoiceQuestion(question);
    }

    if (question.type === "audio_choice") {
      renderAudioChoiceQuestion(question);
    }

    chipButtons.forEach((button) => {
      const chipNumber = Number(button.dataset.questionChip);
      button.classList.toggle("exam-page__question-chip--current", chipNumber === question.number);
    });

    prevButton.disabled = currentIndex === 0;
    prevButton.classList.toggle("exam-page__pager-button--muted", currentIndex === 0);
    nextButton.disabled = currentIndex === questions.length - 1;
    nextButton.classList.toggle("exam-page__pager-button--muted", currentIndex === questions.length - 1);
  }

  prevButton.addEventListener("click", function () {
    if (currentIndex === 0) return;
    currentIndex -= 1;
    renderQuestion(questions[currentIndex]);
  });

  nextButton.addEventListener("click", function () {
    if (currentIndex >= questions.length - 1) return;
    currentIndex += 1;
    renderQuestion(questions[currentIndex]);
  });

  chipButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const chipNumber = Number(button.dataset.questionChip);
      const targetIndex = questions.findIndex((question) => question.number === chipNumber);
      if (targetIndex === -1) return;
      currentIndex = targetIndex;
      renderQuestion(questions[currentIndex]);
    });
  });

  window.addEventListener("resize", function () {
    const question = questions[currentIndex];
    if (question && question.type === "matching") {
      renderQuestion(question);
    }
  });

  if (submitConfirmButton && examHeader && examMain && examResult) {
    submitConfirmButton.addEventListener("click", function () {
      stopTimer();
      sessionStorage.removeItem(storageKey);
      examHeader.hidden = true;
      examMain.hidden = true;
      examResult.hidden = false;
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  if (resultFinishButton) {
    resultFinishButton.addEventListener("click", function () {
      sessionStorage.removeItem(storageKey);
      window.location.href = "/vao-thi-trang-nguyen-2023/";
    });
  }

  startTimer();
  renderQuestion(questions[currentIndex]);
})();
