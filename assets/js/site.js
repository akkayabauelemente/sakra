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

const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Hero füllt das Fenster unter Vorschau-Band, Kopfleiste und Kopf: deren Höhe als --kopf
const setKopf = () => header && document.documentElement.style.setProperty("--kopf", `${Math.round(header.getBoundingClientRect().bottom + window.scrollY)}px`);
setKopf();
window.addEventListener("resize", setKopf);

// Überschrift zeilenweise: Wörter mit gleicher Oberkante bilden eine Zeile, --l steuert die Verzögerung
const heroWords = [...document.querySelectorAll(".hero h1 .w")];
const lineUp = () => {
  let line = -1;
  let top = null;
  for (const w of heroWords) {
    if (w.offsetTop !== top) { top = w.offsetTop; line += 1; }
    w.style.setProperty("--l", line);
  }
};
if (heroWords.length) { lineUp(); document.fonts?.ready.then(lineUp); }

// Vom Stahl zur Wärme: die Bühne klebt unter dem Kopf, die Scrollstrecke durch den Abschnitt wählt den Schritt.
// Natives Scrollen, kein Einrasten; bei weniger Bewegung bleibt die Liste untereinander stehen.
const storyEl = document.querySelector("[data-story]");
if (storyEl && !calm) {
  storyEl.classList.add("story--on");
  const frame = storyEl.querySelector(".story__frame");
  const steps = storyEl.querySelectorAll(".story__step");
  const bars = storyEl.querySelectorAll(".story__bar span");
  let cur = -1;
  let queued = false;
  const update = () => {
    queued = false;
    const kopf = header ? header.offsetHeight : 0;
    document.documentElement.style.setProperty("--kopfh", `${kopf}px`);
    const r = storyEl.getBoundingClientRect();
    const run = r.height - frame.offsetHeight;
    const p = run > 0 ? Math.min(Math.max((kopf - r.top) / run, 0), 0.9999) : 0;
    const i = Math.floor(p * steps.length);
    if (i === cur) return;
    cur = i;
    steps.forEach((s, k) => s.classList.toggle("is-on", k === i));
    bars.forEach((b, k) => { b.classList.toggle("is-on", k === i); b.classList.toggle("is-done", k < i); });
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", () => { cur = -1; queue(); });
  update();
  // Alle fünf Fotos laden, sobald der Abschnitt ein Fenster entfernt ist
  if ("IntersectionObserver" in window) {
    const near = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      storyEl.querySelectorAll("img").forEach((im) => { im.loading = "eager"; });
      near.disconnect();
    }, { rootMargin: "100% 0px" });
    near.observe(storyEl);
  }
}

// Abschnitte steigen beim Einscrollen auf (einmalig); Kennzahlen zählen dabei hoch
if (!calm && "IntersectionObserver" in window) {
  const count = (dd) => {
    const target = Number(dd.dataset.count);
    const final = dd.textContent;
    const unit = final.replace(/^[\d.]+/, "");
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / 1400, 1);
      const v = Math.round(target * (1 - (1 - t) ** 3));
      dd.textContent = t < 1 ? v.toLocaleString("de-DE") + unit : final;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("is-in");
    e.target.querySelectorAll("[data-count]").forEach(count);
    io.unobserve(e.target);
  }), { rootMargin: "0px 0px -10% 0px" });
  document.querySelectorAll("main > .sec > .wrap").forEach((el) => {
    el.classList.add("rv");
    io.observe(el);
  });
}

// Ein Werk, fünf Marken: Überfahren, Fokus oder Antippen wählt den Namen, seine Zeile blendet ein
document.querySelectorAll("[data-marken]").forEach((box) => {
  const btns = box.querySelectorAll(".marke");
  const rows = box.querySelectorAll(".marken__d p");
  const pick = (i) => {
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.i === i)));
    rows.forEach((p) => p.classList.toggle("is-on", p.dataset.i === i));
  };
  btns.forEach((b) => {
    b.addEventListener("click", () => pick(b.dataset.i));
    b.addEventListener("focus", () => pick(b.dataset.i));
    b.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") pick(b.dataset.i); });
  });
});

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
