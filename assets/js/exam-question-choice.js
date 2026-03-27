(function (global) {
  const ExamApp = global.ExamApp = global.ExamApp || {};

  function renderMultiplicationVisual(question) {
    const { visualEl } = ExamApp.getRuntime();
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

  ExamApp.renderMultiplicationVisual = renderMultiplicationVisual;

  function renderImageChoiceVisual(question) {
    const { visualEl } = ExamApp.getRuntime();
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
      frame.appendChild(ExamApp.renderCubeShape(shapeData.columns));
      sources.appendChild(frame);
    });

    visualEl.appendChild(sources);

    const prompt = document.createElement("p");
    prompt.className = "exam-page__question-note exam-page__question-note--secondary";
    prompt.textContent = question.question_text;
    visualEl.appendChild(prompt);
  }

  ExamApp.renderImageChoiceVisual = renderImageChoiceVisual;

  function renderSingleChoiceOptions(question) {
    const { optionsEl } = ExamApp.getRuntime();
    const state = ExamApp.getQuestionState(question.id);
    optionsEl.className = "exam-page__options d-grid";
    optionsEl.setAttribute("role", "radiogroup");
    optionsEl.innerHTML = "";

    question.options.forEach((option, optionIndex) => {
      const isChecked = state.selectedOptions.includes(optionIndex);
      const label = document.createElement("label");
      label.className = "exam-page__option position-relative d-flex align-items-center bg-transparent border-0 text-start";
      label.htmlFor = `question-${question.number}-option-${optionIndex + 1}`;
      label.innerHTML = `
        <input class="exam-page__option-input" type="radio" name="question-${question.number}" id="question-${question.number}-option-${optionIndex + 1}" ${isChecked ? "checked" : ""}>
        <span class="exam-page__option-radio" aria-hidden="true"></span>
        <span class="exam-page__option-key">${option.key}</span>
        <span class="exam-page__option-text">${option.text}</span>
      `;

      const input = label.querySelector(".exam-page__option-input");
      input.addEventListener("change", function () {
        state.selectedOptions = input.checked ? [optionIndex] : [];
      });

      optionsEl.appendChild(label);
    });
  }

  ExamApp.renderSingleChoiceOptions = renderSingleChoiceOptions;

  function renderImageChoiceOptions(question) {
    const { optionsEl } = ExamApp.getRuntime();
    const state = ExamApp.getQuestionState(question.id);
    optionsEl.className = "exam-page__options exam-page__options--image-choice d-grid";
    optionsEl.setAttribute("role", "radiogroup");
    optionsEl.innerHTML = "";

    question.options.forEach((option, optionIndex) => {
      const isChecked = state.selectedOptions.includes(optionIndex);
      const label = document.createElement("label");
      label.className = "exam-page__image-option position-relative d-grid align-items-center";
      label.htmlFor = `question-${question.number}-option-${optionIndex + 1}`;

      const input = document.createElement("input");
      input.className = "exam-page__option-input";
      input.type = "radio";
      input.name = `question-${question.number}`;
      input.id = `question-${question.number}-option-${optionIndex + 1}`;
      input.checked = isChecked;
      input.addEventListener("change", function () {
        state.selectedOptions = input.checked ? [optionIndex] : [];
      });

      const radio = document.createElement("span");
      radio.className = "exam-page__option-radio";
      radio.setAttribute("aria-hidden", "true");

      const key = document.createElement("span");
      key.className = "exam-page__image-option-key";
      key.textContent = option.key;

      const visual = document.createElement("div");
      visual.className = "exam-page__image-option-visual d-flex align-items-center";
      visual.appendChild(ExamApp.renderCubeShape(option.shape.columns));

      label.append(input, radio, key, visual);
      optionsEl.appendChild(label);
    });
  }

  ExamApp.renderImageChoiceOptions = renderImageChoiceOptions;

  function renderAnimalChoiceQuestion(question) {
    const { visualEl, optionsEl } = ExamApp.getRuntime();
    const state = ExamApp.getQuestionState(question.id);
    visualEl.className = "exam-page__visual exam-page__visual--animal-choice";
    visualEl.innerHTML = "";

    const prompt = document.createElement("p");
    prompt.className = "exam-page__question-note exam-page__question-note--animal";
    prompt.textContent = question.question_text;
    visualEl.appendChild(prompt);

    const grid = document.createElement("div");
    grid.className = "exam-page__animal-grid d-grid";

    question.options.forEach((option, optionIndex) => {
      const isChecked = state.selectedOptions.includes(optionIndex);
      const label = document.createElement("label");
      label.className = "exam-page__animal-option position-relative d-grid align-items-center";
      label.htmlFor = `question-${question.number}-option-${optionIndex + 1}`;
      label.innerHTML = `
        <input class="exam-page__option-input" type="radio" name="question-${question.number}" id="question-${question.number}-option-${optionIndex + 1}" ${isChecked ? "checked" : ""}>
        <span class="exam-page__option-radio exam-page__option-radio--animal" aria-hidden="true"></span>
        <span class="exam-page__animal-key">${option.key}</span>
        <span class="exam-page__animal-figure d-grid" aria-hidden="true">${option.emoji}</span>
        <span class="visually-hidden">${option.label}</span>
      `;

      const input = label.querySelector(".exam-page__option-input");
      input.addEventListener("change", function () {
        state.selectedOptions = input.checked ? [optionIndex] : [];
      });

      grid.appendChild(label);
    });

    visualEl.appendChild(grid);

    optionsEl.className = "exam-page__options exam-page__options--empty d-none";
    optionsEl.removeAttribute("role");
    optionsEl.innerHTML = "";
  }

  ExamApp.renderAnimalChoiceQuestion = renderAnimalChoiceQuestion;

  function renderAudioChoiceQuestion(question) {
    const { visualEl, optionsEl } = ExamApp.getRuntime();
    const state = ExamApp.getQuestionState(question.id);
    const maxSelections = question.selection_limit || 1;
    const leadAudioText = question.lead_audio_text || question.picture_word;
    visualEl.className = "exam-page__visual exam-page__visual--audio-choice";
    visualEl.innerHTML = "";

    const hero = document.createElement("div");
    hero.className = "exam-page__audio-hero d-grid";
    hero.innerHTML = `
      <div class="exam-page__audio-picture d-grid" aria-hidden="true">${question.picture_emoji}</div>
      <div class="exam-page__audio-word">${question.picture_word}</div>
    `;

    const leadButton = document.createElement("button");
    leadButton.type = "button";
    leadButton.className = "exam-page__audio-button exam-page__audio-button--lead d-inline-flex align-items-center justify-content-center bg-white";
    leadButton.setAttribute("aria-label", `Play sound for ${question.picture_word}`);
    leadButton.innerHTML = `
      <span class="exam-page__audio-button-icon" aria-hidden="true">&#128266;</span>
    `;
    leadButton.addEventListener("click", function () {
      ExamApp.animateAudioButton(leadButton);
      ExamApp.speakAudioPrompt(leadAudioText);
    });

    visualEl.append(hero, leadButton);

    optionsEl.className = "exam-page__options exam-page__options--audio d-grid";
    optionsEl.setAttribute("role", maxSelections > 1 ? "group" : "radiogroup");
    optionsEl.innerHTML = "";

    question.options.forEach((option, optionIndex) => {
      const optionId = `question-${question.number}-option-${optionIndex + 1}`;
      const isChecked = state.selectedOptions.includes(optionIndex);
      const optionAudioText = option.audio_text || leadAudioText;
      const row = document.createElement("div");
      row.className = "exam-page__audio-option d-grid align-items-center";
      row.innerHTML = `
        <label class="exam-page__audio-select position-relative d-grid align-items-center" for="${optionId}">
          <input class="exam-page__option-input" type="${maxSelections > 1 ? "checkbox" : "radio"}" name="question-${question.number}" id="${optionId}" ${isChecked ? "checked" : ""}>
          <span class="exam-page__option-radio" aria-hidden="true"></span>
          <span class="exam-page__audio-option-key">${option.key}</span>
          <span class="visually-hidden">${option.label}</span>
        </label>
        <button class="exam-page__audio-button d-flex align-items-center justify-content-center bg-white" type="button" aria-label="Play sound for ${option.key}">
          <span class="exam-page__audio-button-icon" aria-hidden="true">&#128266;</span>
        </button>
      `;

      const input = row.querySelector(".exam-page__option-input");
      const audioButton = row.querySelector(".exam-page__audio-button");

      audioButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        ExamApp.animateAudioButton(audioButton);
        ExamApp.speakAudioPrompt(optionAudioText);
      });

      input.addEventListener("change", function () {
        if (maxSelections === 1) {
          state.selectedOptions = input.checked ? [optionIndex] : [];
          ExamApp.renderQuestion(question);
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

        ExamApp.renderQuestion(question);
      });

      optionsEl.appendChild(row);
    });
  }

  ExamApp.renderAudioChoiceQuestion = renderAudioChoiceQuestion;

})(window);
