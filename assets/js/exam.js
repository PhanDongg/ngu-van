(function (global) {
  const ExamApp = global.ExamApp;
  if (ExamApp && typeof ExamApp.bootstrap === "function") {
    ExamApp.bootstrap();
  }
})(window);
