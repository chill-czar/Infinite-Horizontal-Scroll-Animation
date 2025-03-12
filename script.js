document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  const scroller = document.querySelector(".scroller");
  const progressCounter = document.querySelector(".progress-counter h1");
  const progressBar = document.querySelector(".progress-bar");
  const section = Array.from(scroller.querySelectorAll("section"));

  const smoothFactor = 0.05;
  const touchSensitivity = 2.5;
  const bufferSize = 2;

  let targetScrollX = 0;
  let currentScrollX = 0;
  let isAnimating = false;
  let currentProgressScale = 0;
  let targetProgressScale = 0;
  let lastPercentage = 0;

  let isDown = false;
  let lastTouchX = 0;
  let touchVelocity = 0;
  let lastTouchTime = 0;

  const lerp = (start, end, factor) => start + (end - start) * factor;

  const setupScroll = () => {
    scroller
      .querySelectorAll(".clone-section")
      .forEach((clone) => clone.remove());

    const originalSections = Array.from(
      scroller.querySelectorAll("section:not(.clone-section)")
    );
    const templateSections =
      originalSections.length > 0 ? originalSections : section;

    let seqenceWidth = 0;
    templateSections.forEach((section) => {
      seqenceWidth += parseFloat(window.getComputedStyle(section).width);
    });

    for (let i = -bufferSize; i < 0; i++) {
      templateSections.forEach((section, index) => {
        const clone = section.cloneNode(true);
        clone.classList.add("clone-section");
        clone.setAttribute("data-clone-index", `${i}-${index}`);
        scroller.appendChild(clone);
      });
    }

    if (originalSections.length === 0) {
      templateSections.forEach((section, index) => {
        const clone = section.cloneNode(true);
        clone.setAttribute("data-clone-index"), `0-${index}`;
        scroller.appendChild(clone);
      });
    }

    for (let i = 1; i < bufferSize; i++) {
      templateSections.forEach((section, index) => {
        const clone = section.cloneNode(true);
        clone.classList.add("clone-section");
        clone.setAttribute("data-clone-index", `${i}-${index}`);
        scroller.appendChild(clone);
      });
    }

    scroller.style.width = `${seqenceWidth * (1 + bufferSize * 2)}px`;
    targetScrollX = seqenceWidth * bufferSize;
    currentScrollX = targetScrollX;
    scroller.style.transform = `translateX(-${currentScrollX}px)`;

    return seqenceWidth;
  };
  const checkBoundryAndReset = (seqenceWidth) => {
    if (currentScrollX > seqenceWidth * (bufferSize + 0.5)) {
      targetScrollX -= seqenceWidth;
      currentScrollX -= seqenceWidth;
      scroller.style.transform = `translateX(-${currentScrollX}px)`;
      return true;
    }

    if (currentScrollX < seqenceWidth * (bufferSize - 0.5)) {
      targetScrollX += seqenceWidth;
      currentScrollX += seqenceWidth;
      scroller.style.transform = `translateX(-${currentScrollX}px)`;
      return true;
    }

    return false;
  };

  const updateProgress = (seqenceWidth, forceReset = false) => {
    const basePosition = seqenceWidth * bufferSize;
    const currentPosition = (currentScrollX - basePosition) % seqenceWidth;
    let percentage = (currentPosition / seqenceWidth) * 100;

    if (percentage < 0) {
      percentage = 100 + percentage;
    }

    const isWrapping =
      (lastPercentage > 80 && percentage < 20) ||
      (lastPercentage < 20 && percentage > 80) ||
      forceReset;

    progressCounter.textContent = `${Math.round(percentage)}`;
    targetProgressScale = percentage / 100;

    if (isWrapping) {
      currentProgressScale = targetProgressScale;
      progressBar.style.transform = `scaleX(${currentProgressScale})`;


    }

    lastPercentage = percentage;
  };

  const animate = (seqenceWidth, forceProgressReset = false) => {
    currentScrollX = lerp(currentScrollX, targetScrollX, smoothFactor);
    scroller.style.transform = `translateX(-${currentScrollX}px)`;

    updateProgress(seqenceWidth, forceProgressReset);

    if (!forceProgressReset) {
      currentProgressScale = lerp(
        currentProgressScale,
        targetProgressScale,
        smoothFactor
      );
      progressBar.style.transform = `scaleX(${currentProgressScale})`;

    }

    if (Math.abs(targetScrollX - currentScrollX) < 0.01) {
      isAnimating = false;
    } else {
      requestAnimationFrame(() => animate(seqenceWidth));
    }
  };

  const seqenceWidth = setupScroll();
  updateProgress(seqenceWidth, true);
  progressBar.style.transform = `scaleX(${currentProgressScale})`;

  container.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      targetScrollX += e.deltaY;

      const needsReset = checkBoundryAndReset(seqenceWidth);

      if (!isAnimating) {
        isAnimating = true;
        requestAnimationFrame(() => animate(seqenceWidth, needsReset));
      }
    },
    { passive: false }
  );

  container.addEventListener("touchstart", (e) => {
    isDown = true;
    lastTouchX = e.touches[0].clientX;
    lastTouchTime = Date.now();
    targetScrollX = currentScrollX;
  });

  container.addEventListener("touchmove", (e) => {
    if (!isDown) return;
    e.preventDefault();

    const currentTouchX = e.touches[0].clientX;
    const touchDelta = lastTouchX - currentTouchX;

    const currentTime = Date.now();
    const timeDelta = currentTime - lastTouchTime;
    if (timeDelta > 0) {
      touchVelocity = (touchDelta / timeDelta) * 15;
    }

    lastTouchX = currentTouchX;
    lastTouchTime = currentTime;

    const needsReset = checkBoundryAndReset(seqenceWidth);
    if (!isAnimating) {
      isAnimating = true;
      requestAnimationFrame(() => animate(seqenceWidth, needsReset));
    }
  });

  container.addEventListener("touchend", () => {
    isDown = false;

    if (Math.abs(touchVelocity) > 0.1) {
      targetScrollX += touchVelocity * 20;

      const decayVelocity = () => {
        touchVelocity *= 0.95;

        if (Math.abs(touchVelocity) > 0.1) {
          targetScrollX += touchVelocity;
          const needsReset = checkBoundryAndReset(seqenceWidth);

          if (needsReset) {
            updateProgress(seqenceWidth, true);
          }

          requestAnimationFrame(decayVelocity);
        }
      };
      requestAnimationFrame(decayVelocity);
    }
  });
    
    console.log("Progress Scale:", currentProgressScale);
  console.log(progressBar)
});
