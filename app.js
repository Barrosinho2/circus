/*
  Buffet Circus — interações (JavaScript puro, sem bibliotecas)

  1. Base e carregamento
  2. WhatsApp e dados de contato
  3. Cabeçalho e menu
  4. Lâmpadas de letreiro (hover)
  5. Motor de scroll: hero, atrações, títulos que acendem, faixa
  6. Agenda (disponibilidade)
  7. Ingresso (formulário de lead → WhatsApp)
  8. Dúvidas, foto ampliada, botão flutuante, revelações
*/
(() => {
  "use strict";

  /* ---------- 1. Base ---------- */
  const CFG = window.CIRCUS_CONFIG || {};
  const root = document.documentElement;
  const body = document.body;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const SVG_NS = "http://www.w3.org/2000/svg";
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  const mqDesktop = matchMedia("(min-width: 900px)");
  const mqHover = matchMedia("(hover: hover) and (pointer: fine)");
  const onMQ = (mq, fn) => (mq.addEventListener ? mq.addEventListener("change", fn) : mq.addListener(fn));

  // Abertura: espera fontes e a foto do hero (no máximo 1,6 s) e solta a animação de entrada
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const heroImg = $(".hero__photo img");
  const heroImgReady = heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve();
  Promise.race([Promise.all([fontsReady, heroImgReady]), new Promise((r) => setTimeout(r, 1600))]).then(() =>
    requestAnimationFrame(() => root.classList.add("is-loaded"))
  );

  /* ---------- 2. WhatsApp e contato ---------- */
  const waNumber = String(CFG.whatsapp || "5515998012684").replace(/\D/g, "");
  const waUrl = (text) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  const WA_MESSAGES = {
    geral: "Olá, Circus! Vim pelo site e quero saber mais sobre as festas.",
    visita: "Olá, Circus! Vim pelo site e gostaria de agendar uma visita para conhecer o salão. Quais horários vocês têm?",
  };
  $$("a[data-whatsapp]").forEach((a) => {
    a.href = waUrl(WA_MESSAGES[a.dataset.whatsapp] || WA_MESSAGES.geral);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  });
  if (CFG.telefoneExibicao) $$("[data-phone]").forEach((el) => (el.textContent = CFG.telefoneExibicao));
  $$('a[href^="tel:"]').forEach((a) => (a.href = `tel:+${waNumber}`));
  if (CFG.instagram) {
    $$("[data-instagram]").forEach((li) => {
      const a = $("a", li);
      a.href = CFG.instagram;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      li.hidden = false;
    });
  }
  if (CFG.endereco) {
    $$("[data-address]").forEach((el) => {
      el.textContent = CFG.endereco;
      el.hidden = false;
    });
  }
  $$("[data-year]").forEach((el) => (el.textContent = String(new Date().getFullYear())));

  /* ---------- 3. Cabeçalho e menu ---------- */
  const topbar = $("[data-topbar]");
  const menuToggle = $("#menu-toggle");
  const nav = $("#site-nav");

  const setMenu = (open, restoreFocus = false) => {
    body.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (open) topbar.classList.remove("is-hidden");
    if (!open && restoreFocus) menuToggle.focus();
  };
  menuToggle.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (!body.classList.contains("menu-open") || mqDesktop.matches) return;
    if (e.key === "Escape") {
      setMenu(false, true);
      return;
    }
    if (e.key !== "Tab") return;
    const items = [...$$("a[href]", nav), menuToggle].filter((el) => el.getClientRects().length);
    const first = items[0];
    const last = items[items.length - 1];
    if (!items.includes(document.activeElement)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  onMQ(mqDesktop, (e) => {
    if (e.matches) setMenu(false);
  });
  topbar.addEventListener("focusin", () => topbar.classList.remove("is-hidden"));

  const updateHeader = (y, dy) => {
    topbar.classList.toggle("is-solid", y > 30);
    if (body.classList.contains("menu-open")) return;
    if (dy > 6 && y > 300) topbar.classList.add("is-hidden");
    else if (dy < -6 || y < 300) topbar.classList.remove("is-hidden");
  };

  // Link do menu acompanha a seção visível
  const navLinks = $$('.nav__list a[href^="#"]');
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) =>
          a.setAttribute("aria-current", String(a.getAttribute("href") === `#${entry.target.id}`))
        );
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  ["#inicio", ...navLinks.map((a) => a.getAttribute("href"))].forEach((id) => {
    const s = $(id);
    if (s) sectionObserver.observe(s);
  });

  /* ---------- 4. Lâmpadas de letreiro ----------
     Cada [data-bulbs] ganha um <svg> com dois retângulos tracejados.
     data-bulbs="-7" = lâmpadas 7px para fora; "10" = 10px para dentro. */
  const bulbItems = new Map();
  const bulbResize = new ResizeObserver((entries) =>
    entries.forEach((entry) => {
      const draw = bulbItems.get(entry.target);
      if (draw) draw();
    })
  );
  const attachBulbs = (el) => {
    const inset = el.dataset.bulbs === "" ? -7 : parseFloat(el.dataset.bulbs) || -7;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "bulbs");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const dim = document.createElementNS(SVG_NS, "rect");
    const lit = document.createElementNS(SVG_NS, "rect");
    dim.setAttribute("class", "bulbs__dim");
    lit.setAttribute("class", "bulbs__lit");
    svg.append(dim, lit);
    el.append(svg);
    const draw = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (!w || !h) return;
      const W = w - inset * 2;
      const H = h - inset * 2;
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      const rx = Math.max(0, Math.min(radius - inset, W / 2, H / 2));
      const perimeter = 2 * (W + H - 4 * rx) + 2 * Math.PI * rx;
      let n = Math.max(8, Math.round(perimeter / 12));
      if (n % 2) n += 1;
      svg.style.left = `${inset}px`;
      svg.style.top = `${inset}px`;
      svg.style.width = `${W}px`;
      svg.style.height = `${H}px`;
      [dim, lit].forEach((r) => {
        r.setAttribute("x", "0");
        r.setAttribute("y", "0");
        r.setAttribute("width", String(W));
        r.setAttribute("height", String(H));
        r.setAttribute("rx", String(rx));
        r.setAttribute("pathLength", String(n * 2));
      });
    };
    bulbItems.set(el, draw);
    bulbResize.observe(el);
    draw();
  };
  $$("[data-bulbs]").forEach(attachBulbs);

  /* ---------- 5. Motor de scroll ----------
     Cada "cena" recebe um progresso de 0 a 1 enquanto a seção atravessa a tela.
     O valor é suavizado (lerp) para o movimento não "dar degrau" com a rodinha do mouse. */
  const scenes = [];
  const addScene = (el, render, smooth = 0.14) => {
    const scene = { el, render, smooth, top: 0, dist: 1, target: 0, value: 0 };
    scenes.push(scene);
    return scene;
  };
  const measureScenes = () => {
    const y = window.scrollY;
    scenes.forEach((s) => {
      s.top = s.el.getBoundingClientRect().top + y;
      s.dist = Math.max(1, s.el.offsetHeight - window.innerHeight);
    });
  };

  // Hero: lâmpadas do anel
  const heroSection = $("[data-hero]");
  const heroPin = $("[data-hero-pin]");
  const heroCopy = $("[data-hero-copy]");
  const ringGroup = $("[data-hero-bulbs]");
  if (ringGroup) {
    const total = 44;
    for (let i = 0; i < total; i++) {
      const a = (i / total) * Math.PI * 2 - Math.PI / 2;
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", (Math.cos(a) * 95).toFixed(2));
      c.setAttribute("cy", (Math.sin(a) * 95).toFixed(2));
      c.setAttribute("r", "2.5");
      c.setAttribute("class", "hero__bulb");
      c.style.setProperty("--i", String(i));
      ringGroup.append(c);
    }
  }
  if (heroSection && heroPin) {
    addScene(heroSection, (p) => {
      if (mqReduce.matches) p = 0;
      const pe = easeInOut(clamp(p / 0.8));
      const cp = clamp(p / 0.3);
      const rv = clamp((p - 0.62) / 0.28);
      heroPin.style.setProperty("--pe", pe.toFixed(4));
      heroPin.style.setProperty("--cp", cp.toFixed(4));
      heroPin.style.setProperty("--rv", rv.toFixed(4));
      heroCopy.toggleAttribute("inert", cp > 0.7);
    });
    new IntersectionObserver(([entry]) => heroPin.classList.toggle("is-paused", !entry.isIntersecting)).observe(
      heroSection
    );
  }

  // Atrações: scroll vertical vira movimento horizontal (só desktop)
  const acts = $("[data-acts]");
  const actsTrack = $("[data-acts-track]");
  const actsBar = $("[data-acts-bar]");
  let actsDist = 0;
  const measureActs = () => {
    if (!acts) return;
    const pinned = mqDesktop.matches && !mqReduce.matches;
    acts.classList.toggle("is-pinned", pinned);
    if (!pinned) {
      acts.style.height = "";
      actsTrack.style.transform = "";
      return;
    }
    actsDist = Math.max(0, actsTrack.scrollWidth - window.innerWidth);
    acts.style.height = `${Math.round(actsDist + window.innerHeight)}px`;
  };
  if (acts) {
    addScene(
      acts,
      (p) => {
        if (!acts.classList.contains("is-pinned")) return;
        actsTrack.style.transform = `translate3d(${(-p * actsDist).toFixed(1)}px, 0, 0)`;
        actsBar.style.transform = `scaleX(${p.toFixed(4)})`;
      },
      0.12
    );
  }

  // Títulos que acendem palavra por palavra
  const lights = $$("[data-light]").map((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    const spans = words.map((word, i) => {
      const s = document.createElement("span");
      s.className = "w";
      s.textContent = word;
      el.append(s);
      if (i < words.length - 1) el.append(" ");
      return s;
    });
    return { el, spans, last: -1 };
  });
  const renderLights = (all = false) => {
    const vh = window.innerHeight;
    lights.forEach((L) => {
      const r = L.el.getBoundingClientRect();
      if (!all && (r.bottom < -40 || r.top > vh + 40)) return;
      const p = mqReduce.matches ? 1 : clamp((vh * 0.92 - r.top) / (vh * 0.46));
      const key = Math.round(p * 300);
      if (key === L.last) return;
      L.last = key;
      const n = L.spans.length;
      L.spans.forEach((s, i) => s.style.setProperty("--lit", clamp(p * n * 1.15 - i).toFixed(3)));
    });
  };

  // Faixa: anda sozinha e acelera/inverte com o scroll
  const ribbon = $("[data-ribbon]");
  const ribbonTrack = $("[data-ribbon-track]");
  let ribbonX = 0;
  let ribbonDir = 1;
  let ribbonBoost = 0;
  let ribbonOn = false;
  let ribbonLast = 0;
  let ribbonHalf = 0;
  if (ribbonTrack) ribbonTrack.innerHTML += ribbonTrack.innerHTML;
  const measureRibbon = () => {
    if (ribbonTrack) ribbonHalf = ribbonTrack.scrollWidth / 2;
  };
  const ribbonLoop = (now) => {
    if (!ribbonOn) return;
    const dt = ribbonLast ? Math.min(48, now - ribbonLast) : 16;
    ribbonLast = now;
    ribbonX -= (0.05 + ribbonBoost) * dt * ribbonDir;
    if (ribbonHalf) {
      if (ribbonX <= -ribbonHalf) ribbonX += ribbonHalf;
      if (ribbonX > 0) ribbonX -= ribbonHalf;
    }
    ribbonTrack.style.transform = `translate3d(${ribbonX.toFixed(2)}px, 0, 0)`;
    ribbonBoost *= 0.93;
    requestAnimationFrame(ribbonLoop);
  };
  if (ribbon) {
    new IntersectionObserver(([entry]) => {
      const on = entry.isIntersecting && !mqReduce.matches;
      if (on && !ribbonOn) {
        ribbonOn = true;
        ribbonLast = 0;
        requestAnimationFrame(ribbonLoop);
      } else if (!on) {
        ribbonOn = false;
      }
    }).observe(ribbon);
  }

  // Botão flutuante (some na bilheteria e no rodapé, onde já há chamadas)
  const waFloat = $("[data-wa-float]");
  const hideFloatOn = new Set();
  const updateFloat = (y) => {
    if (waFloat) waFloat.classList.toggle("is-visible", y > window.innerHeight * 0.9 && hideFloatOn.size === 0);
  };
  const floatObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? hideFloatOn.add(e.target) : hideFloatOn.delete(e.target)));
    updateFloat(window.scrollY);
  });
  [".booth__grid", ".footer"].forEach((sel) => {
    const el = $(sel);
    if (el) floatObserver.observe(el);
  });

  // Laço de animação: roda só enquanto há scroll ou suavização acontecendo
  let lastScrollY = window.scrollY;
  let rafId = 0;
  let lastFrame = 0;
  const frame = (now) => {
    rafId = 0;
    const y = window.scrollY;
    const dt = lastFrame ? Math.min(64, now - lastFrame) : 16.7;
    lastFrame = now;
    let moving = false;
    scenes.forEach((s) => {
      s.target = clamp((y - s.top) / s.dist);
      if (mqReduce.matches) {
        s.value = s.target;
      } else {
        const k = 1 - Math.pow(1 - s.smooth, dt / 16.7);
        s.value += (s.target - s.value) * k;
        if (Math.abs(s.target - s.value) < 0.0004) s.value = s.target;
        else moving = true;
      }
      s.render(s.value);
    });
    const dy = y - lastScrollY;
    updateHeader(y, dy);
    if (dy) {
      ribbonDir = dy > 0 ? 1 : -1;
      ribbonBoost = Math.min(1.1, ribbonBoost + Math.abs(dy) * 0.0035);
    }
    lastScrollY = y;
    renderLights();
    updateFloat(y);
    if (moving) rafId = requestAnimationFrame(frame);
    else lastFrame = 0;
  };
  const requestFrame = () => {
    if (!rafId) rafId = requestAnimationFrame(frame);
  };
  window.addEventListener("scroll", requestFrame, { passive: true });

  const measureAll = () => {
    measureActs();
    measureRibbon();
    measureScenes();
    renderLights(true);
    requestFrame();
  };
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measureAll, 120);
  });
  window.addEventListener("load", measureAll);
  fontsReady.then(measureAll);
  onMQ(mqReduce, measureAll);
  onMQ(mqDesktop, measureAll);
  measureAll();

  /* ---------- 6. Agenda ---------- */
  const SESSIONS =
    Array.isArray(CFG.sessoes) && CFG.sessoes.length
      ? CFG.sessoes
      : [
          { id: "matine", nome: "Matinê", horario: "12h às 16h" },
          { id: "noite", nome: "Noite", horario: "18h às 22h" },
        ];
  const sessionById = (id) => SESSIONS.find((s) => s.id === id) || null;
  const AG = CFG.agenda || {};
  const WEEK_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const WEEK_LONG = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const MONTHS = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const today = (() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  })();
  const monthsAhead = Number.isFinite(AG.mesesAFrente) ? AG.mesesAFrente : 12;
  const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxDate = new Date(today.getFullYear(), today.getMonth() + monthsAhead + 1, 0);
  const monthIndex = (y, m) => y * 12 + m;

  // Ocupação simulada e determinística: o mesmo dia mostra sempre o mesmo resultado.
  // Sábados e domingos lotam mais; datas próximas também.
  const hash = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  const chance = (str) => (hash(str) % 10000) / 10000;
  const simulateMonth = (y, m) => {
    const out = {};
    const days = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d);
      const iso = toISO(date);
      const ahead = Math.round((date - today) / 86400000);
      const base = [0.5, 0.06, 0.08, 0.1, 0.14, 0.34, 0.68][date.getDay()];
      const soon = ahead <= 21 ? 0.26 : ahead <= 60 ? 0.12 : 0;
      const p = Math.min(0.94, base + soon);
      const booked = SESSIONS.filter((s) => chance(`circus:${iso}:${s.id}`) < p).map((s) => s.id);
      if (booked.length) out[iso] = booked;
    }
    return out;
  };

  // Ponto de integração: troque/complete com a sua fonte real em config.js (agenda.fonte)
  const monthCache = new Map();
  const loadMonth = (y, m) => {
    const key = `${y}-${pad(m + 1)}`;
    if (!monthCache.has(key)) {
      monthCache.set(
        key,
        (async () => {
          let booked = AG.simular === false ? {} : simulateMonth(y, m);
          if (AG.fonte) {
            try {
              const sep = AG.fonte.includes("?") ? "&" : "?";
              const res = await fetch(`${AG.fonte}${sep}mes=${key}`, { headers: { Accept: "application/json" } });
              if (res.ok) booked = { ...booked, ...(await res.json()) };
            } catch (err) {
              console.warn("Agenda: não foi possível ler a fonte externa.", err);
            }
          }
          const manual = AG.reservadas || {};
          Object.keys(manual).forEach((iso) => {
            if (iso.startsWith(key)) booked[iso] = manual[iso];
          });
          return booked;
        })()
      );
    }
    return monthCache.get(key);
  };
  const normalizeBooked = (v) =>
    v === "todas" || v === "*" || v === true ? SESSIONS.map((s) => s.id) : [].concat(v || []);
  const dayInfo = (date, bookedMap) => {
    if (date <= today || date > maxDate) return { status: "past", free: [] };
    const booked = normalizeBooked(bookedMap[toISO(date)]);
    const free = SESSIONS.filter((s) => !booked.includes(s.id));
    const status = free.length === 0 ? "full" : free.length === 1 && SESSIONS.length > 1 ? "last" : "free";
    return { status, free };
  };
  const isOpen = (info) => info.status === "free" || info.status === "last";
  const longDate = (d) => `${WEEK_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  const dayLabel = (d, info) => {
    const base = longDate(d);
    if (info.status === "past") return `${base}${d.getTime() === today.getTime() ? " (hoje)" : ""}: indisponível`;
    if (info.status === "full") return `${base}: esgotado`;
    const names = info.free.map((s) => s.nome).join(" e ");
    return `${base}: ${info.free.length === 1 ? "1 horário livre" : `${info.free.length} horários livres`} (${names})`;
  };

  const calRoot = $("[data-cal]");
  const Cal = calRoot
    ? (() => {
        const els = {
          title: $("[data-cal-title]", calRoot),
          prev: $("[data-cal-prev]", calRoot),
          next: $("[data-cal-next]", calRoot),
          body: $("[data-cal-body]", calRoot),
          quick: $("[data-cal-quick]", calRoot),
          quickList: $("[data-cal-quick-list]", calRoot),
          day: $("[data-cal-day]", calRoot),
          dayTitle: $("[data-cal-day-title]", calRoot),
          sessions: $("[data-cal-sessions]", calRoot),
          empty: $("[data-cal-empty]", calRoot),
          tip: $("[data-cal-tip]", calRoot),
          live: $("[data-cal-live]", calRoot),
        };
        const state = { y: today.getFullYear(), m: today.getMonth(), selected: null, session: null, booked: {} };
        const listeners = new Set();
        const emit = () => listeners.forEach((fn) => fn());
        const announce = (msg) => {
          els.live.textContent = "";
          setTimeout(() => (els.live.textContent = msg), 60);
        };

        const render = async (focusISO, dir) => {
          const { y, m } = state;
          const booked = await loadMonth(y, m);
          if (state.y !== y || state.m !== m) return;
          state.booked = booked;
          els.title.textContent = `${MONTHS[m]} ${y}`;
          els.prev.disabled = monthIndex(y, m) <= monthIndex(minDate.getFullYear(), minDate.getMonth());
          els.next.disabled = monthIndex(y, m) >= monthIndex(maxDate.getFullYear(), maxDate.getMonth());

          const prefix = `${y}-${pad(m + 1)}`;
          const inMonth = (iso) => typeof iso === "string" && iso.startsWith(prefix);
          const daysInMonth = new Date(y, m + 1, 0).getDate();
          const lead = new Date(y, m, 1).getDay();
          const cells = [];
          for (let i = 0; i < lead; i++) cells.push(null);
          let firstOpen = null;
          for (let d = 1; d <= daysInMonth; d++) cells.push(d);
          while (cells.length < 42) cells.push(null);

          const frag = document.createDocumentFragment();
          for (let r = 0; r < 6; r++) {
            const tr = document.createElement("tr");
            for (let c = 0; c < 7; c++) {
              const td = document.createElement("td");
              const d = cells[r * 7 + c];
              if (d) {
                const date = new Date(y, m, d);
                const iso = toISO(date);
                const info = dayInfo(date, booked);
                if (!firstOpen && isOpen(info)) firstOpen = iso;
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = `day is-${info.status}`;
                if (date.getTime() === today.getTime()) btn.classList.add("is-today");
                const selected = iso === state.selected;
                if (selected) btn.classList.add("is-selected");
                btn.dataset.date = iso;
                btn.tabIndex = -1;
                btn.setAttribute("aria-label", dayLabel(date, info));
                btn.setAttribute("aria-pressed", String(selected));
                if (!isOpen(info)) btn.setAttribute("aria-disabled", "true");
                const dots = isOpen(info)
                  ? `<span class="day__dots" aria-hidden="true">${"<i></i>".repeat(Math.min(3, info.free.length))}</span>`
                  : "";
                btn.innerHTML = `<span class="day__n">${d}</span>${dots}`;
                td.append(btn);
              }
              tr.append(td);
            }
            frag.append(tr);
          }
          if (dir) els.body.dataset.dir = dir;
          else delete els.body.dataset.dir;
          els.body.replaceChildren(frag);

          const rovingISO = inMonth(focusISO) ? focusISO : inMonth(state.selected) ? state.selected : firstOpen || `${prefix}-01`;
          const rovingBtn = els.body.querySelector(`[data-date="${rovingISO}"]`);
          if (rovingBtn) {
            rovingBtn.tabIndex = 0;
            if (focusISO) rovingBtn.focus();
          }
        };

        const goMonth = (delta) => {
          const idx = monthIndex(state.y, state.m) + delta;
          const minIdx = monthIndex(minDate.getFullYear(), minDate.getMonth());
          const maxIdx = monthIndex(maxDate.getFullYear(), maxDate.getMonth());
          if (idx < minIdx || idx > maxIdx) return;
          state.y = Math.floor(idx / 12);
          state.m = idx % 12;
          hideTip();
          render(null, delta > 0 ? "next" : "prev");
        };
        els.prev.addEventListener("click", () => goMonth(-1));
        els.next.addEventListener("click", () => goMonth(1));

        const renderDay = (date, info) => {
          els.dayTitle.textContent = longDate(date);
          const legend = $("legend", els.sessions);
          els.sessions.replaceChildren(legend);
          SESSIONS.forEach((s) => {
            const free = info.free.some((f) => f.id === s.id);
            const label = document.createElement("label");
            label.className = "session";
            label.innerHTML = `<input type="radio" name="sessao" value="${esc(s.id)}"${free ? "" : " disabled"}${
              state.session === s.id ? " checked" : ""
            }><span class="session__box"><span class="session__name">${esc(s.nome)}</span><span class="session__time">${esc(
              s.horario
            )}</span><span class="session__state">${free ? "Livre" : "Reservado"}</span></span>`;
            els.sessions.append(label);
          });
          els.day.hidden = false;
          els.empty.hidden = true;
          els.day.classList.remove("is-new");
          void els.day.offsetWidth;
          els.day.classList.add("is-new");
        };
        els.sessions.addEventListener("change", (e) => {
          if (e.target.name !== "sessao") return;
          state.session = e.target.value;
          const s = sessionById(state.session);
          if (s) announce(`Horário escolhido: ${s.nome}, ${s.horario}.`);
          emit();
        });

        const updateQuickPressed = () =>
          $$(".quick", els.quickList).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.date === state.selected)));

        const shake = (iso) => {
          const btn = els.body.querySelector(`[data-date="${iso}"]`);
          if (!btn) return;
          btn.classList.remove("is-shake");
          void btn.offsetWidth;
          btn.classList.add("is-shake");
        };

        const select = (iso) => {
          const date = fromISO(iso);
          const info = dayInfo(date, state.booked);
          if (!isOpen(info)) {
            if (info.status === "full") announce("Essa data está esgotada. Escolha um dia com contorno dourado.");
            shake(iso);
            return false;
          }
          state.selected = iso;
          if (!info.free.some((s) => s.id === state.session)) state.session = info.free[0].id;
          $$(".day", els.body).forEach((b) => {
            const on = b.dataset.date === iso;
            b.classList.toggle("is-selected", on);
            b.setAttribute("aria-pressed", String(on));
            b.tabIndex = on ? 0 : -1;
          });
          renderDay(date, info);
          updateQuickPressed();
          const s = sessionById(state.session);
          announce(`${dayLabel(date, info)}. Horário escolhido: ${s ? s.nome : ""}.`);
          emit();
          return true;
        };

        const clear = () => {
          state.selected = null;
          state.session = null;
          $$(".day.is-selected", els.body).forEach((b) => {
            b.classList.remove("is-selected");
            b.setAttribute("aria-pressed", "false");
          });
          els.day.hidden = true;
          els.empty.hidden = false;
          updateQuickPressed();
          emit();
        };

        els.body.addEventListener("click", (e) => {
          const btn = e.target.closest(".day");
          if (btn) select(btn.dataset.date);
        });

        // Teclado: setas, Home/End (semana), PageUp/PageDown (mês)
        const moveFocus = async (date) => {
          if (date < minDate) date = minDate;
          if (date > maxDate) date = maxDate;
          const iso = toISO(date);
          if (date.getFullYear() !== state.y || date.getMonth() !== state.m) {
            const dir = monthIndex(date.getFullYear(), date.getMonth()) > monthIndex(state.y, state.m) ? "next" : "prev";
            state.y = date.getFullYear();
            state.m = date.getMonth();
            await render(iso, dir);
          } else {
            const target = els.body.querySelector(`[data-date="${iso}"]`);
            $$(".day", els.body).forEach((b) => (b.tabIndex = b === target ? 0 : -1));
            if (target) target.focus();
          }
        };
        els.body.addEventListener("keydown", (e) => {
          const btn = e.target.closest(".day");
          if (!btn) return;
          const d = fromISO(btn.dataset.date);
          const shiftMonth = (n) => {
            const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
            const dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
            return new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), dim));
          };
          const map = {
            ArrowLeft: () => addDays(d, -1),
            ArrowRight: () => addDays(d, 1),
            ArrowUp: () => addDays(d, -7),
            ArrowDown: () => addDays(d, 7),
            Home: () => addDays(d, -d.getDay()),
            End: () => addDays(d, 6 - d.getDay()),
            PageUp: () => shiftMonth(-1),
            PageDown: () => shiftMonth(1),
          };
          if (!map[e.key]) return;
          e.preventDefault();
          hideTip();
          moveFocus(map[e.key]());
        });

        // Dica no hover (só mouse)
        const hideTip = () => {
          els.tip.hidden = true;
        };
        const showTip = (btn) => {
          if (!mqHover.matches) return;
          const date = fromISO(btn.dataset.date);
          const info = dayInfo(date, state.booked);
          if (info.status === "past") {
            hideTip();
            return;
          }
          els.tip.innerHTML = SESSIONS.map((s) => {
            const free = info.free.some((f) => f.id === s.id);
            return `<span class="cal__tip-line"><b>${esc(s.nome)}</b> ${free ? "livre" : "reservado"}</span>`;
          }).join("");
          const c = calRoot.getBoundingClientRect();
          const b = btn.getBoundingClientRect();
          els.tip.style.left = `${b.left - c.left + b.width / 2}px`;
          els.tip.style.top = `${b.top - c.top}px`;
          els.tip.hidden = false;
        };
        els.body.addEventListener("pointerover", (e) => {
          const btn = e.target.closest(".day");
          if (btn) showTip(btn);
          else hideTip();
        });
        els.body.addEventListener("pointerleave", hideTip);

        // Atalhos: próximos fins de semana com horário livre
        const buildQuick = async () => {
          const picks = [];
          let cursor = addDays(today, 1);
          while (picks.length < 4 && cursor <= maxDate) {
            const dow = cursor.getDay();
            if (dow === 0 || dow === 6) {
              const booked = await loadMonth(cursor.getFullYear(), cursor.getMonth());
              const info = dayInfo(cursor, booked);
              if (isOpen(info)) picks.push({ date: cursor, info });
            }
            cursor = addDays(cursor, 1);
          }
          if (!picks.length) return;
          els.quickList.replaceChildren(
            ...picks.map(({ date, info }) => {
              const b = document.createElement("button");
              b.type = "button";
              b.className = "quick";
              b.dataset.date = toISO(date);
              b.innerHTML = `${WEEK_SHORT[date.getDay()]} <b>${pad(date.getDate())}/${pad(date.getMonth() + 1)}</b>`;
              b.setAttribute("aria-label", dayLabel(date, info));
              b.setAttribute("aria-pressed", "false");
              return b;
            })
          );
          els.quick.hidden = false;
          updateQuickPressed();
        };
        els.quickList.addEventListener("click", async (e) => {
          const b = e.target.closest(".quick");
          if (!b) return;
          const d = fromISO(b.dataset.date);
          if (d.getFullYear() !== state.y || d.getMonth() !== state.m) {
            const dir = monthIndex(d.getFullYear(), d.getMonth()) > monthIndex(state.y, state.m) ? "next" : "prev";
            state.y = d.getFullYear();
            state.m = d.getMonth();
            await render(null, dir);
          }
          select(b.dataset.date);
        });

        render();
        buildQuick();

        return {
          state,
          clear,
          onChange: (fn) => listeners.add(fn),
          focusDay: () => {
            const btn = els.body.querySelector('.day[tabindex="0"]');
            if (btn) btn.focus();
            return Boolean(btn);
          },
        };
      })()
    : null;

  /* ---------- 7. Ingresso → WhatsApp ---------- */
  const form = $("[data-ticket]");
  if (form && Cal) {
    const T = {
      date: $("[data-t-date]", form),
      session: $("[data-t-session]", form),
      guests: $("[data-t-guests]", form),
      code: $("[data-t-code]", form),
    };
    const noDate = $("[data-no-date]", form);
    const status = $("[data-ticket-status]", form);
    const fallback = $("[data-ticket-fallback]", form);
    const code = `CIR-${pad(today.getDate())}${pad(today.getMonth() + 1)}-${Math.random()
      .toString(36)
      .slice(2, 5)
      .toUpperCase()}`;
    T.code.textContent = code;

    const setCell = (el, html, empty = false) => {
      el.classList.toggle("is-empty", empty);
      if (el.innerHTML === html) return;
      el.innerHTML = html;
      el.classList.remove("is-new");
      void el.offsetWidth;
      el.classList.add("is-new");
    };
    const refresh = () => {
      const st = Cal.state;
      if (st.selected) {
        const d = fromISO(st.selected);
        setCell(T.date, `${WEEK_SHORT[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`);
      } else {
        setCell(T.date, noDate.checked ? "A definir" : "Escolha na agenda", true);
      }
      const s = sessionById(st.session);
      if (s) setCell(T.session, `${esc(s.nome)}<small>${esc(s.horario)}</small>`);
      else setCell(T.session, noDate.checked ? "A definir" : "—", true);
      const g = form.querySelector('input[name="convidados"]:checked');
      setCell(T.guests, g ? esc(g.value) : "—", !g);
    };

    // Erros por campo
    const fieldFor = {
      nome: () => form.elements.namedItem("nome"),
      idade: () => form.elements.namedItem("idade"),
      convidados: () => $(".chips", form),
      data: () => noDate,
    };
    const errorEl = (key) => $(`[data-error-for="${key}"]`, form);
    const setError = (key, msg) => {
      const el = errorEl(key);
      el.textContent = msg;
      el.hidden = false;
      fieldFor[key]().setAttribute("aria-invalid", "true");
    };
    const clearError = (key) => {
      const el = errorEl(key);
      if (!el || el.hidden) return;
      el.hidden = true;
      el.textContent = "";
      fieldFor[key]().removeAttribute("aria-invalid");
    };
    noDate.setAttribute("aria-describedby", "err-data");

    Cal.onChange(() => {
      if (Cal.state.selected && noDate.checked) noDate.checked = false;
      if (Cal.state.selected) clearError("data");
      refresh();
    });
    noDate.addEventListener("change", () => {
      if (noDate.checked) {
        Cal.clear();
        clearError("data");
      }
      refresh();
    });
    form.addEventListener("change", (e) => {
      if (e.target.name === "convidados") {
        clearError("convidados");
        refresh();
      }
      if (e.target.name === "idade") clearError("idade");
    });
    form.addEventListener("input", (e) => {
      if (e.target.name === "nome") clearError("nome");
    });

    // Webhook opcional (planilha, CRM...). O WhatsApp abre de qualquer jeito.
    const sendLead = (lead) => {
      if (!CFG.webhookLeads) return;
      const payload = JSON.stringify(lead);
      try {
        const queued =
          navigator.sendBeacon &&
          navigator.sendBeacon(CFG.webhookLeads, new Blob([payload], { type: "text/plain;charset=UTF-8" }));
        if (!queued) {
          fetch(CFG.webhookLeads, {
            method: "POST",
            mode: "no-cors",
            keepalive: true,
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            body: payload,
          }).catch(() => {});
        }
      } catch (_) {
        /* segue para o WhatsApp */
      }
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const get = (k) => String(data.get(k) || "").trim();
      const nome = get("nome");
      const crianca = get("crianca");
      const idade = get("idade");
      const convidados = get("convidados");
      const tema = get("tema");
      const origem = get("origem");

      ["nome", "data", "idade", "convidados"].forEach(clearError);
      const errors = [];
      if (!nome) errors.push(["nome", "Digite seu nome para emitir o ingresso."]);
      if (!Cal.state.selected && !noDate.checked)
        errors.push(["data", "Escolha um dia na agenda ou marque “Ainda estou decidindo a data”."]);
      if (!idade) errors.push(["idade", "Escolha a idade que o aniversariante vai completar."]);
      if (!convidados) errors.push(["convidados", "Escolha uma faixa de convidados."]);

      if (errors.length) {
        errors.forEach(([k, msg]) => setError(k, msg));
        status.textContent =
          errors.length > 1 ? `Faltam ${errors.length} informações no ingresso.` : "Falta uma informação no ingresso.";
        fallback.hidden = true;
        const first = errors[0][0];
        if (first === "data") {
          if (!Cal.focusDay()) noDate.focus();
        } else if (first === "convidados") {
          $('input[name="convidados"]', form).focus();
        } else {
          fieldFor[first]().focus();
        }
        return;
      }

      const sel = Cal.state.selected ? fromISO(Cal.state.selected) : null;
      const sess = sessionById(Cal.state.session);
      const dataTexto = sel
        ? `${WEEK_LONG[sel.getDay()]}, ${pad(sel.getDate())}/${pad(sel.getMonth() + 1)}/${sel.getFullYear()}`
        : "ainda estou decidindo";
      const outro = idade === "outro";
      const quem = outro
        ? `*Evento:* outro tipo de festa${crianca ? ` (${crianca})` : ""}`
        : crianca
          ? `*Aniversariante:* ${crianca}, ${idade}`
          : `*Idade do aniversariante:* ${idade}`;
      const lines = [
        "Olá, Circus! Vim pelo site e quero consultar uma data. 🎪",
        "",
        `*Ingresso:* ${code}`,
        `*Responsável:* ${nome}`,
        quem,
        `*Data:* ${dataTexto}`,
        sess ? `*Horário:* ${sess.nome} (${sess.horario})` : null,
        `*Convidados:* ${convidados}`,
        tema ? `*Tema:* ${tema}` : null,
        origem ? `*Conheceu o Circus por:* ${origem}` : null,
        "",
        "Podem confirmar a disponibilidade e me enviar o orçamento?",
      ].filter((l) => l !== null);
      const url = waUrl(lines.join("\n"));

      // Origem da campanha (utm_source, utm_medium...) vai junto para o webhook
      const utm = {};
      new URLSearchParams(location.search).forEach((v, k) => {
        if (k.startsWith("utm_")) utm[k] = v;
      });
      sendLead({
        codigo: code,
        utm,
        nome,
        aniversariante: crianca || null,
        idade: outro ? "outro evento" : idade,
        data: Cal.state.selected,
        horario: sess ? sess.id : null,
        convidados,
        tema: tema || null,
        origem: origem || null,
        pagina: location.href,
        criadoEm: new Date().toISOString(),
      });
      // Evento para Google Tag Manager / GA4 / Meta Pixel (sem dados pessoais)
      (window.dataLayer = window.dataLayer || []).push({
        event: "lead_whatsapp",
        lead_codigo: code,
        lead_convidados: convidados,
        lead_tem_data: Boolean(Cal.state.selected),
        lead_origem: utm.utm_source || origem || "direto",
      });

      form.classList.remove("is-sent");
      void form.offsetWidth;
      form.classList.add("is-sent");
      status.textContent = "Ingresso pronto! Abrimos o WhatsApp com a mensagem: é só tocar em enviar.";
      fallback.href = url;
      fallback.target = "_blank";
      fallback.rel = "noopener noreferrer";
      fallback.hidden = false;
      window.open(url, "_blank", "noopener,noreferrer");
    });

    refresh();
  }

  /* ---------- 8. Dúvidas, foto ampliada, revelações ---------- */
  $$(".qa__btn").forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      if (panel) panel.classList.toggle("is-open", open);
    });
  });

  const lightbox = $("#lightbox");
  const lbImg = $("#lightbox-img");
  const lbCap = $("#lightbox-caption");
  let lbTrigger = null;
  $$("[data-gallery-src]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!lightbox || typeof lightbox.showModal !== "function") {
        window.open(btn.dataset.gallerySrc, "_blank", "noopener");
        return;
      }
      lbTrigger = btn;
      lbImg.src = btn.dataset.gallerySrc;
      lbImg.alt = $("img", btn)?.alt || "";
      lbCap.textContent = btn.dataset.galleryCaption || "";
      lightbox.showModal();
      body.classList.add("dialog-open");
    })
  );
  if (lightbox) {
    $$("[data-lightbox-close]", lightbox).forEach((b) => b.addEventListener("click", () => lightbox.close()));
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener("close", () => {
      body.classList.remove("dialog-open");
      if (lbTrigger) lbTrigger.focus({ preventScroll: true });
    });
  }

  const revealObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      }),
    { rootMargin: "0px 0px -12% 0px" }
  );
  $$("[data-reveal], [data-booth]").forEach((el) => revealObserver.observe(el));
})();
