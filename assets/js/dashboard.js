(() => {
  const $ = (s, r=document) => r.querySelector(s);

  // Demo data (replace with API)
  const data = {
    customerName: "Golam Nabi Chowdhury",
    tracking: "COLSUB-0000001625",
    steps: [
      { title: "Request Received", desc: "Your application has been received.", status: "done" },
      { title: "Under Review", desc: "Our team is reviewing your application and location details.", status: "active" },
      { title: "Payment", desc: "Complete payment to proceed with installation.", status: "pending" }
    ],
    package: { speed: 70, price: 792, duration: "10 Month", free: "+2 Month Free", total: 9500, type: "Fiber", saved: 1900 },
    profile: { name: "Golam Nabi Chowdhury", email: "dulu20l@hotmail.com", phone: "01711522993", address: "Unnamed Road, Chittagong, Bangladesh" }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const taka = (n) => Number(n).toLocaleString("en-US");

  // ✅ FIXED: no per-step line, only dot. CSS draws one continuous line.
  const renderTimeline = () => {
    const wrap = $("#timeline");
    if (!wrap) return;

    wrap.innerHTML = "";
    data.steps.forEach((s, i) => {
      const el = document.createElement("div");
      el.className = `step ${s.status}`;

      const dotContent =
        s.status === "done" ? `<i class="fa-solid fa-check"></i>` : String(i + 1);

      el.innerHTML = `
        <div class="step__rail">
          <div class="step__dot">${dotContent}</div>
        </div>

        <div class="step__text">
          <div class="step__h">${s.title}</div>
          <div class="step__p">${s.desc}</div>
        </div>
      `;

      wrap.appendChild(el);
    });
  };

  const initCopy = () => {
    const btn = $("#copyTracking");
    const tn = $("#trackingNumber");
    const tag = $("#copiedTag");
    if (!btn || !tn) return;

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(data.tracking);
      } catch {
        const r = document.createRange();
        r.selectNodeContents(tn);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        document.execCommand("copy");
        sel.removeAllRanges();
      }

      if (tag) {
        tag.classList.add("show");
        setTimeout(() => tag.classList.remove("show"), 900);
      }
    });
  };

  const initMobileNav = () => {
    const btn = $("#hamburger");
    const menu = $("#mobileNav");
    if (!btn || !menu) return;
    btn.addEventListener("click", () => menu.classList.toggle("show"));
  };

  const hydrate = () => {
    $("#greetingText") && ($("#greetingText").textContent = greeting());
    $("#customerName") && ($("#customerName").textContent = data.customerName);

    $("#trackingNumber") && ($("#trackingNumber").textContent = data.tracking);

    $("#pkgSpeed") && ($("#pkgSpeed").textContent = String(data.package.speed));
    $("#pkgPrice") && ($("#pkgPrice").textContent = String(data.package.price));
    $("#pkgDuration") && ($("#pkgDuration").textContent = data.package.duration);
    $("#pkgFree") && ($("#pkgFree").textContent = data.package.free);
    $("#pkgTotal") && ($("#pkgTotal").textContent = taka(data.package.total));
    $("#pkgType") && ($("#pkgType").textContent = data.package.type);
    $("#pkgSaved") && ($("#pkgSaved").textContent = taka(data.package.saved));

    $("#profileName") && ($("#profileName").textContent = data.profile.name);
    $("#profileEmail") && ($("#profileEmail").textContent = data.profile.email);
    $("#profilePhone") && ($("#profilePhone").textContent = data.profile.phone);
    $("#profileAddress") && ($("#profileAddress").textContent = data.profile.address);

    renderTimeline();
    initCopy();
    initMobileNav();

    $("#changeProfile")?.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Change clicked (demo). Connect this to your edit profile page/modal.");
    });
  };

  document.addEventListener("DOMContentLoaded", hydrate);
})();
