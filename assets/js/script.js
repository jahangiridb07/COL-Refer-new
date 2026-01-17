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

// ------------------ LANGUAGE ------------------
const lang = (document.documentElement.lang || "en").toLowerCase();

const TEXT = {
  en: {
    otp_ref_title: "Verify It’s You",
    otp_ref_sub: "Check your phone for a 6-digit OTP and enter it here to verify it’s you.",

    otp_track_title: "Track Your Referral",
    otp_track_sub: "Check your phone for a 6-digit OTP and enter it here to verify it’s you.",

    timer_prefix: "Resend code in",
    alert_ref_ok: "Referral verified successfully! (Demo)",
    alert_track_ok: "Tracking verified successfully! (Demo)",
    alert_resend: "Resend code clicked (Demo)"
  },
  bn: {
    otp_ref_title: "এটি আপনি কিনা যাচাই করুন",
    otp_ref_sub: "যাচাই করার জন্য আপনার ফোনে পাঠানো ৬-সংখ্যার OTP কোডটি এখানে লিখুন",

    otp_track_title: "আপনার রেফারেল ট্র্যাক করুন",
    otp_track_sub: "যাচাই করার জন্য আপনার ফোনে পাঠানো ৬-সংখ্যার OTP কোডটি এখানে লিখুন",

    timer_prefix: "কোড পুনরায় পাঠাতে বাকি",
    alert_ref_ok: "রেফারেল যাচাই সফল হয়েছে! (ডেমো)",
    alert_track_ok: "ট্র্যাকিং যাচাই সফল হয়েছে! (ডেমো)",
    alert_resend: "কোড পুনরায় পাঠান ক্লিক করা হয়েছে (ডেমো)"
  }
};

function t(key) {
  const pack = TEXT[lang] || TEXT.en;
  return pack[key] ?? TEXT.en[key] ?? "";
}

// ------------------ HELPERS ------------------
function isFilled(v) {
  return String(v || "").trim().length > 0;
}

function lockScroll(lock) {
  document.body.style.overflow = lock ? "hidden" : "";
}

function resetOtpBoxes() {
  otpBoxes.forEach((b) => (b.value = ""));
  verifyBtn.disabled = true;
}

function getOtpCode() {
  return otpBoxes.map((b) => b.value).join("");
}

function updateVerifyState() {
  verifyBtn.disabled = getOtpCode().length !== 6;
}

// ✅ Ensure we can localize timer label without changing HTML
function ensureTimerPrefixNode() {
  if (!otpTimer || !otpTimeText) return;

  let prefix = otpTimer.querySelector("#otpTimerPrefix");
  if (!prefix) {
    prefix = document.createElement("span");
    prefix.id = "otpTimerPrefix";
    // insert before the existing time span
    otpTimer.insertBefore(prefix, otpTimeText);
    // add a space between prefix and time
    otpTimer.insertBefore(document.createTextNode(" "), otpTimeText);
  }
  prefix.textContent = t("timer_prefix");
}

// ------------------ NAV (Mobile) ------------------
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    mainNav.classList.toggle("show");
    menuToggle.setAttribute("aria-expanded", mainNav.classList.contains("show"));
  });

  document.querySelectorAll(".nav-dd").forEach((dd) => {
    const btn = dd.querySelector(".dd-btn");
    const menu = dd.querySelector(".dd-menu");
    if (!btn || !menu) return;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".dd-menu.show").forEach((m) => {
        if (m !== menu) m.classList.remove("show");
      });
      menu.classList.toggle("show");
    });
  });

  document.addEventListener("click", () => {
    mainNav.classList.remove("show");
    document.querySelectorAll(".dd-menu.show").forEach((m) => m.classList.remove("show"));
    menuToggle.setAttribute("aria-expanded", "false");
  });

  mainNav.addEventListener("click", (e) => e.stopPropagation());

  document.querySelectorAll("#mainNav a.nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("show");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ------------------ REFERRAL FLOW ------------------
function updateContinueState() {
  if (!continueBtn) return;
  continueBtn.disabled = !(isFilled(customerId?.value) && isFilled(fullName?.value));
}

customerId?.addEventListener("input", updateContinueState);
fullName?.addEventListener("input", updateContinueState);

continueBtn?.addEventListener("click", () => {
  otpMode = "referral";
  openOtpModal({
    title: t("otp_ref_title"),
    sub: t("otp_ref_sub"),
    showTimer: false
  });
});

// ------------------ TRACK FLOW ------------------
trackBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  openTrackModal();
});

function updateTrackContinueState() {
  if (!trackContinueBtn) return;
  trackContinueBtn.disabled = !(isFilled(trackCustomerId?.value) && isFilled(trackName?.value));
}

