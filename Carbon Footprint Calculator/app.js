/**
 * Carbon footprint calculator — daily kg CO₂e estimates.
 * Factors are rounded averages for education; not certified offsets.
 */

const SUSTAINABLE_TARGET_KG = 10;
const GLOBAL_AVG_KG = 16;

const DIET_BASE = {
  vegan: 2.5,
  vegetarian: 3.4,
  pescatarian: 4.2,
  "low-meat": 5.0,
  average: 6.8,
  "high-meat": 9.2,
};

const FOOD_WASTE_MULT = {
  minimal: 0.9,
  moderate: 1.0,
  high: 1.25,
};

const TRANSPORT_KG_PER_KM = {
  walk: 0,
  transit: 0.089,
  train: 0.041,
  ev: 0.053,
  hybrid: 0.12,
  "gas-car": 0.21,
  motorcycle: 0.113,
  rideshare: 0.18,
};

const FLIGHT_DAILY_KG = {
  0: 0,
  1: 0.85,
  2: 1.7,
  "1-long": 2.8,
  "2-long": 5.5,
};

const ELECTRICITY_KG_PER_KWH = 0.42;
const GAS_KG_PER_THERM = 5.3;

const STORAGE_KEY = "ecotrack-footprint";

const form = document.getElementById("footprint-form");
const totalKgEl = document.getElementById("total-kg");
const totalCompareEl = document.getElementById("total-compare");
const benchmarkFill = document.getElementById("benchmark-fill");
const breakdownBars = document.getElementById("breakdown-bars");
const breakdownLegend = document.getElementById("breakdown-legend");
const tipsList = document.getElementById("tips-list");
const resetBtn = document.getElementById("reset-btn");

const inputs = {
  dietType: document.getElementById("diet-type"),
  foodWaste: document.getElementById("food-waste"),
  transportMode: document.getElementById("transport-mode"),
  commuteDistance: document.getElementById("commute-distance"),
  commuteDistanceValue: document.getElementById("commute-distance-value"),
  flights: document.getElementById("flights"),
  electricity: document.getElementById("electricity"),
  electricityValue: document.getElementById("electricity-value"),
  gas: document.getElementById("gas"),
  gasValue: document.getElementById("gas-value"),
  renewable: document.getElementById("renewable"),
};

function getFormState() {
  return {
    dietType: inputs.dietType.value,
    foodWaste: inputs.foodWaste.value,
    transportMode: inputs.transportMode.value,
    commuteDistance: Number(inputs.commuteDistance.value),
    flights: inputs.flights.value,
    electricity: Number(inputs.electricity.value),
    gas: Number(inputs.gas.value),
    renewable: inputs.renewable.checked,
  };
}

function setFormState(state) {
  inputs.dietType.value = state.dietType ?? "average";
  inputs.foodWaste.value = state.foodWaste ?? "moderate";
  inputs.transportMode.value = state.transportMode ?? "gas-car";
  inputs.commuteDistance.value = state.commuteDistance ?? 25;
  inputs.flights.value = state.flights ?? "0";
  inputs.electricity.value = state.electricity ?? 12;
  inputs.gas.value = state.gas ?? 0.8;
  inputs.renewable.checked = Boolean(state.renewable);
  syncRangeOutputs();
}

function syncRangeOutputs() {
  inputs.commuteDistanceValue.textContent = inputs.commuteDistance.value;
  inputs.electricityValue.textContent = inputs.electricity.value;
  inputs.gasValue.textContent = Number(inputs.gas.value).toFixed(1);
}

function calculate(state) {
  const diet =
    (DIET_BASE[state.dietType] ?? DIET_BASE.average) *
    (FOOD_WASTE_MULT[state.foodWaste] ?? 1);

  const transportPerKm = TRANSPORT_KG_PER_KM[state.transportMode] ?? 0.21;
  const transport =
    transportPerKm * state.commuteDistance +
    (FLIGHT_DAILY_KG[state.flights] ?? 0);

  const elecFactor = state.renewable ? 0.05 : ELECTRICITY_KG_PER_KWH;
  const energy =
    state.electricity * elecFactor + state.gas * GAS_KG_PER_THERM;

  const total = diet + transport + energy;

  return {
    diet: round(diet),
    transport: round(transport),
    energy: round(energy),
    total: round(total),
  };
}

function round(n) {
  return Math.round(n * 10) / 10;
}

function renderBreakdown(parts, total) {
  const categories = [
    { key: "diet", label: "Diet", colorClass: "diet" },
    { key: "transport", label: "Transport", colorClass: "transport" },
    { key: "energy", label: "Energy", colorClass: "energy" },
  ];

  breakdownBars.innerHTML = categories
    .map(({ key, label, colorClass }) => {
      const value = parts[key];
      const pct = total > 0 ? (value / total) * 100 : 0;
      return `
        <div class="bar-row">
          <span class="bar-label">${label}</span>
          <div class="bar-track">
            <div class="bar-fill ${colorClass}" style="width: ${pct}%"></div>
          </div>
          <span class="bar-value">${value} kg</span>
        </div>
      `;
    })
    .join("");

  breakdownLegend.innerHTML = categories
    .map(
      ({ key, label, colorClass }) =>
        `<li><span class="legend-dot bar-fill ${colorClass}"></span>${label}: ${((parts[key] / total) * 100 || 0).toFixed(0)}%</li>`
    )
    .join("");
}

