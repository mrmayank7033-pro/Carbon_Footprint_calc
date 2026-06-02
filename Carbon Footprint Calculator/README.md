# EcoTrack — Carbon Footprint Calculator

A single-page web app that estimates your **daily carbon footprint** (kg CO₂e) from diet, transportation, and home energy use, with **personalized reduction tips**.

## Features

- **Diet** — diet style and food waste level
- **Transportation** — commute mode, daily distance, monthly flights
- **Energy** — electricity (kWh/day), natural gas (therms/day), optional 100% renewable power
- **Live results** — total footprint, comparison to a ~10 kg/day sustainable target, category breakdown
- **Personalized tips** — prioritized by your largest emission source
- **Auto-save** — preferences stored in `localStorage`

## Run locally

No build step required. Open `index.html` in a browser, or serve the folder:

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Then visit `http://localhost:8080`.

## Methodology (approximate)

| Category | Basis |
|----------|--------|
| Diet | Daily kg CO₂e by diet type (literature averages) × food waste multiplier |
| Transport | kg/km by mode × daily km + prorated flight emissions |
| Energy | kWh × grid factor (or low factor if renewable) + therms × gas factor |

Figures are for **education and habit awareness**, not certified carbon accounting or offsets.

## Files

- `index.html` — structure and form
- `styles.css` — layout and theme
- `app.js` — calculations, tips, persistence
