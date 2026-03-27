(function (global) {
  const ExamApp = global.ExamApp = global.ExamApp || {};

  function normalizeOptionKey(value) {
    return String(value || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  ExamApp.normalizeOptionKey = normalizeOptionKey;

  function formatOptionPhrase(keys) {
    const cleanKeys = keys.filter(Boolean);
    if (!cleanKeys.length) return "";

    const joined = cleanKeys.join(", ");
    return cleanKeys.length > 1
      ? `các đáp án ${joined}`
      : `đáp án ${joined}`;
  }

  ExamApp.formatOptionPhrase = formatOptionPhrase;

  function areSameOptionKeys(left, right) {
    if (left.length !== right.length) return false;

    const rightSet = new Set(right);
    return left.every((value) => rightSet.has(value));
  }

  ExamApp.areSameOptionKeys = areSameOptionKeys;

  function getFillBlankFacts(question, answers) {
    return question.blanks.map((blank, blankIndex) => {
      const answer = String(answers[blankIndex] || "").trim();
      const suffix = String(blank.after || "").trim();
      return answer ? `Số ${answer} ${suffix}` : "";
    }).filter(Boolean);
  }

  ExamApp.getFillBlankFacts = getFillBlankFacts;

  function getMatchingFacts(question, pairs) {
    const entries = Object.entries(pairs || {})
      .sort((left, right) => Number(left[0]) - Number(right[0]));

    return entries.map(([leftIndex, rightIndex]) => {
      const leftText = question.left_items[Number(leftIndex)];
      const rightText = question.right_items[Number(rightIndex)];
      return leftText && rightText ? `${leftText} nối với ${rightText}.` : "";
    }).filter(Boolean);
  }

  ExamApp.getMatchingFacts = getMatchingFacts;

  function getClassifyFacts(question, placements) {
    const entries = Object.entries(placements || {})
      .sort((left, right) => Number(left[0]) - Number(right[0]));

    return entries.map(([itemIndex, bucketIndex]) => {
      const item = question.source_items[Number(itemIndex)];
      const bucket = question.buckets[Number(bucketIndex)];
      const label = Array.isArray(item?.labels) ? item.labels.join("") : "Hình";
      return item && bucket ? `${label} thuộc nhóm ${bucket.title.toLowerCase()}.` : "";
    }).filter(Boolean);
  }

  ExamApp.getClassifyFacts = getClassifyFacts;

  function getSortFacts(question, orderIndexes) {
    const orderedValues = orderIndexes
      .map((index) => question.numbers[Number(index)])
      .filter(Boolean);

    if (!orderedValues.length) return [];
    return [`Thứ tự đúng là ${orderedValues.join(", ")}.`];
  }

  ExamApp.getSortFacts = getSortFacts;

  function getReviewEntries(snapshot) {
    const reviewQuestions = Array.isArray(snapshot?.questions) ? snapshot.questions : [];
    const reviewResponses = snapshot?.responses && typeof snapshot.responses === "object"
      ? snapshot.responses
      : {};

    return reviewQuestions
      .filter((question) => {
        if (question.type === "fill_blank") {
          return Array.isArray(question.correct_fill_answers) && Array.isArray(question.blanks);
        }

        if (question.type === "matching") {
          return question.correct_pairs && question.left_items && question.right_items;
        }

        if (question.type === "classify_lines") {
          return question.correct_classify_placements && question.source_items && question.buckets;
        }

        if (question.type === "sort_numbers") {
          return Array.isArray(question.numbers) && question.numbers.length > 0;
        }

        return Array.isArray(question.correct_option_keys) && Array.isArray(question.options);
      })
      .map((question) => {
        const state = reviewResponses[question.id] || {};

        if (question.type === "fill_blank") {
          const fillAnswers = Array.isArray(state.fillBlankAnswers) ? state.fillBlankAnswers : [];
          const normalizedAnswers = fillAnswers.map((value) => String(value || "").trim());
          const normalizedCorrectAnswers = question.correct_fill_answers.map((value) => String(value || "").trim());
          const hasAnyAnswer = normalizedAnswers.some((value) => value !== "");
          const isCorrect = normalizedCorrectAnswers.length === normalizedAnswers.length
            && normalizedCorrectAnswers.every((value, index) => value === normalizedAnswers[index]);
          const facts = ExamApp.getFillBlankFacts(question, normalizedCorrectAnswers);

          if (!hasAnyAnswer) {
            return {
              number: question.number,
              prompt: question.prompt,
              status: "empty",
              badge: "Chưa làm",
              message: "Bạn chưa điền đáp án.",
              facts
            };
          }

          return {
            number: question.number,
            prompt: question.prompt,
            status: isCorrect ? "correct" : "wrong",
            badge: isCorrect ? "Đúng" : "Sai",
            message: isCorrect
              ? "Bạn điền đáp án đúng."
              : "Bạn điền một hoặc nhiều đáp án chưa chính xác.",
            facts
          };
        }

        if (question.type === "matching") {
          const pairs = state.pairs && typeof state.pairs === "object" ? state.pairs : {};
          const correctPairs = question.correct_pairs || {};
          const pairKeys = Object.keys(pairs);
          const hasAnyPair = pairKeys.length > 0;
          const isCorrect = pairKeys.length === Object.keys(correctPairs).length
            && Object.entries(correctPairs).every(([leftIndex, rightIndex]) => String(pairs[leftIndex]) === String(rightIndex));
          const facts = ExamApp.getMatchingFacts(question, correctPairs);

          if (!hasAnyPair) {
            return {
              number: question.number,
              prompt: question.prompt,
              status: "empty",
              badge: "Chưa làm",
              message: "Bạn chưa nối đáp án.",
              facts
            };
          }

          return {
            number: question.number,
            prompt: question.prompt,
            status: isCorrect ? "correct" : "wrong",
            badge: isCorrect ? "Đúng" : "Sai",
            message: isCorrect
              ? "Bạn đã nối đúng tất cả các cặp."
              : "Bạn nối một hoặc nhiều cặp chưa chính xác.",
            facts
          };
        }

        if (question.type === "classify_lines") {
          const placements = state.classifyPlacements && typeof state.classifyPlacements === "object"
            ? state.classifyPlacements
            : {};
          const correctPlacements = question.correct_classify_placements || {};
          const placementKeys = Object.keys(placements);
          const hasAnyPlacement = placementKeys.length > 0;
          const isCorrect = placementKeys.length === Object.keys(correctPlacements).length
            && Object.entries(correctPlacements).every(([itemIndex, bucketIndex]) => String(placements[itemIndex]) === String(bucketIndex));
          const facts = ExamApp.getClassifyFacts(question, correctPlacements);

          if (!hasAnyPlacement) {
            return {
              number: question.number,
              prompt: question.prompt,
              status: "empty",
              badge: "Chưa làm",
              message: "Bạn chưa phân loại đáp án.",
              facts
            };
          }

          return {
            number: question.number,
            prompt: question.prompt,
            status: isCorrect ? "correct" : "wrong",
            badge: isCorrect ? "Đúng" : "Sai",
            message: isCorrect
              ? "Bạn đã phân loại đúng tất cả các hình."
              : "Bạn phân loại một hoặc nhiều hình chưa chính xác.",
            facts
          };
        }

        if (question.type === "sort_numbers") {
          const sortOrder = Array.isArray(state.sortOrder) ? state.sortOrder : [];
          const correctOrder = question.numbers
            .map((value, index) => ({ value: Number(value), index }))
            .sort((left, right) => right.value - left.value)
            .map((entry) => entry.index);
          const hasAnyOrder = sortOrder.length > 0;
          const isCorrect = sortOrder.length === correctOrder.length
            && correctOrder.every((value, index) => Number(sortOrder[index]) === value);
          const facts = ExamApp.getSortFacts(question, correctOrder);

          if (!hasAnyOrder) {
            return {
              number: question.number,
              prompt: question.prompt,
              status: "empty",
              badge: "Chưa làm",
              message: "Bạn chưa sắp xếp đáp án.",
              facts
            };
          }

          return {
            number: question.number,
            prompt: question.prompt,
            status: isCorrect ? "correct" : "wrong",
            badge: isCorrect ? "Đúng" : "Sai",
            message: isCorrect
              ? "Bạn đã sắp xếp đúng thứ tự."
              : "Bạn sắp xếp thứ tự chưa chính xác.",
            facts
          };
        }

        const selectedIndexes = Array.isArray(state.selectedOptions) ? state.selectedOptions : [];
        const selectedKeys = selectedIndexes
          .map((optionIndex) => question.options[optionIndex]?.key)
          .filter(Boolean)
          .map(normalizeOptionKey);
        const correctKeys = question.correct_option_keys.map(normalizeOptionKey);
        const selectedPhrase = ExamApp.formatOptionPhrase(selectedKeys);
        const correctPhrase = ExamApp.formatOptionPhrase(correctKeys);

        if (!selectedKeys.length) {
          return {
            number: question.number,
            prompt: question.prompt,
            status: "empty",
            badge: "Chưa làm",
            message: "Bạn chưa chọn đáp án.",
            detail: `Đáp án chính xác là ${correctPhrase}.`
          };
        }

        const isCorrect = ExamApp.areSameOptionKeys(selectedKeys, correctKeys);
        return {
          number: question.number,
          prompt: question.prompt,
          status: isCorrect ? "correct" : "wrong",
          badge: isCorrect ? "Đúng" : "Sai",
          message: `Bạn chọn ${selectedPhrase} là ${isCorrect ? "đúng" : "sai"}.`,
          detail: isCorrect ? "" : `Đáp án chính xác là ${correctPhrase}.`
        };
      });
  }

  ExamApp.getReviewEntries = getReviewEntries;

  function renderReviewEntries(listEl, entries) {
    if (!listEl) return;
    listEl.innerHTML = "";

    if (!entries.length) {
      const emptyEl = document.createElement("p");
      emptyEl.className = "exam-review-page__result-empty";
      emptyEl.textContent = "Chưa có câu nào được cấu hình đáp án để hiển thị kết quả đối chiếu.";
      listEl.appendChild(emptyEl);
      return;
    }

    entries.forEach((entry) => {
      const article = document.createElement("article");
      article.className = `exam-review-page__result-item exam-review-page__result-item--${entry.status}`;

      const head = document.createElement("div");
      head.className = "exam-review-page__result-head";

      const numberEl = document.createElement("span");
      numberEl.className = "exam-review-page__result-number";
      numberEl.textContent = `Câu ${entry.number}`;

      const badgeEl = document.createElement("span");
      badgeEl.className = `exam-review-page__result-badge exam-review-page__result-badge--${entry.status}`;
      badgeEl.textContent = entry.badge;

      head.append(numberEl, badgeEl);
      article.appendChild(head);

      const questionRowEl = document.createElement("div");
      questionRowEl.className = "exam-review-page__result-question";

      const promptEl = document.createElement("p");
      promptEl.className = "exam-review-page__result-prompt";
      promptEl.textContent = entry.prompt;

      const reviewQuestionEl = document.createElement("a");
      reviewQuestionEl.className = "exam-review-page__review-question";
      reviewQuestionEl.textContent = "Xem lại câu hỏi";
      reviewQuestionEl.href = ExamApp.buildExamPageUrl(entry.number);

      questionRowEl.append(promptEl, reviewQuestionEl);
      article.appendChild(questionRowEl);

      const messageEl = document.createElement("p");
      messageEl.className = "exam-review-page__result-message";
      messageEl.textContent = entry.message;
      article.appendChild(messageEl);

      if (Array.isArray(entry.facts) && entry.facts.length) {
        const factsEl = document.createElement("div");
        factsEl.className = "exam-review-page__result-facts";

        entry.facts.forEach((fact) => {
          const factEl = document.createElement("p");
          factEl.className = "exam-review-page__result-fact";
          factEl.textContent = fact;
          factsEl.appendChild(factEl);
        });

        article.appendChild(factsEl);
      }

      if (entry.detail) {
        const detailEl = document.createElement("p");
        detailEl.className = "exam-review-page__result-detail";
        detailEl.textContent = entry.detail;
        article.appendChild(detailEl);
      }

      listEl.appendChild(article);
    });
  }

  ExamApp.renderReviewEntries = renderReviewEntries;

  function renderReviewPage() {
    const { reviewRoot } = ExamApp.getRuntime();
    if (!reviewRoot) return;

    const snapshot = ExamApp.readReviewSnapshot();
    const titleEl = reviewRoot.querySelector("[data-exam-review-title]");
    const summaryEl = reviewRoot.querySelector("[data-exam-review-summary]");
    const examTitleEl = reviewRoot.querySelector("[data-exam-review-exam-title]");
    const savedAtEl = reviewRoot.querySelector("[data-exam-review-saved-at]");
    const listEl = reviewRoot.querySelector("[data-exam-review-list]");

    if (!snapshot) {
      if (titleEl) {
        titleEl.textContent = "Chưa có dữ liệu kết quả";
      }

      if (summaryEl) {
        summaryEl.textContent = "Hãy quay lại bài thi, nộp bài và bấm Xem kết quả để mở màn này.";
      }

      if (examTitleEl) {
        examTitleEl.textContent = "--";
      }

      if (savedAtEl) {
        savedAtEl.textContent = "--";
      }

      ExamApp.renderReviewEntries(listEl, []);
      return;
    }

    const reviewEntries = ExamApp.getReviewEntries(snapshot);
    const answeredEntries = reviewEntries.filter((entry) => entry.status !== "empty");

    if (titleEl) {
      titleEl.textContent = "Kết quả bài làm";
    }

    if (summaryEl) {
      summaryEl.textContent = reviewEntries.length
        ? `Đã đối chiếu ${answeredEntries.length}/${reviewEntries.length} câu có đáp án.`
        : "Chưa có câu nào được cấu hình đáp án để đối chiếu.";
    }

    if (examTitleEl) {
      examTitleEl.textContent = snapshot.examTitle || "--";
    }

    if (savedAtEl) {
      savedAtEl.textContent = ExamApp.formatReviewSavedAt(snapshot.savedAt);
    }

    ExamApp.renderReviewEntries(listEl, reviewEntries);
  }



  ExamApp.renderReviewPage = renderReviewPage;

})(window);
