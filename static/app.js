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
const overall = document.getElementById("overall"); // absent until a habit exists
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

// --- one section per habit --------------------------------------------------
const sections = document.getElementById("habit-sections");

for (const h of habits) {
  const card = el("section", "card");
  const head = el("header", "section-head");
  head.append(el("h2", null, h.name));
  const sub = el("span", "sub");
  sub.id = `total-${h.id}`;
  head.append(sub);
  card.append(head);

  h.setTotal = (n) => {
    sub.textContent = `tracked since ${h.created_on} · ${n} day${n === 1 ? "" : "s"} done`;
  };
  h.setTotal(h.total);

  const stats = el("div", "stats");
  for (const [label, value, id] of [
    ["Current streak", h.current, `cur-${h.id}`],
    ["Longest streak", h.longest, `long-${h.id}`],
  ]) {
    const box = el("div", "stat");
    const num = el("b", null, value);
    num.id = id;
    box.append(num, el("span", null, label));
    stats.append(box);
  }
  card.append(stats);

  const mount = el("div", "heatmap-scroll");
  card.append(mount);
  sections.append(card);

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
      document.getElementById("cur-" + data.habit_id).textContent = data.current;
      document.getElementById("long-" + data.habit_id).textContent = data.longest;
      habit.setTotal(data.total);
      paintAll();
    } catch {
      box.checked = !box.checked; // server said no, put the UI back
    } finally {
      box.disabled = false;
    }
  });
}
