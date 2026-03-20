(function () {
  function initSwipeGesture(element, handlers) {
    if (!element) {
      return;
    }

    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let dragging = false;

    function cleanup() {
      pointerId = null;
      dragging = false;
      if (handlers.onStateChange) {
        handlers.onStateChange(false);
      }
    }

    element.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      if (event.target.closest('a, button')) {
        return;
      }

      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      dragging = true;

      if (handlers.onStateChange) {
        handlers.onStateChange(true);
      }

      if (element.setPointerCapture) {
        try {
          element.setPointerCapture(event.pointerId);
        } catch (error) {
        }
      }
    });

    element.addEventListener('pointerup', function (event) {
      if (!dragging || event.pointerId !== pointerId) {
        return;
      }

      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      cleanup();

      if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) {
        return;
      }

      if (deltaX < 0) {
        handlers.onNext();
      } else {
        handlers.onPrev();
      }
    });

    element.addEventListener('pointercancel', function (event) {
      if (event.pointerId === pointerId) {
        cleanup();
      }
    });

    element.addEventListener('lostpointercapture', function () {
      if (dragging) {
        cleanup();
      }
    });
  }

  function initHeroSlider(frame) {
    if (!frame) {
      return;
    }

    const carouselElement = frame.closest('.carousel');
    if (!carouselElement || !window.bootstrap || !window.bootstrap.Carousel) {
      return;
    }

    const carousel = window.bootstrap.Carousel.getOrCreateInstance(carouselElement);

    initSwipeGesture(frame, {
      onNext: function () {
        carousel.next();
      },
      onPrev: function () {
        carousel.prev();
      },
      onStateChange: function (isDragging) {
        frame.classList.toggle('is-dragging', isDragging);
      }
    });
  }

  function initProductsSlider(root) {
    const track = root.querySelector('[data-track]');
    const viewport = root.querySelector('.home-products__viewport');
    const prevButton = root.querySelector('[data-direction="prev"]');
    const nextButton = root.querySelector('[data-direction="next"]');
    const indicators = Array.from(root.querySelectorAll('[data-index]'));

    if (!track || !viewport || !prevButton || !nextButton) {
      return;
    }

    let activeIndex = 0;
    let animating = false;

    function getItems() {
      return Array.from(track.children);
    }

    function getStep() {
      const firstItem = track.firstElementChild;
      if (!firstItem) {
        return 0;
      }

      const itemWidth = firstItem.getBoundingClientRect().width;
      const styles = window.getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || '0');
      return itemWidth + gap;
    }

    function updateIndicators() {
      indicators.forEach(function (indicator, index) {
        indicator.classList.toggle('is-active', index === activeIndex);
        indicator.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
      });
    }

    function resetTrackPosition() {
      track.style.transition = 'none';
      track.style.transform = 'translateX(0)';
      track.getBoundingClientRect();
      track.style.transition = '';
    }

    function moveNext() {
      if (animating) {
        return;
      }

      const step = getStep();
      if (!step) {
        return;
      }

      animating = true;
      track.style.transition = 'transform 420ms ease';
      track.style.transform = 'translateX(-' + step + 'px)';

      track.addEventListener('transitionend', function onEnd() {
        track.removeEventListener('transitionend', onEnd);
        const firstItem = track.firstElementChild;
        if (firstItem) {
          track.appendChild(firstItem);
        }
        resetTrackPosition();
        activeIndex = (activeIndex + 1) % getItems().length;
        updateIndicators();
        animating = false;
      }, { once: true });
    }

    function movePrev() {
      if (animating) {
        return;
      }

      const step = getStep();
      if (!step) {
        return;
      }

      const items = getItems();
      const lastItem = items[items.length - 1];
      if (!lastItem) {
        return;
      }

      animating = true;
      track.insertBefore(lastItem, track.firstElementChild);
      track.style.transition = 'none';
      track.style.transform = 'translateX(-' + step + 'px)';
      track.getBoundingClientRect();
      track.style.transition = 'transform 420ms ease';
      track.style.transform = 'translateX(0)';
      activeIndex = (activeIndex - 1 + getItems().length) % getItems().length;
      updateIndicators();

      track.addEventListener('transitionend', function onEnd() {
        track.removeEventListener('transitionend', onEnd);
        track.style.transition = '';
        track.style.transform = 'translateX(0)';
        animating = false;
      }, { once: true });
    }

    function goToIndex(targetIndex) {
      const items = getItems();
      const count = items.length;
      if (!count || animating) {
        return;
      }

      const normalized = ((targetIndex % count) + count) % count;
      while (activeIndex !== normalized) {
        const firstItem = track.firstElementChild;
        if (!firstItem) {
          break;
        }
        track.appendChild(firstItem);
        activeIndex = (activeIndex + 1) % count;
      }
      resetTrackPosition();
      updateIndicators();
    }

    prevButton.addEventListener('click', movePrev);
    nextButton.addEventListener('click', moveNext);

    indicators.forEach(function (indicator) {
      indicator.addEventListener('click', function () {
        const targetIndex = Number(indicator.getAttribute('data-index'));
        goToIndex(targetIndex);
      });
    });

    initSwipeGesture(viewport, {
      onNext: moveNext,
      onPrev: movePrev,
      onStateChange: function (isDragging) {
        viewport.classList.toggle('is-dragging', isDragging);
      }
    });

    window.addEventListener('resize', resetTrackPosition);
    updateIndicators();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.home-hero__frame, .home-spotlight__frame').forEach(initHeroSlider);
    document.querySelectorAll('[data-home-products-slider]').forEach(initProductsSlider);
  });
})();