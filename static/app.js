const { counts, today } = JSON.parse(document.getElementById("data").textContent);

const DAY = 86400000;
const END = Date.parse(today + "T00:00:00Z");
const START = END - 364 * DAY;
const OFFSET = new Date(START).getUTCDay(); // blanks before the first real day

const grid = document.getElementById("heatmap");
const months = document.getElementById("months");

// --- cells ----------------------------------------------------------------
for (let i = 0; i < OFFSET; i++) {
  const pad = document.createElement("div");
  pad.className = "day pad";
  grid.append(pad);
}
for (let t = START; t <= END; t += DAY) {
  const key = new Date(t).toISOString().slice(0, 10);
  const cell = document.createElement("div");
  cell.className = "day";
  cell.dataset.day = key;
  grid.append(cell);
}

// --- month labels ---------------------------------------------------------
let lastMonth = -1;
for (let col = 0; col * 7 - OFFSET < 365; col++) {
  const day = new Date(START + Math.max(0, col * 7 - OFFSET) * DAY);
  if (day.getUTCMonth() === lastMonth) continue;
  lastMonth = day.getUTCMonth();
  const label = document.createElement("span");
  label.textContent = day.toLocaleString("en", { month: "short", timeZone: "UTC" });
  label.style.gridColumn = col + 1;
  months.append(label);
}

// --- colouring ------------------------------------------------------------
// Scale against the busiest day so the full green range always gets used.
function paint() {
  const max = Math.max(1, ...Object.values(counts));
  for (const cell of grid.children) {
    if (cell.classList.contains("pad")) continue;
    const key = cell.dataset.day;
    const n = counts[key] || 0;
    cell.className = "day l" + (n ? Math.min(4, Math.ceil((n / max) * 4)) : 0);
    cell.title = `${n} habit${n === 1 ? "" : "s"} on ${key}`;
  }
}
paint();

// --- toggling -------------------------------------------------------------
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

      document.getElementById("cur-" + data.habit_id).textContent = data.current;
      document.getElementById("long-" + data.habit_id).textContent = data.longest;
      counts[data.day] = data.count;
      paint();
    } catch {
      box.checked = !box.checked; // server said no, put the UI back
    } finally {
      box.disabled = false;
    }
  });
}
