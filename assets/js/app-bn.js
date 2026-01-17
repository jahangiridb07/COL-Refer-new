(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const STORAGE_KEY = "selectedPlanV1";

  const formatTaka = (n) => {
    const num = Number(n);
    if (Number.isFinite(num)) return num.toLocaleString("en-US");
    return String(n ?? "");
  };

  // Plan catalog (optional): editable JSON embedded in new-connection-bn.html
  const getPlanCatalog = () => {
    const el = document.getElementById("planCatalog");
    if (!el) return null;
    try { return JSON.parse(el.textContent || "{}"); } catch { return null; }
  };

  const getPlansForSpeed = (speed) => {
    const cat = getPlanCatalog();
    if (!cat) return null;
    return cat[String(speed)] || null;
  };


  // WiFi animation (both pages)
  const wifi = $("#wifiSignal");
  if (wifi) {
    let level = 1;
    setInterval(() => {
      wifi.classList.remove("level-1","level-2","level-3");
      wifi.classList.add("level-"+level);
      level = level === 3 ? 1 : level + 1;
    }, 500);
  }

  // Modal helpers
  const openModal = (overlayEl, modalEl) => {
    overlayEl?.classList.add("open");
    modalEl?.classList.add("open");
    overlayEl?.setAttribute("aria-hidden","false");
    modalEl?.setAttribute("aria-hidden","false");
  };
  const closeModal = (overlayEl, modalEl) => {
    overlayEl?.classList.remove("open");
    modalEl?.classList.remove("open");
    overlayEl?.setAttribute("aria-hidden","true");
    modalEl?.setAttribute("aria-hidden","true");
  };

  // Track + OTP (shared)
  function initTrackAndOtp() {
    const trackBtn = $("#trackRequestBtn");
    const tyrOverlay = $("#tyrOverlay");
    const tyrModal = $("#tyrModal");
    const tyrClose = $("#tyrClose");
    const tyrPhone = $("#tyrPhone");
    const tyrContinue = $("#tyrContinue");

    const otpOverlay = $("#otpOverlay");
    const otpModal = $("#otpModal");
    const otpClose = $("#otpClose");
    const otpBack  = $("#otpBack");
    const otpResend= $("#otpResend");
    const otpVerifyBtn = $("#otpVerifyBtn");
    const otpInputsWrap = $("#otpInputs");
    const otpInputs = otpInputsWrap ? $$(".otp-in", otpInputsWrap) : [];

    const openTYR = () => {
      if (!tyrOverlay || !tyrModal) return;
      openModal(tyrOverlay, tyrModal);
      if (tyrPhone) tyrPhone.value = "";
      if (tyrContinue) {
        tyrContinue.disabled = true;
        tyrContinue.classList.remove("enabled");
      }
      setTimeout(() => tyrPhone?.focus(), 50);
    };
    const closeTYR = () => closeModal(tyrOverlay, tyrModal);

    const openOTP = () => {
      if (!otpOverlay || !otpModal) return;
      openModal(otpOverlay, otpModal);
      otpInputs.forEach(i => i.value = "");
      if (otpVerifyBtn) {
        otpVerifyBtn.disabled = true;
        otpVerifyBtn.classList.remove("enabled");
      }
      setTimeout(() => otpInputs[0]?.focus(), 50);
    };
    const closeOTP = () => closeModal(otpOverlay, otpModal);

    trackBtn?.addEventListener("click", (e) => { e.preventDefault(); openTYR(); });
    tyrOverlay?.addEventListener("click", closeTYR);
    tyrClose?.addEventListener("click", closeTYR);

    tyrPhone?.addEventListener("input", () => {
      tyrPhone.value = tyrPhone.value.replace(/\D/g,"");
      const can = tyrPhone.value.length >= 10;
      if (!tyrContinue) return;
      tyrContinue.disabled = !can;
      tyrContinue.classList.toggle("enabled", can);
    });

    tyrContinue?.addEventListener("click", () => {
      if (tyrContinue.disabled) return;
      closeTYR();
      openOTP();
    });

    otpOverlay?.addEventListener("click", closeOTP);
    otpClose?.addEventListener("click", closeOTP);

    otpBack?.addEventListener("click", (e) => {
      e.preventDefault();
      closeOTP();
      openTYR();
    });

    otpResend?.addEventListener("click", (e) => {
      e.preventDefault();
      alert("OTP resent! (demo)");
    });

    const updateOtpButton = () => {
      const code = otpInputs.map(i=>i.value).join("");
      const ok = code.length === 6;
      if (!otpVerifyBtn) return;
      otpVerifyBtn.disabled = !ok;
      otpVerifyBtn.classList.toggle("enabled", ok);
    };

    otpInputs.forEach((inp, idx) => {
      inp.addEventListener("input", () => {
        inp.value = inp.value.replace(/\D/g,"");
        if (inp.value && idx < otpInputs.length - 1) otpInputs[idx+1].focus();
        updateOtpButton();
      });
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !inp.value && idx > 0) otpInputs[idx-1].focus();
      });
    });

    otpInputs[0]?.addEventListener("paste", (e) => {
      const t = (e.clipboardData || window.clipboardData).getData("text");
      const digits = (t || "").replace(/\D/g,"").slice(0,6);
      if (!digits) return;
      e.preventDefault();
      digits.split("").forEach((d,i)=>{ if (otpInputs[i]) otpInputs[i].value = d; });
      otpInputs[Math.min(digits.length,6)-1]?.focus();
      updateOtpButton();
    });

    otpVerifyBtn?.addEventListener("click", () => {
      if (otpVerifyBtn.disabled) return;
      alert("OTP Verified (demo)");
      closeOTP();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (otpModal?.classList.contains("open")) closeOTP();
      else if (tyrModal?.classList.contains("open")) closeTYR();
    });
  }

  // Step-1 logic
  function initStep1(){
    const gridLite = $("#gridLite");
    const gridRegular = $("#gridRegular");
    const vpOverlay = $("#vpOverlay");
    const vpDrawer = $("#vpDrawer");
    const vpClose = $("#vpClose");
    const vpSpeed = $("#vpSpeed");
    const vpRate = $("#vpRate");
    const vpPlans = $("#vpPlans");
    const vpAcc = $("#vpAcc");
    const vpAccBtn = $("#vpAccBtn");
    const vpContinue = $("#vpContinue");
    const nextBtn = $("#ncNextBtn");

    const lite = [
      { speed: 15, monthly: 525 },
      { speed: 20, monthly: 630 },
      { speed: 30, monthly: 735 }
    ];
    const regular = [
      { speed: 70, monthly: 950 },
      { speed: 80, monthly: 1150 },
      { speed: 100, monthly: 1470 },
      { speed: 120, monthly: 1970 },
      { speed: 150, monthly: 2500 },
    ];

    const buildAdvancePlans = (m) => ([
      { months: 2,  instFee: 500,  save: 500,  total: (m*2)+500, freeMonths: 0 },
      { months: 3,  instFee: 0,    save: 1000, total: (m*3),     freeMonths: 0, freeInstall: true },
      { months: 5,  instFee: 0,    save: 1950, total: (m*5),     freeMonths: 1, freeInstall: true },
      { months: 10, instFee: 0,    save: 2900, total: (m*10),    freeMonths: 2, freeInstall: true, justPerMonth: Math.round((m*10)/12), oldTotal: (m*10)+1900 }
    ]);

    const pkgCard = ({speed, monthly}) => {
      const el = document.createElement("div");
      el.className = "pkg";
      el.tabIndex = 0;
      el.dataset.speed = String(speed);
      el.dataset.monthly = String(monthly);
      el.innerHTML = `
        <div class="pkg-left">
          <div class="pkg-num">${speed}</div>
          <div class="pkg-meta">
            <div class="pkg-unit">Mbps</div>
            <div class="pkg-price">${formatTaka(monthly)} ৳</div>
          </div>
          <div class="pkg-view" style="font-size:12px">View Plans </div>
          <div class="pkg-arrow"><i class="fa-solid fa-chevron-right"></i></div>
        </div> 
      `;
      return el;
    };

    const renderGrid = (grid, items) => {
      if (!grid) return;
      items.forEach(item => grid.appendChild(pkgCard(item)));
    };

    renderGrid(gridLite, lite);
    renderGrid(gridRegular, regular);

    const openDrawer = () => { vpOverlay?.classList.add("open"); vpDrawer?.classList.add("open"); };
    const closeDrawer = () => { vpOverlay?.classList.remove("open"); vpDrawer?.classList.remove("open"); };

    const setContinueEnabled = (on) => {
      if (!vpContinue) return;
      vpContinue.disabled = !on;
      vpContinue.classList.toggle("enabled", on);
    };

    let selected = null;

    const selectPackageCard = (card) => {
      $$(".pkg").forEach(c=>c.classList.remove("active"));
      card.classList.add("active");

      const speed = Number(card.dataset.speed);
      const monthly = Number(card.dataset.monthly);

      if (vpSpeed) vpSpeed.textContent = String(speed);
      if (vpRate) vpRate.textContent = formatTaka(monthly);

            const cfg = getPlansForSpeed(speed);

      // 1 Month (top card)
      const oneMonthTotal = (cfg && cfg.oneMonth && Number.isFinite(Number(cfg.oneMonth.total)))
        ? Number(cfg.oneMonth.total)
        : (monthly + 1000);
      $("#vpOneMonthPrice") && ($("#vpOneMonthPrice").textContent = `${formatTaka(oneMonthTotal)} ৳`);

      selected = { speed, total: oneMonthTotal, saved: 0, duration_html: "1 Month" };

      if (vpPlans){
        vpPlans.innerHTML = "";
        const plans = (cfg && Array.isArray(cfg.advance) && cfg.advance.length)
          ? cfg.advance
          : buildAdvancePlans(monthly); // fallback if catalog missing


        plans.forEach((p) => {
          const item = document.createElement("div");
          item.className = "vp-item";
          item.tabIndex = 0;

          const titleFree = p.freeMonths ? ` <span class="vp-free">+${p.freeMonths} Month Free</span>` : "";
          const leftMeta = p.freeInstall
            ? `<i class="fa-regular fa-circle-check vp-save"></i> Free Installation</span> <i class="fa-regular fa-circle-check vp-save"></i> Save: ${formatTaka(p.save)}৳</span>`
            : `+ Installation fee: ${p.instFee} ৳ <i class="fa-regular fa-circle-check vp-save"></i> Save: ${formatTaka(p.save)}৳</span>`;

          item.innerHTML = `
            <div>
              <div class="vp-itemTitle">${p.months} Month${titleFree}</div>
              <div class="vp-itemMeta">${leftMeta}</div>
              ${(() => {
                const denom = (Number(p.months) || 0) + (Number(p.freeMonths) || 0);
                const per = (p.justPerMonth != null)
                  ? Number(p.justPerMonth)
                  : (p.freeMonths && denom > 0 && Number.isFinite(Number(p.total)))
                    ? Math.round(Number(p.total) / denom)
                    : null;
                return per != null ? `<div class="vp-per"><i class="fa-solid fa-square-check"></i> Just ${formatTaka(per)} ৳/month</div>` : "";
              })()}
            </div>
            <div style="text-align:right">
              ${p.oldTotal ? `<div class="vp-oldPrice">${formatTaka(p.oldTotal)} ৳</div>` : ""}
              <div class="vp-cardPrice">${formatTaka(p.total)} ৳</div>
            </div>
          `;

          item.addEventListener("click", () => {
            $$(".vp-item").forEach(x=>x.classList.remove("active"));
            item.classList.add("active");

            selected = {
              speed,
              total: p.total,
              saved: p.save,
              duration_html: p.freeMonths ? `${p.months} Month <span class="vp-free">+${p.freeMonths} Month Free</span>` : `${p.months} Month`
            };
            setContinueEnabled(true);
          });

          vpPlans.appendChild(item);
        });
      }

      setContinueEnabled(false);
      openDrawer();
    };

    const bindGrid = (grid) => {
      if (!grid) return;
      grid.addEventListener("click", (e) => {
        const card = e.target.closest(".pkg");
        if (card) selectPackageCard(card);
      });
      grid.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const card = e.target.closest(".pkg");
          if (card) selectPackageCard(card);
        }
      });
    };

    bindGrid(gridLite);
    bindGrid(gridRegular);

    vpOverlay?.addEventListener("click", closeDrawer);
    vpClose?.addEventListener("click", closeDrawer);
    vpAccBtn?.addEventListener("click", () => vpAcc?.classList.toggle("open"));

    vpContinue?.addEventListener("click", () => {
      if (vpContinue.disabled || !selected) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
      window.location.href = "installation-details-bn.html";
    });

    const updateNext = () => {
      const has = !!localStorage.getItem(STORAGE_KEY);
      if (!nextBtn) return;
      nextBtn.disabled = !has;
      nextBtn.classList.toggle("enabled", has);
    };
    updateNext();

    nextBtn?.addEventListener("click", () => {
      if (nextBtn.disabled) return;
      window.location.href = "installation-details-bn.html";
    });

    initTrackAndOtp();
  }


  // Step-2 logic
  function initStep2(){
    const selSpeed = $("#selSpeed");
    const selDuration = $("#selDuration");
    const selTotal = $("#selTotal");
    const selSaved = $("#selSaved");
    const confirmBtn = $("#confirmBtn");

    let data = null;
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { data = null; }

    if (data){
      selSpeed && (selSpeed.textContent = data.speed ?? "70");
      selDuration && (selDuration.innerHTML = data.duration_html ?? "10 Month <span class='vp-free'>+2 Month Free</span>");
      selTotal && (selTotal.textContent = `${formatTaka(data.total ?? 9500)} ৳`);
      selSaved && (selSaved.textContent = formatTaka(data.saved ?? 0));
    }

    $("#selClose")?.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = "../../new-connection-bn.html";
    });

    $("#editBtn")?.addEventListener("click", () => {
      window.location.href = "../../new-connection-bn.html";
    });

    const required = ["name","mobile","location"];
    const form = $("#installForm");

    $("#mobile")?.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g,"");
    });

    const valid = () => {
      if (!localStorage.getItem(STORAGE_KEY)) return false;
      return required.every(id => (document.getElementById(id)?.value || "").trim().length > 0);
    };

    const updateConfirm = () => {
      const ok = valid();
      if (!confirmBtn) return;
      confirmBtn.disabled = !ok;
      confirmBtn.classList.toggle("enabled", ok);
    };

    form?.addEventListener("input", updateConfirm);
    updateConfirm();

    confirmBtn?.addEventListener("click", () => {
      if (confirmBtn.disabled) return;
      alert("Request Confirmed (demo)");
    });

    $("#useLocation")?.addEventListener("click", () => {
      const loc = $("#location");
      if (!loc) return;
      if (!navigator.geolocation) return alert("Geolocation not supported.");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          loc.value = `Lat ${pos.coords.latitude.toFixed(5)}, Lng ${pos.coords.longitude.toFixed(5)}`;
          updateConfirm();
        },
        () => alert("Location permission denied.")
      );
    });

    initTrackAndOtp();
  }

  // Boot
  const page = document.body?.dataset?.page;
  if (page === "step1") initStep1();
  if (page === "step2") initStep2();
})();

