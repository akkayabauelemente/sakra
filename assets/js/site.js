// Handy-Menü, Bildbetrachter, Produkt-Vorbelegung und Formulare (öffnen eine vorbefüllte E-Mail, kein Server).
const header = document.querySelector("[data-header]");
const menuBtn = header && header.querySelector(".menu-btn");

function setMenu(open) {
  if (open) header.style.setProperty("--nav-top", `${header.getBoundingClientRect().bottom}px`);
  header.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
}
if (menuBtn) {
  menuBtn.addEventListener("click", () => setMenu(!header.classList.contains("is-open")));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("is-open")) { setMenu(false); menuBtn.focus(); }
  });
}

// Bildbetrachter: Links mit data-lightbox öffnen das große Bild; ohne JS öffnet der Link das Bild selbst
const lb = document.querySelector("[data-lb]");
if (lb && typeof lb.showModal === "function") {
  const lbImg = lb.querySelector("img");
  let group = [];
  let index = 0;
  const show = (i) => {
    index = (i + group.length) % group.length;
    const link = group[index];
    lbImg.src = link.href;
    lbImg.alt = link.querySelector("img")?.alt || "";
    lb.querySelectorAll("[data-lb-prev],[data-lb-next]").forEach((b) => { b.hidden = group.length < 2; });
  };
  document.querySelectorAll("a[data-lightbox]").forEach((link) => link.addEventListener("click", (e) => {
    e.preventDefault();
    group = [...document.querySelectorAll(`a[data-lightbox="${link.dataset.lightbox}"]`)];
    show(group.indexOf(link));
    lb.showModal();
  }));
  const rtl = document.documentElement.dir === "rtl";
  lb.querySelector("[data-lb-close]").addEventListener("click", () => lb.close());
  lb.querySelector("[data-lb-prev]").addEventListener("click", () => show(index - 1));
  lb.querySelector("[data-lb-next]").addEventListener("click", () => show(index + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") show(index + (rtl ? -1 : 1));
    if (e.key === "ArrowLeft") show(index + (rtl ? 1 : -1));
  });
}

// Vorbelegung aus der Adresse: quote/?urun=<slug> trägt den Produktnamen ins Feld ein
const params = new URLSearchParams(window.location.search);
const mapEl = document.getElementById("urun-map");
const names = mapEl ? JSON.parse(mapEl.textContent) : {};
document.querySelectorAll("[data-param]").forEach((el) => {
  const value = params.get(el.dataset.param);
  if (value) el.value = names[value] || value;
});

document.querySelectorAll("form[data-mailto]").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const lines = [];
    for (const el of form.elements) {
      if (!el.name || el.readOnly) continue;
      const value = el.value.trim();
      if (!value) continue;
      const label = form.querySelector(`label[for="${el.id}"]`)?.firstChild.textContent.trim() || el.name;
      lines.push(`${label}: ${value}`);
    }
    const { mailto, subject } = form.dataset;
    const text = lines.join("\n");
    window.location.href = `mailto:${mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text + "\n")}`;
    // Ob sich ein E-Mail-Programm öffnet, kann die Seite nicht wissen: Text zum Kopieren daneben legen
    const box = form.querySelector("[data-sent-box]");
    box.querySelector("textarea").value = `${form.dataset.to}: ${mailto}\n${form.dataset.subj}: ${subject}\n\n${text}`;
    box.hidden = false;
    form.querySelector("[data-sent]").textContent = form.dataset.sentText;
  });
});

// Bewegung: Einblenden beim Scrollen und hochzählende Zahlen; ohne Beobachter oder bei reduzierter Bewegung bleibt alles stehen
const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if ("IntersectionObserver" in window && !still) {
  document.documentElement.classList.add("js");
  const reveal = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("is-in");
    reveal.unobserve(e.target);
  }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll("[data-reveal]").forEach((el) => reveal.observe(el));

  const count = (el) => {
    const final = el.textContent;
    const sep = (final.match(/[.,]/) || [""])[0];
    const target = parseInt(final.replace(/\D/g, ""), 10);
    el.style.minWidth = `${el.offsetWidth}px`; // Breite halten, sonst springt der Satz
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / 1600, 1);
      const v = Math.round(target * (1 - Math.pow(1 - t, 3)));
      el.textContent = t < 1 ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : final;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const counter = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    count(e.target);
    counter.unobserve(e.target);
  }), { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => counter.observe(el));
}

// Produktfamilien: das Bild rechts folgt der Zeile unter Maus oder Fokus
document.querySelectorAll(".fam").forEach((fam) => {
  const views = fam.querySelectorAll(".fam__view img");
  const rows = fam.querySelectorAll("[data-fam]");
  const pick = (row) => {
    views.forEach((v, i) => v.classList.toggle("is-on", String(i) === row.dataset.fam));
    rows.forEach((r) => r.classList.toggle("is-on", r === row));
  };
  rows.forEach((row) => {
    row.addEventListener("mouseenter", () => pick(row));
    row.addEventListener("focus", () => pick(row));
  });
  fam.addEventListener("mouseleave", () => rows.forEach((r) => r.classList.remove("is-on")));
});

// Laufschrift der Marken: anhalten und fortsetzen (WCAG 2.2.2)
document.querySelectorAll("[data-mq-btn]").forEach((btn) => {
  const section = btn.closest(".marken");
  const pauseLabel = btn.textContent;
  btn.addEventListener("click", () => {
    const paused = section.classList.toggle("is-paused");
    btn.setAttribute("aria-pressed", String(paused));
    btn.textContent = paused ? btn.dataset.lPlay : pauseLabel;
  });
});

document.querySelectorAll("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
  const area = btn.closest("[data-sent-box]").querySelector("textarea");
  try {
    await navigator.clipboard.writeText(area.value);
    btn.querySelector("span").textContent = btn.closest("form").dataset.copied;
  } catch {
    area.focus();
    area.select();
  }
}));
