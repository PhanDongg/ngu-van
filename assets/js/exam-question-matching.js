(function (global) {
  const ExamApp = global.ExamApp = global.ExamApp || {};

  function renderMatchingQuestion(question) {
    const { visualEl, optionsEl } = ExamApp.getRuntime();
    const state = ExamApp.getQuestionState(question.id);
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
        ExamApp.renderQuestion(question);
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
        ExamApp.renderQuestion(question);
      });
      rightColumn.appendChild(tile);
    });

    board.append(overlay, leftColumn, rightColumn);
    visualEl.appendChild(board);
    ExamApp.drawMatchingLines(board, overlay, state.pairs);

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
      const x2 = rightRect.left - boardRect.left;
      const y2 = rightRect.top + rightRect.height / 2 - boardRect.top;
      const isCompact = window.matchMedia("(max-width: 640px)").matches;
      const markerRadius = isCompact ? 8 : 10;
      const markerCenterX = x2;
      const pathEndX = markerCenterX - markerRadius;
      const delta = isCompact
        ? Math.max((pathEndX - x1) * 0.28, 12)
        : Math.max((pathEndX - x1) * 0.38, 56);

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
  ExamApp.renderMatchingQuestion = renderMatchingQuestion;
  ExamApp.drawMatchingLines = drawMatchingLines;
})(window);
