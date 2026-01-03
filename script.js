// ------------------ REFERRAL FORM ------------------
const customerId = document.getElementById("customerId");
const fullName = document.getElementById("fullName");
const continueBtn = document.getElementById("continueBtn");

// ------------------ OTP MODAL (Shared) ------------------
const otpOverlay = document.getElementById("otpOverlay");
const otpClose = document.getElementById("otpClose");
const verifyBtn = document.getElementById("verifyBtn");
const otpBoxes = Array.from(document.querySelectorAll(".otp-box"));

const otpTitle = document.getElementById("otpTitle");
const otpSub = document.getElementById("otpSub");

const otpTimer = document.getElementById("otpTimer");
const otpTimeText = document.getElementById("otpTimeText");

const resendLink = document.getElementById("resendLink");
const returnLink = document.getElementById("returnLink");

// ------------------ TRACK MODAL ------------------
const trackBtn = document.getElementById("trackBtn");
const trackOverlay = document.getElementById("trackOverlay");
const trackClose = document.getElementById("trackClose");
const trackCustomerId = document.getElementById("trackCustomerId");
const trackName = document.getElementById("trackName");
const trackContinueBtn = document.getElementById("trackContinueBtn");

// ------------------ STATE ------------------
let otpMode = "referral"; // "referral" | "track"
let timerInterval = null;
let timerSeconds = 120;

// ------------------ HELPERS ------------------
function isFilled(v) {
  return String(v || "").trim().length > 0;
}

function lockScroll(lock) {
  document.body.style.overflow = lock ? "hidden" : "";
}

function resetOtpBoxes() {
  otpBoxes.forEach(b => (b.value = ""));
  verifyBtn.disabled = true;
}

function getOtpCode() {
  return otpBoxes.map(b => b.value).join("");
}

function updateVerifyState() {
  verifyBtn.disabled = getOtpCode().length !== 6;
}

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

// Toggle mobile menu
menuToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  mainNav.classList.toggle("show");
  menuToggle.setAttribute("aria-expanded", mainNav.classList.contains("show"));
});

// Dropdown logic (works for all .nav-dd)
document.querySelectorAll(".nav-dd").forEach(dd => {
  const btn = dd.querySelector(".dd-btn");
  const menu = dd.querySelector(".dd-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();

    // close other dropdowns
    document.querySelectorAll(".dd-menu.show").forEach(m => {
      if (m !== menu) m.classList.remove("show");
    });

    menu.classList.toggle("show");
  });
});

// Click outside closes everything
document.addEventListener("click", () => {
  mainNav.classList.remove("show");
  document.querySelectorAll(".dd-menu.show").forEach(m => m.classList.remove("show"));
  menuToggle.setAttribute("aria-expanded", "false");
});

// Prevent inside clicks from closing menu
mainNav.addEventListener("click", (e) => e.stopPropagation());

// Close menu after clicking any normal link (not dropdown button)
document.querySelectorAll("#mainNav a.nav-link").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("show");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});


// ------------------ REFERRAL FLOW ------------------
function updateContinueState() {
  continueBtn.disabled = !(isFilled(customerId.value) && isFilled(fullName.value));
}
customerId.addEventListener("input", updateContinueState);
fullName.addEventListener("input", updateContinueState);

continueBtn.addEventListener("click", () => {
  otpMode = "referral";
  openOtpModal({
    title: "Verify It’s You",
    sub: "Check your phone for a 6-digit OTP and enter it here to verify it’s you.",
    showTimer: false
  });
});

// ------------------ TRACK FLOW ------------------
trackBtn.addEventListener("click", (e) => {
  e.preventDefault();
  openTrackModal();
});

function updateTrackContinueState() {
  trackContinueBtn.disabled = !(isFilled(trackCustomerId.value) && isFilled(trackName.value));
}
trackCustomerId.addEventListener("input", updateTrackContinueState);
trackName.addEventListener("input", updateTrackContinueState);

trackContinueBtn.addEventListener("click", () => {
  otpMode = "track";
  closeTrackModal();

  openOtpModal({
    title: "Track Your Referral",
    sub: "Check your phone for a 6-digit OTP and enter it here to verify it’s you.",
    showTimer: true
  });

  startOtpTimer(120);
});

// ------------------ TRACK MODAL OPEN/CLOSE ------------------
function openTrackModal() {
  lockScroll(true);
  trackOverlay.classList.remove("hidden");
  trackOverlay.setAttribute("aria-hidden", "false");

  trackCustomerId.value = "";
  trackName.value = "";
  trackContinueBtn.disabled = true;

  setTimeout(() => trackCustomerId.focus(), 0);
}

function closeTrackModal() {
  trackOverlay.classList.add("hidden");
  trackOverlay.setAttribute("aria-hidden", "true");
  lockScroll(false);
}

trackClose.addEventListener("click", closeTrackModal);
trackOverlay.addEventListener("click", (e) => {
  if (e.target === trackOverlay) closeTrackModal();
});

