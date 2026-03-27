(function (global) {
  const ExamApp = global.ExamApp = global.ExamApp || {};

  function renderFillBlankQuestion(question) {
    const { visualEl, optionsEl } = ExamApp.getRuntime();
    const state = ExamApp.getQuestionState(question.id);
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
        <input class="exam-page__fill-input" type="text" inputmode="numeric" aria-label="\u00d4 tr\u1ed1ng ${blankIndex + 1} c\u00e2u h\u1ecfi ${question.number}">
        <span class="exam-page__fill-text">${blank.after}</span>
      `;

      const input = row.querySelector(".exam-page__fill-input");
      input.value = state.fillBlankAnswers[blankIndex] || "";
      input.addEventListener("input", function () {
        state.fillBlankAnswers[blankIndex] = input.value;
      });

      list.appendChild(row);
    });

    visualEl.appendChild(list);
    optionsEl.className = "exam-page__options exam-page__options--empty d-none";
    optionsEl.removeAttribute("role");
    optionsEl.innerHTML = "";
  }
  ExamApp.renderFillBlankQuestion = renderFillBlankQuestion;
})(window);
