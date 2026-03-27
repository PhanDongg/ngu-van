(function (global) {
  const ExamApp = global.ExamApp = global.ExamApp || {};

  function renderSortNumbersQuestion(question) {
    const { visualEl, optionsEl } = ExamApp.getRuntime();
    const state = ExamApp.getQuestionState(question.id);
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
      chip.addEventListener("pointerdown", function (event) {
        if (event.pointerType === "mouse") return;
        ExamApp.startSortPointerDrag(chip, tray, question, event);
      });
      tray.appendChild(chip);
    });

    tray.addEventListener("dragover", function (event) {
      event.preventDefault();
      const activeChip = tray.querySelector(".exam-page__sort-chip--dragging");
      const afterElement = ExamApp.getSortDragAfterElement(tray, event.clientX);
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
      ExamApp.renderQuestion(question);
    });

    visualEl.appendChild(tray);

    optionsEl.className = "exam-page__options exam-page__options--empty d-none";
    optionsEl.removeAttribute("role");
    optionsEl.innerHTML = "";
  }

  ExamApp.renderSortNumbersQuestion = renderSortNumbersQuestion;

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

  ExamApp.getSortDragAfterElement = getSortDragAfterElement;

  function startSortPointerDrag(chip, tray, question, event) {
    const runtime = ExamApp.getRuntime();
    if (runtime.activeSortPointerDrag) {
      ExamApp.cleanupSortPointerDrag();
    }

    event.preventDefault();

    const rect = chip.getBoundingClientRect();
    const ghost = chip.cloneNode(true);
    ghost.classList.add("exam-page__sort-chip--drag-ghost");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    document.body.appendChild(ghost);

    chip.classList.add("exam-page__sort-chip--dragging");

    runtime.activeSortPointerDrag = {
      chip,
      tray,
      ghost,
      pointerId: event.pointerId,
      questionId: question.id,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };

    ExamApp.updateSortPointerGhostPosition(event.clientX, event.clientY);
    ExamApp.updateSortPointerReorder(event.clientX, event.clientY);

    document.addEventListener("pointermove", ExamApp.handleSortPointerMove);
    document.addEventListener("pointerup", ExamApp.handleSortPointerEnd);
    document.addEventListener("pointercancel", ExamApp.handleSortPointerEnd);
  }

  ExamApp.startSortPointerDrag = startSortPointerDrag;

  function handleSortPointerMove(event) {
    const runtime = ExamApp.getRuntime();
    if (!runtime.activeSortPointerDrag || event.pointerId !== runtime.activeSortPointerDrag.pointerId) return;

    event.preventDefault();
    ExamApp.updateSortPointerGhostPosition(event.clientX, event.clientY);
    ExamApp.updateSortPointerReorder(event.clientX, event.clientY);
  }

  ExamApp.handleSortPointerMove = handleSortPointerMove;

  function handleSortPointerEnd(event) {
    const runtime = ExamApp.getRuntime();
    if (!runtime.activeSortPointerDrag || event.pointerId !== runtime.activeSortPointerDrag.pointerId) return;

    event.preventDefault();
    const { tray, questionId } = runtime.activeSortPointerDrag;
    ExamApp.cleanupSortPointerDrag();

    const nextOrder = Array.from(tray.querySelectorAll("[data-sort-index]")).map((node) => Number(node.dataset.sortIndex));
    const state = ExamApp.getQuestionState(questionId);
    state.sortOrder = nextOrder;

    const nextQuestion = runtime.questions.find((entry) => entry.id === questionId);
    if (nextQuestion) {
      ExamApp.renderQuestion(nextQuestion);
    }
  }

  ExamApp.handleSortPointerEnd = handleSortPointerEnd;

  function updateSortPointerGhostPosition(clientX, clientY) {
    const runtime = ExamApp.getRuntime();
    if (!runtime.activeSortPointerDrag) return;

    const { ghost, offsetX, offsetY } = runtime.activeSortPointerDrag;
    ghost.style.left = `${clientX - offsetX}px`;
    ghost.style.top = `${clientY - offsetY}px`;
  }

  ExamApp.updateSortPointerGhostPosition = updateSortPointerGhostPosition;

  function updateSortPointerReorder(clientX, clientY) {
    const runtime = ExamApp.getRuntime();
    if (!runtime.activeSortPointerDrag) return;

    const { tray, chip } = runtime.activeSortPointerDrag;
    const afterElement = ExamApp.getSortPointerAfterElement(tray, chip, clientX, clientY);

    if (afterElement == null) {
      tray.appendChild(chip);
    } else if (afterElement !== chip) {
      tray.insertBefore(chip, afterElement);
    }
  }

  ExamApp.updateSortPointerReorder = updateSortPointerReorder;

  function getSortPointerAfterElement(container, activeChip, pointerX, pointerY) {
    const elements = [...container.querySelectorAll(".exam-page__sort-chip")].filter((chip) => chip !== activeChip);
    if (!elements.length) return null;

    const sampleBox = elements[0].getBoundingClientRect();
    const rowThreshold = sampleBox.height * 0.45;

    for (const child of elements) {
      const box = child.getBoundingClientRect();
      const centerY = box.top + box.height / 2;
      const centerX = box.left + box.width / 2;

      if (pointerY < centerY - rowThreshold) {
        return child;
      }

      if (Math.abs(pointerY - centerY) <= rowThreshold && pointerX < centerX) {
        return child;
      }
    }

    return null;
  }

  ExamApp.getSortPointerAfterElement = getSortPointerAfterElement;

  function cleanupSortPointerDrag() {
    const runtime = ExamApp.getRuntime();
    if (!runtime.activeSortPointerDrag) return;

    const { chip, ghost } = runtime.activeSortPointerDrag;
    chip.classList.remove("exam-page__sort-chip--dragging");

    if (ghost && ghost.parentNode) {
      ghost.parentNode.removeChild(ghost);
    }

    document.removeEventListener("pointermove", ExamApp.handleSortPointerMove);
    document.removeEventListener("pointerup", ExamApp.handleSortPointerEnd);
    document.removeEventListener("pointercancel", ExamApp.handleSortPointerEnd);

    runtime.activeSortPointerDrag = null;
  }

  ExamApp.cleanupSortPointerDrag = cleanupSortPointerDrag;

})(window);