function compareMessage(total) {
  if (total <= SUSTAINABLE_TARGET_KG) {
    return `You're at or below the ~${SUSTAINABLE_TARGET_KG} kg/day sustainable lifestyle target. Great work.`;
  }
  const over = round(total - SUSTAINABLE_TARGET_KG);
  const pctAbove = Math.round((total / SUSTAINABLE_TARGET_KG - 1) * 100);
  return `${over} kg above the sustainable target (+${pctAbove}%). Global average is ~${GLOBAL_AVG_KG} kg/day.`;
}

function generateTips(state, parts) {
  const tips = [];
  const total = parts.total;
  const sorted = [
    ["diet", parts.diet],
    ["transport", parts.transport],
    ["energy", parts.energy],
  ].sort((a, b) => b[1] - a[1]);

  const top = sorted[0][0];

  if (top === "diet" && parts.diet >= 4) {
    if (state.dietType === "high-meat" || state.dietType === "average") {
      tips.push({
        priority: "high",
        title: "Diet — biggest lever",
        body: "Shifting one day per week to plant-based meals can cut food emissions ~15–25%. Try beans, lentils, or tofu as protein swaps.",
      });
    }
    if (state.foodWaste === "high") {
      tips.push({
        priority: "high",
        title: "Reduce food waste",
        body: "Plan weekly meals, store leftovers properly, and use a shopping list. Wasted food accounts for roughly 8–10% of global emissions.",
      });
    }
    if (state.dietType !== "vegan") {
      tips.push({
        priority: "normal",
        title: "Lower-impact proteins",
        body: "Chicken and fish typically have a smaller footprint than beef and lamb. When you eat meat, choose smaller portions.",
      });
    }
  }

  if (top === "transport" && parts.transport >= 2) {
    if (state.transportMode === "gas-car" || state.transportMode === "rideshare") {
      tips.push({
        priority: "high",
        title: "Commute smarter",
        body: `At ${state.commuteDistance} km/day, switching even 2 days/week to transit, train, or remote work could save ~${round(parts.transport * 0.3)} kg/day on average.`,
      });
    }
    if (state.commuteDistance > 30 && state.transportMode !== "walk") {
      tips.push({
        priority: "normal",
        title: "Trip chaining",
        body: "Combine errands into one route to cut cold starts and idle time. Carpooling splits emissions per passenger.",
      });
    }
    if (state.flights !== "0") {
      tips.push({
        priority: "high",
        title: "Air travel",
        body: "Flights dominate occasional travel footprints. Prefer trains under 500 km, fly direct when necessary, and bundle trips.",
      });
    }
    if (state.transportMode === "gas-car") {
      tips.push({
        priority: "normal",
        title: "Consider an EV or hybrid",
        body: "Electric vehicles on a typical grid emit roughly half the per-km CO₂e of gasoline cars over their lifetime.",
      });
    }
  }

  if (top === "energy" && parts.energy >= 3) {
    if (!state.renewable && state.electricity > 15) {
      tips.push({
        priority: "high",
        title: "Electricity use",
        body: `You're using ~${state.electricity} kWh/day. LED bulbs, smart thermostats, and unplugging idle devices often save 10–20% with no lifestyle change.`,
      });
    }
    if (state.gas > 1) {
      tips.push({
        priority: "normal",
        title: "Heating & hot water",
        body: "Lower the thermostat 1–2°C, seal drafts, and shorten showers. Heat pumps can cut gas use dramatically where available.",
      });
    }
    if (!state.renewable) {
      tips.push({
        priority: "normal",
        title: "Green power",
        body: "A renewable electricity tariff or rooftop solar can slash the grid portion of home energy emissions.",
      });
    }
  }

  if (total > GLOBAL_AVG_KG) {
    tips.push({
      priority: "high",
      title: "Overall",
      body: "Focus on your top category first — small consistent changes beat occasional extreme efforts.",
    });
  } else if (total <= SUSTAINABLE_TARGET_KG) {
    tips.push({
      priority: "normal",
      title: "Keep it up",
      body: "You're near a 1.5°C-aligned daily budget. Share habits with others and advocate for systemic change (transit, grid, policy).",
    });
  }

  if (tips.length < 3) {
    tips.push({
      priority: "normal",
      title: "Track weekly",
      body: "Log habits for 7 days and look for patterns. Most people find one 'hidden' category (food delivery, standby power, short flights).",
    });
  }

  return tips.slice(0, 5);
}

function renderTips(tips) {
  tipsList.innerHTML = tips
    .map(
      (t) => `
      <li class="tip-item ${t.priority === "high" ? "priority-high" : ""}">
        <strong>${t.title}</strong>
        ${t.body}
      </li>
    `
    )
    .join("");
}

function updateUI() {
  const state = getFormState();
  const parts = calculate(state);

  totalKgEl.textContent = parts.total.toFixed(1);
  totalCompareEl.textContent = compareMessage(parts.total);

  const benchmarkPct = Math.min(100, (parts.total / 30) * 100);
  benchmarkFill.style.width = `${benchmarkPct}%`;
  benchmarkFill.classList.toggle("high", parts.total > SUSTAINABLE_TARGET_KG * 1.5);

  renderBreakdown(parts, parts.total);
  renderTips(generateTips(state, parts));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    /* ignore quota / private mode */
  }
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setFormState(JSON.parse(raw));
  } catch (_) {
    /* ignore corrupt data */
  }
}

form.addEventListener("input", updateUI);
form.addEventListener("change", updateUI);

resetBtn.addEventListener("click", () => {
  setFormState({
    dietType: "average",
    foodWaste: "moderate",
    transportMode: "gas-car",
    commuteDistance: 25,
    flights: "0",
    electricity: 12,
    gas: 0.8,
    renewable: false,
  });
  localStorage.removeItem(STORAGE_KEY);
  updateUI();
});

loadSaved();
syncRangeOutputs();
updateUI();
