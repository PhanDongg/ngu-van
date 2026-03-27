(function (global) {
  const ExamApp = global.ExamApp = global.ExamApp || {};

  function renderClassifyLinesQuestion(question) {
    const { visualEl, optionsEl } = ExamApp.getRuntime();
    const state = ExamApp.getQuestionState(question.id);
    visualEl.className = "exam-page__visual exam-page__visual--classify";
    visualEl.innerHTML = "";

    const sourceTray = document.createElement("div");
    sourceTray.className = "exam-page__classify-source d-grid";
    ExamApp.setupClassifyDropzone(sourceTray, question, null);

    question.source_items.forEach((item, itemIndex) => {
      const placement = state.classifyPlacements[itemIndex];
      if (placement !== undefined && placement !== null) return;
      sourceTray.appendChild(ExamApp.renderDraggableLineCard(question, item, itemIndex));
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
      ExamApp.setupClassifyDropzone(dropzone, question, bucketIndex);

      question.source_items.forEach((item, itemIndex) => {
        if (state.classifyPlacements[itemIndex] !== bucketIndex) return;
        dropzone.appendChild(ExamApp.renderDraggableLineCard(question, item, itemIndex));
      });

      bucketEl.append(title, dropzone);
      bucketGrid.appendChild(bucketEl);
    });

    visualEl.append(sourceTray, bucketGrid);

    optionsEl.className = "exam-page__options exam-page__options--empty d-none";
    optionsEl.removeAttribute("role");
    optionsEl.innerHTML = "";
  }

  ExamApp.renderClassifyLinesQuestion = renderClassifyLinesQuestion;

  function renderDraggableLineCard(question, item, itemIndex) {
    const card = ExamApp.renderLineFigure(item.kind, item.labels);
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
    card.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse") return;
      ExamApp.startClassifyPointerDrag(card, question, itemIndex, event);
    });
    return card;
  }

  ExamApp.renderDraggableLineCard = renderDraggableLineCard;

  function setupClassifyDropzone(dropzone, question, bucketIndex) {
    dropzone.dataset.classifyBucket = bucketIndex === null ? "source" : String(bucketIndex);
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

      const state = ExamApp.getQuestionState(question.id);
      state.classifyPlacements[payload.itemIndex] = bucketIndex;

      if (bucketIndex === null) {
        delete state.classifyPlacements[payload.itemIndex];
      }

      ExamApp.renderQuestion(question);
    });
  }

  ExamApp.setupClassifyDropzone = setupClassifyDropzone;

  function startClassifyPointerDrag(card, question, itemIndex, event) {
    const runtime = ExamApp.getRuntime();
    if (runtime.activeClassifyPointerDrag) {
      ExamApp.cleanupClassifyPointerDrag();
    }

    event.preventDefault();

    const rect = card.getBoundingClientRect();
    const ghost = card.cloneNode(true);
    ghost.classList.add("exam-page__line-card--drag-ghost");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    document.body.appendChild(ghost);

    card.classList.add("exam-page__line-card--dragging");

    runtime.activeClassifyPointerDrag = {
      card,
      ghost,
      pointerId: event.pointerId,
      questionId: question.id,
      itemIndex,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      hoverDropzone: null
    };

    ExamApp.updateClassifyPointerGhostPosition(event.clientX, event.clientY);
    ExamApp.updateClassifyPointerHover(event.clientX, event.clientY);

    document.addEventListener("pointermove", ExamApp.handleClassifyPointerMove);
    document.addEventListener("pointerup", ExamApp.handleClassifyPointerEnd);
    document.addEventListener("pointercancel", ExamApp.handleClassifyPointerEnd);
  }

  ExamApp.startClassifyPointerDrag = startClassifyPointerDrag;

  function handleClassifyPointerMove(event) {
    const runtime = ExamApp.getRuntime();
    if (!runtime.activeClassifyPointerDrag || event.pointerId !== runtime.activeClassifyPointerDrag.pointerId) return;

    event.preventDefault();
    ExamApp.updateClassifyPointerGhostPosition(event.clientX, event.clientY);
    ExamApp.updateClassifyPointerHover(event.clientX, event.clientY);
  }

  ExamApp.handleClassifyPointerMove = handleClassifyPointerMove;

  function handleClassifyPointerEnd(event) {
    const runtime = ExamApp.getRuntime();
    if (!runtime.activeClassifyPointerDrag || event.pointerId !== runtime.activeClassifyPointerDrag.pointerId) return;

    event.preventDefault();
    const dropzone = ExamApp.getClassifyDropzoneFromPoint(event.clientX, event.clientY) || runtime.activeClassifyPointerDrag.hoverDropzone;
    const questionId = runtime.activeClassifyPointerDrag.questionId;
    const itemIndex = runtime.activeClassifyPointerDrag.itemIndex;

    ExamApp.cleanupClassifyPointerDrag();

    if (!dropzone) return;

    const bucketValue = dropzone.dataset.classifyBucket;
    const bucketIndex = bucketValue === "source" ? null : Number(bucketValue);
    const state = ExamApp.getQuestionState(questionId);
    state.classifyPlacements[itemIndex] = bucketIndex;

    if (bucketIndex === null) {
      delete state.classifyPlacements[itemIndex];
    }

    const nextQuestion = runtime.questions.find((entry) => entry.id === questionId);
    if (nextQuestion) {
      ExamApp.renderQuestion(nextQuestion);
    }
  }

  ExamApp.handleClassifyPointerEnd = handleClassifyPointerEnd;

  function updateClassifyPointerGhostPosition(clientX, clientY) {
    const runtime = ExamApp.getRuntime();
    if (!runtime.activeClassifyPointerDrag) return;

    const { ghost, offsetX, offsetY } = runtime.activeClassifyPointerDrag;
    ghost.style.left = `${clientX - offsetX}px`;
    ghost.style.top = `${clientY - offsetY}px`;
  }

  ExamApp.updateClassifyPointerGhostPosition = updateClassifyPointerGhostPosition;

  function updateClassifyPointerHover(clientX, clientY) {
    const runtime = ExamApp.getRuntime();
    if (!runtime.activeClassifyPointerDrag) return;

    const nextDropzone = ExamApp.getClassifyDropzoneFromPoint(clientX, clientY);
    if (runtime.activeClassifyPointerDrag.hoverDropzone === nextDropzone) return;

    if (runtime.activeClassifyPointerDrag.hoverDropzone) {
      runtime.activeClassifyPointerDrag.hoverDropzone.classList.remove("exam-page__classify-dropzone--hover");
    }

    runtime.activeClassifyPointerDrag.hoverDropzone = nextDropzone;

    if (nextDropzone) {
      nextDropzone.classList.add("exam-page__classify-dropzone--hover");
    }
  }

  ExamApp.updateClassifyPointerHover = updateClassifyPointerHover;

  function getClassifyDropzoneFromPoint(clientX, clientY) {
    const target = document.elementFromPoint(clientX, clientY);
    if (!target) return null;

    return target.closest("[data-classify-bucket]");
  }

  ExamApp.getClassifyDropzoneFromPoint = getClassifyDropzoneFromPoint;

  function cleanupClassifyPointerDrag() {
    const runtime = ExamApp.getRuntime();
    if (!runtime.activeClassifyPointerDrag) return;

    const { card, ghost, hoverDropzone } = runtime.activeClassifyPointerDrag;
    card.classList.remove("exam-page__line-card--dragging");

    if (ghost && ghost.parentNode) {
      ghost.parentNode.removeChild(ghost);
    }

    if (hoverDropzone) {
      hoverDropzone.classList.remove("exam-page__classify-dropzone--hover");
    }

    document.removeEventListener("pointermove", ExamApp.handleClassifyPointerMove);
    document.removeEventListener("pointerup", ExamApp.handleClassifyPointerEnd);
    document.removeEventListener("pointercancel", ExamApp.handleClassifyPointerEnd);

    runtime.activeClassifyPointerDrag = null;
  }

  ExamApp.cleanupClassifyPointerDrag = cleanupClassifyPointerDrag;

})(window);
