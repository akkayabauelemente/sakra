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
