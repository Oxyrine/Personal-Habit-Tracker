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

/** Draws the grid once into `mount`; returns a repaint fn that re-runs `cellFn`. */
function heatmap(mount, cellFn) {
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
    const label = el("span", null, day.toLocaleString("en", { month: "short", timeZone: "UTC" }));
    label.style.gridColumn = col + 1;
    months.append(label);
  }

  wrap.append(months, grid);
  mount.append(wrap);

  return () => {
    for (const cell of grid.children) {
      if (!cell.classList.contains("pad")) cellFn(cell, cell.dataset.day);
    }
  };
}

const repaints = [];

// --- combined graph: shade = how many habits were completed that day --------
const overall = document.querySelector('[data-heatmap="overall"]'); // absent until a habit exists
if (overall) {
  repaints.push(
    heatmap(overall, (cell, key) => {
      let done = 0;
      for (const h of habits) if (h.set.has(key)) done++;
      cell.className = "day l" + Math.min(4, done);
      cell.title = `${done} habit${done === 1 ? "" : "s"} on ${key}`;
    })
  );
}

// --- one grid per habit -----------------------------------------------------
for (const h of habits) {
  const mount = document.querySelector(`[data-heatmap="${h.id}"]`);
  repaints.push(
    heatmap(mount, (cell, key) => {
      if (key < h.created_on) {
        cell.className = "day none";
        cell.title = `${key} — before this habit existed`;
        return;
      }
      const done = h.set.has(key);
      cell.className = "day " + (done ? "l4" : "l0");
      cell.title = `${done ? "✓ done" : "✗ missed"} on ${key}`;
    })
  );
}

const paintAll = () => repaints.forEach((fn) => fn());
paintAll();

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
}

addEventListener("hashchange", showView);
showView();

// --- toggling ---------------------------------------------------------------
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
      setField("cur", data.habit_id, data.current);
      setField("long", data.habit_id, data.longest);
      setField("total", data.habit_id, data.total);
      // the same habit has a checkbox in the overview and in its own section
      for (const twin of document.querySelectorAll(`.check[data-id="${data.habit_id}"]`)) {
        twin.checked = data.done;
      }
      paintAll();
    } catch {
      box.checked = !box.checked; // server said no, put the UI back
    } finally {
      box.disabled = false;
    }
  });
}