// Location permission + Add Location map flow
document.addEventListener("DOMContentLoaded", function () {
  const $ = (s, r = document) => r.querySelector(s);

  const useBtn = $("#useLocation");
  const locOverlay = $("#locOverlay");
  const locClose = $("#locClose");
  const locAllow = $("#locAllow");

  const mapOverlay = $("#mapOverlay");
  const mapClose = $("#mapClose");
  const mapSave = $("#mapSave");
  const mapFrame = $("#mapFrame");
  const mapLoading = $("#mapLoading");

  const locationInput = $("#location");

  if (!useBtn || !locOverlay || !locAllow || !mapOverlay || !mapSave || !mapFrame) {
    console.warn("Location modal not initialized: missing elements");
    return;
  }

  let lastCoords = null;

  const open = (el) => {
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  };

  const close = (el) => {
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".loc-overlay.open, .map-overlay.open")) {
      document.body.classList.remove("no-scroll");
    }
  };

  const setMapLoading = (v) => {
    if (mapLoading) mapLoading.style.display = v ? "flex" : "none";
    mapSave.disabled = v || !lastCoords;
  };

  const setMapSrc = (lat, lon) => {
    const d = 0.01;
    const left = lon - d,
      right = lon + d,
      top = lat + d,
      bottom = lat - d;
    mapFrame.src =
      "https://www.openstreetmap.org/export/embed.html?" +
      "bbox=" +
      encodeURIComponent(`${left},${bottom},${right},${top}`) +
      "&layer=mapnik&marker=" +
      encodeURIComponent(`${lat},${lon}`);
  };

  // Click highlighted button -> open permission popup
  useBtn.addEventListener("click", (e) => {
    e.preventDefault();
    open(locOverlay);
  });

  locClose && locClose.addEventListener("click", () => close(locOverlay));
  locOverlay.addEventListener("click", (e) => {
    if (e.target === locOverlay) close(locOverlay);
  });

  mapClose && mapClose.addEventListener("click", () => close(mapOverlay));
  mapOverlay.addEventListener("click", (e) => {
    if (e.target === mapOverlay) close(mapOverlay);
  });

  // Click Allow -> open map popup immediately, then request browser location
  locAllow.addEventListener("click", () => {
    close(locOverlay);
    open(mapOverlay);

    lastCoords = null;
    setMapLoading(true);

    if (!navigator.geolocation) {
      setMapLoading(false);
      alert("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        lastCoords = { lat, lon };
        setMapSrc(lat, lon);
        setMapLoading(false);
        mapSave.disabled = false;
      },
      (err) => {
        setMapLoading(false);
        if (err && err.code === 1) {
          alert("Location permission was denied.");
        } else {
          alert("Could not get location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  // Save -> fill location input
  mapSave.addEventListener("click", () => {
    if (lastCoords && locationInput) {
      locationInput.value = `Lat ${lastCoords.lat.toFixed(6)}, Lng ${lastCoords.lon.toFixed(6)}`;
    }
    close(mapOverlay);
  });
});