// ------------------ OTP MODAL OPEN/CLOSE ------------------
function openOtpModal({ title, sub, showTimer }) {
  lockScroll(true);

  otpTitle.textContent = title;
  otpSub.textContent = sub;

  otpTimer.classList.toggle("hidden", !showTimer);

  resetOtpBoxes();

  otpOverlay.classList.remove("hidden");
  otpOverlay.setAttribute("aria-hidden", "false");

  setTimeout(() => otpBoxes[0].focus(), 0);
}

function closeOtpModal() {
  otpOverlay.classList.add("hidden");
  otpOverlay.setAttribute("aria-hidden", "true");
  lockScroll(false);
  stopOtpTimer();
}

otpClose.addEventListener("click", closeOtpModal);
otpOverlay.addEventListener("click", (e) => {
  if (e.target === otpOverlay) closeOtpModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !otpOverlay.classList.contains("hidden")) closeOtpModal();
});

// ------------------ OTP BOX BEHAVIOR ------------------
otpBoxes.forEach((box, idx) => {
  box.addEventListener("input", () => {
    box.value = box.value.replace(/\D/g, "").slice(0, 1);

    if (box.value && idx < otpBoxes.length - 1) otpBoxes[idx + 1].focus();
    updateVerifyState();
  });

  box.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      if (box.value) {
        box.value = "";
        updateVerifyState();
        return;
      }
      if (idx > 0) otpBoxes[idx - 1].focus();
      updateVerifyState();
    }

    if (e.key === "ArrowLeft" && idx > 0) otpBoxes[idx - 1].focus();
    if (e.key === "ArrowRight" && idx < otpBoxes.length - 1) otpBoxes[idx + 1].focus();
  });

  box.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    const digits = (text || "").replace(/\D/g, "").slice(0, 6).split("");

    digits.forEach((d, i) => {
      if (otpBoxes[i]) otpBoxes[i].value = d;
    });

    updateVerifyState();
    otpBoxes[Math.min(digits.length, 5)].focus();
  });
});

// ------------------ VERIFY ------------------
verifyBtn.addEventListener("click", () => {
  const code = getOtpCode();
  if (code.length !== 6) return;

  if (otpMode === "referral") {
    alert("Referral verified successfully! (Demo)");
  } else {
    alert("Tracking verified successfully! (Demo)");
  }
  closeOtpModal();
});

// ------------------ RESEND / RETURN ------------------
resendLink.addEventListener("click", (e) => {
  e.preventDefault();
  if (otpMode === "track") {
    startOtpTimer(120);
  }
  alert("Resend code clicked (Demo)");
});

returnLink.addEventListener("click", (e) => {
  e.preventDefault();
  closeOtpModal();
});

// ------------------ OTP TIMER ------------------
function startOtpTimer(seconds) {
  stopOtpTimer();
  timerSeconds = seconds;
  renderTimer();

  timerInterval = setInterval(() => {
    timerSeconds--;
    renderTimer();

    if (timerSeconds <= 0) {
      stopOtpTimer();
      otpTimeText.textContent = "0:00";
    }
  }, 1000);
}

function stopOtpTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

function renderTimer() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  otpTimeText.textContent = `${m}:${String(s).padStart(2, "0")}`;
}

// =====================
// BENEFIT VIDEO MODAL (FIX)
// =====================
const video = document.getElementById("benefitVideo");
  const btn = document.getElementById("benefitPlayBtn");
  const card = document.getElementById("benefitCard");

  function togglePlay() {
    if (video.paused) {
      video.play();
      btn.classList.add("is-hidden");
    } else {
      video.pause();
      btn.classList.remove("is-hidden");
    }
  }

  btn.addEventListener("click", togglePlay);
  card.addEventListener("click", (e) => {
    // avoid double click conflict when clicking button
    if (e.target === btn) return;
    togglePlay();
  });

  video.addEventListener("ended", () => btn.classList.remove("is-hidden"));
  video.addEventListener("pause", () => btn.classList.remove("is-hidden"));
  video.addEventListener("play", () => btn.classList.add("is-hidden"));


// CTA button scroll to referral form
const ctaBtn = document.getElementById("ctaBtn");
if (ctaBtn) {
  ctaBtn.addEventListener("click", () => {
    // scroll to form (change target if needed)
    const form = document.getElementById("refForm");
    if (form) form.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

// =====================
// FAQ ACCORDION
// =====================
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  const btn = item.querySelector(".faq-q");

  btn.addEventListener("click", () => {
    // close others
    faqItems.forEach((other) => {
      if (other !== item) {
        other.classList.remove("open");
        const b = other.querySelector(".faq-q");
        if (b) b.setAttribute("aria-expanded", "false");
      }
    });

    // toggle current
    const isOpen = item.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
});



// ------------------ FOOTER NEWSLETTER (demo) ------------------
const newsletterForm = document.getElementById("newsletterForm");
if (newsletterForm) {
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("newsletterEmail").value.trim();
    alert("Subscribed: " + email + " (Demo)");
    newsletterForm.reset();
  });
}
