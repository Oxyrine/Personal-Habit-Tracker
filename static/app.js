const { habits, today } = JSON.parse(document.getElementById("data").textContent);

const DAY = 86400000;
const END = Date.parse(today + "T00:00:00Z");
const START = END - 364 * DAY;
const OFFSET = new Date(START).getUTCDay(); // blanks before the first real day

// ISO strings sort and compare like dates, so no Date objects past this point.
const KEYS = [];
for (let t = START; t <= END; t += DAY) KEYS.push(new Date(t).toISOString().slice(0, 10));

for (const h of habits) h.set = new Set(h.days);

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

/** A habit's numbers appear in both the sidebar and its section. */
function setField(name, id, value) {
  for (const node of document.querySelectorAll(`[data-${name}="${id}"]`)) {
    node.textContent = value;
  }
}

/**
 * Draws the grid once into `mount`; returns a repaint fn that re-runs `cellFn`.
 * `mount` (the `.heatmap-scroll` container) becomes the accessible surface —
 * focusable, labeled with `label` — while the visual grid itself is hidden
 * from assistive tech so a screen reader isn't handed 365 anonymous nodes.
 */
function heatmap(mount, cellFn, labelFn) {
  const wrap = el("div", "heatmap-wrap");
  const months = el("div", "months");
  const grid = el("div", "heatmap");

  for (let i = 0; i < OFFSET; i++) grid.append(el("div", "day pad"));
  for (const key of KEYS) {
    const cell = el("div", "day");
    cell.dataset.day = key;
    grid.append(cell);
  }

  let lastMonth = -1;
  for (let col = 0; col * 7 - OFFSET < KEYS.length; col++) {
    const day = new Date(START + Math.max(0, col * 7 - OFFSET) * DAY);
    if (day.getUTCMonth() === lastMonth) continue;
    lastMonth = day.getUTCMonth();
    const monthLabel = el("span", null, day.toLocaleString("en", { month: "short", timeZone: "UTC" }));
    monthLabel.style.gridColumn = col + 1;
    months.append(monthLabel);
  }

  wrap.append(months, grid);
  wrap.setAttribute("aria-hidden", "true"); // decorative once `mount` carries the label below
  mount.append(wrap);
  mount.tabIndex = 0;
  mount.setAttribute("role", "group");

  return () => {
    for (const cell of grid.children) {
      if (!cell.classList.contains("pad")) cellFn(cell, cell.dataset.day);
    }
    mount.setAttribute("aria-label", labelFn()); // streak numbers can change, so re-derive every repaint
  };
}

/** Scrolls a `.heatmap-scroll` to today and flags whether history is clipped on the left. */
function positionScroller(mount) {
  mount.scrollLeft = mount.scrollWidth;
  mount.classList.toggle("has-hidden-start", mount.scrollWidth > mount.clientWidth);
}

const repaints = [];

// --- combined graph: shade = how many habits were completed that day --------
const overall = document.querySelector('[data-heatmap="overall"]'); // absent until a habit exists
if (overall) {
  const label = () => {
    const activeDays = KEYS.filter((key) => habits.some((h) => h.set.has(key))).length;
    return `All habits combined: ${activeDays} of ${KEYS.length} days had at least one habit completed, over the last year.`;
  };
  repaints.push(
    heatmap(overall, (cell, key) => {
      let done = 0;
      for (const h of habits) if (h.set.has(key)) done++;
      cell.className = "day l" + Math.min(4, done);
      cell.title = `${done} habit${done === 1 ? "" : "s"} on ${key}`;
    }, label)
  );
}

// --- one grid per habit -----------------------------------------------------
for (const h of habits) {
  const mount = document.querySelector(`[data-heatmap="${h.id}"]`);
  const trackedDays = KEYS.filter((key) => key >= h.created_on).length;
  const label = () =>
    `${h.name}: ${h.total} of ${trackedDays} days completed since ${h.created_on}. ` +
    `Current streak ${h.current} day${h.current === 1 ? "" : "s"}, longest streak ${h.longest} day${h.longest === 1 ? "" : "s"}.`;
  repaints.push(
    heatmap(mount, (cell, key) => {
      if (key < h.created_on) {
        cell.className = "day none";
        cell.title = `${key} — before this habit existed`;
        return;
      }
      const done = h.set.has(key);
      cell.className = "day " + (done ? "l4" : "l0");
      cell.title = done ? `✓ done on ${key}` : key === today ? "today — not yet" : `✗ missed on ${key}`;
    }, label)
  );
}

const paintAll = () => repaints.forEach((fn) => fn());
paintAll();

/** Only measurable once a `[data-view]` section is actually visible. */
function positionVisibleScrollers() {
  for (const view of views) {
    if (view.hidden) continue;
    for (const scroller of view.querySelectorAll(".heatmap-scroll")) positionScroller(scroller);
  }
}

// --- sidebar: one view at a time, driven by the URL hash --------------------
// Plain <a href="#..."> links, so back/forward and deep links work for free.
const views = document.querySelectorAll("[data-view]");
const links = document.querySelectorAll(".nav a");

function showView() {
  const id = location.hash.slice(1) || "overview";
  let matched = false;
  for (const view of views) {
    const on = view.dataset.view === id;
    view.hidden = !on;
    matched = matched || on;
  }
  if (!matched) {
    location.replace("#overview"); // hash pointing at a deleted habit
    return;
  }
  for (const link of links) {
    link.classList.toggle("active", link.getAttribute("href") === "#" + id);
  }
  positionVisibleScrollers(); // hidden sections can't be measured until shown
}

addEventListener("hashchange", showView);
showView();

// --- scroll-entry reveal ------------------------------------------------
// CSS only hides .reveal elements once .js is set (see index.html's inline
// script), so this is pure enhancement: no JS means everything stays visible.
const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  },
  { threshold: 0.1 }
);
for (const card of document.querySelectorAll(".reveal")) revealObserver.observe(card);

// Backgrounded/prerendered tabs can suspend IntersectionObserver indefinitely —
// never let content stay invisible waiting on a callback that may not come.
setTimeout(() => {
  for (const card of document.querySelectorAll(".reveal:not(.is-visible)")) card.classList.add("is-visible");
}, 800);

// --- toggling ---------------------------------------------------------------
const status = document.getElementById("status");

for (const box of document.querySelectorAll(".check")) {
  box.addEventListener("change", async () => {
    box.disabled = true;
    try {
      const res = await fetch("/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_id: Number(box.dataset.id), day: today }),
      });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();

      const habit = habits.find((h) => h.id === data.habit_id);
      data.done ? habit.set.add(data.day) : habit.set.delete(data.day);
      // heatmap aria-labels read these live, so keep the cached habit in sync too
      habit.current = data.current;
      habit.longest = data.longest;
      habit.total = data.total;
      setField("cur", data.habit_id, data.current);
      setField("long", data.habit_id, data.longest);
      setField("total", data.habit_id, data.total);
      // the same habit has a checkbox in the overview and in its own section
      for (const twin of document.querySelectorAll(`.check[data-id="${data.habit_id}"]`)) {
        twin.checked = data.done;
        twin.removeAttribute("aria-invalid");
      }
      paintAll();

      status.classList.remove("error");
      status.textContent = `${habit.name} marked ${data.done ? "done" : "not done"}. Current streak ${data.current} day${data.current === 1 ? "" : "s"}.`;
    } catch {
      box.checked = !box.checked; // server said no, put the UI back
      box.setAttribute("aria-invalid", "true");
      status.classList.add("error");
      status.textContent = "Couldn't save — check your connection and try again.";
    } finally {
      box.disabled = false;
    }
  });
}