trackCustomerId?.addEventListener("input", updateTrackContinueState);
trackName?.addEventListener("input", updateTrackContinueState);

trackContinueBtn?.addEventListener("click", () => {
  otpMode = "track";
  closeTrackModal();

  openOtpModal({
    title: t("otp_track_title"),
    sub: t("otp_track_sub"),
    showTimer: true
  });

  startOtpTimer(120);
});

// ------------------ TRACK MODAL OPEN/CLOSE ------------------
function openTrackModal() {
  if (!trackOverlay) return;

  lockScroll(true);
  trackOverlay.classList.remove("hidden");
  trackOverlay.setAttribute("aria-hidden", "false");

  if (trackCustomerId) trackCustomerId.value = "";
  if (trackName) trackName.value = "";
  if (trackContinueBtn) trackContinueBtn.disabled = true;

  setTimeout(() => trackCustomerId?.focus(), 0);
}

function closeTrackModal() {
  if (!trackOverlay) return;

  trackOverlay.classList.add("hidden");
  trackOverlay.setAttribute("aria-hidden", "true");
  lockScroll(false);
}

trackClose?.addEventListener("click", closeTrackModal);

trackOverlay?.addEventListener("click", (e) => {
  if (e.target === trackOverlay) closeTrackModal();
});

// ------------------ OTP MODAL OPEN/CLOSE ------------------
function openOtpModal({ title, sub, showTimer }) {
  if (!otpOverlay) return;

  lockScroll(true);

  otpTitle.textContent = title;
  otpSub.textContent = sub;

  otpTimer?.classList.toggle("hidden", !showTimer);

  // ✅ localize timer label when it is visible
  if (showTimer) ensureTimerPrefixNode();

  resetOtpBoxes();

  otpOverlay.classList.remove("hidden");
  otpOverlay.setAttribute("aria-hidden", "false");

  setTimeout(() => otpBoxes?.[0]?.focus(), 0);
}

function closeOtpModal() {
  if (!otpOverlay) return;

  otpOverlay.classList.add("hidden");
  otpOverlay.setAttribute("aria-hidden", "true");
  lockScroll(false);
  stopOtpTimer();
}

otpClose?.addEventListener("click", closeOtpModal);

otpOverlay?.addEventListener("click", (e) => {
  if (e.target === otpOverlay) closeOtpModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && otpOverlay && !otpOverlay.classList.contains("hidden")) closeOtpModal();
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
verifyBtn?.addEventListener("click", () => {
  const code = getOtpCode();
  if (code.length !== 6) return;

  if (otpMode === "referral") {
    alert(t("alert_ref_ok"));
  } else {
    alert(t("alert_track_ok"));
  }
  closeOtpModal();
});

// ------------------ RESEND / RETURN ------------------
resendLink?.addEventListener("click", (e) => {
  e.preventDefault();
  if (otpMode === "track") {
    startOtpTimer(120);
  }
  alert(t("alert_resend"));
});

returnLink?.addEventListener("click", (e) => {
  e.preventDefault();
  closeOtpModal();
});

// ------------------ OTP TIMER ------------------
function startOtpTimer(seconds) {
  stopOtpTimer();
  timerSeconds = seconds;

  ensureTimerPrefixNode(); // ✅ make sure prefix exists + localized
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
  if (!video || !btn) return;

  if (video.paused) {
    video.play();
    btn.classList.add("is-hidden");
  } else {
    video.pause();
    btn.classList.remove("is-hidden");
  }
}

btn?.addEventListener("click", togglePlay);

card?.addEventListener("click", (e) => {
  if (e.target === btn) return;
  togglePlay();
});

video?.addEventListener("ended", () => btn?.classList.remove("is-hidden"));
video?.addEventListener("pause", () => btn?.classList.remove("is-hidden"));
video?.addEventListener("play", () => btn?.classList.add("is-hidden"));

// CTA button scroll to referral form
const ctaBtn = document.getElementById("ctaBtn");
ctaBtn?.addEventListener("click", () => {
  const form = document.getElementById("refForm");
  if (form) form.scrollIntoView({ behavior: "smooth", block: "center" });
});

// =====================
// FAQ ACCORDION
// =====================
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  const btn = item.querySelector(".faq-q");
  if (!btn) return;

  btn.addEventListener("click", () => {
    faqItems.forEach((other) => {
      if (other !== item) {
        other.classList.remove("open");
        const b = other.querySelector(".faq-q");
        if (b) b.setAttribute("aria-expanded", "false");
      }
    });

    const isOpen = item.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
});

// ------------------ FOOTER NEWSLETTER (demo) ------------------
const newsletterForm = document.getElementById("newsletterForm");
newsletterForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("newsletterEmail")?.value?.trim() || "";
  alert("Subscribed: " + email + " (Demo)");
  newsletterForm.reset();
});
