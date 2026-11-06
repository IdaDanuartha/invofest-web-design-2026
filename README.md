# FoodLoop - Surplus Food Discovery, Reservation & Redistribution Platform

> **Tagline:** Good food deserves another chance.  
> **Primary Prototype Region:** Bali, Indonesia (Denpasar & Badung)  
> **Tech Stack:** Semantic HTML5, Modern CSS (Custom Properties, Grid, Flexbox), Vanilla JavaScript (Native ES Modules)

---

## 1. Overview

**FoodLoop** connects restaurants, bakeries, cafés, hotels, and grocers that have edible surplus food with nearby community kitchens, charities, neighbourhood pantries, and individuals through a structured, accountable handoff workflow:

1. **List:** A food provider creates a surplus listing (or uses **FoodLoop Assist** to structure rough kitchen notes into a draft with a missing-detail checklist).
2. **Match:** Recipients filter by Bali area, pickup window, food category, quantity, and provider-disclosed dietary/allergen notes.
3. **Collect:** A recipient reserves up to the available quantity and coordinates pickup within the provider's stated collection window.
4. **Make an impact:** Once the handoff is confirmed complete (`AVAILABLE → RESERVED → COLLECTED → COMPLETED`), it is recorded in the transparent Impact ledger.

---

## 2. How to Run Locally

Because FoodLoop uses native JavaScript ES Modules (`<script type="module" src="src/js/app.js">`), serve the root folder over any local HTTP server:

### Option A - Python (built-in)
```bash
python -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

### Option B - Node.js (`npx serve`)
```bash
npx serve .
```

### Option C - VS Code Live Server
Right-click `index.html` in VS Code and select **Open with Live Server**.

---

## 3. Switching Demo Roles & Resetting Demo Data

### Instant Demo Role Switching
At the top of every page, the **Prototype Demo Bar** allows one-click switching between seeded Bali demo accounts:
- **Recipient Org:** `Community Table (Demo)` (`recipient@example.test`)
- **Food Provider:** `Demo Kitchen` (`provider@example.test`)
- **Individual Recipient:** `Made Wijaya (Demo)` (`individual@example.test`)

You can also visit `#/login` to switch accounts or `#/signup` to register a custom demo account.

### How to Reset Demo Data
All changes (new listings, reservations, status transitions, partner applications, and reports) persist across page refreshes in browser `localStorage` under the `foodloop_v1_` namespace.

To restore all initial seeded listings, reservations, and impact metrics at any time:
1. Click **↺ Reset demo data** in the top dark demo bar, **or**
2. Confirm in the modal dialog to clear custom session state and reload the clean seed dataset.

---

## 4. Project Structure

```text
invofest-2026/
├── index.html
├── README.md
├── FoodLoop_PRD.md
├── assets/
│   ├── images/
│   │   ├── listing-rice.svg
│   │   ├── listing-bakery.svg
│   │   └── listing-produce.svg
│   └── icons/
│       └── logo-mark.svg
├── src/
│   ├── css/
│   │   ├── tokens.css
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   ├── pages.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── app.js
│   │   ├── router.js
│   │   ├── state.js
│   │   ├── data/
│   │   │   └── seed.js
│   │   ├── services/
│   │   │   ├── storageService.js
│   │   │   ├── listingService.js
│   │   │   ├── reservationService.js
│   │   │   └── aiService.js
│   │   ├── components/
│   │   │   ├── header.js
│   │   │   ├── footer.js
│   │   │   ├── listingCard.js
│   │   │   ├── filterPanel.js
│   │   │   ├── modal.js
│   │   │   └── toast.js
│   │   └── pages/
│   │       ├── home.js
│   │       ├── discover.js
│   │       ├── listingDetail.js
│   │       ├── createListing.js
│   │       ├── assistant.js
│   │       ├── partners.js
│   │       ├── impact.js
│   │       ├── howItWorks.js
│   │       ├── auth.js
│   │       └── dashboard.js
│   └── utils/
│       ├── formatDate.js
│       ├── validation.js
│       └── accessibility.js
└── docs/
    └── demo-script.md
```

---

## 5. Key Guardrails & Product Principles

- **No Greenwashing:** Impact metrics count only completed handoffs (`COMPLETED`), keeping units separate (`portions`, `packs`, `kg`) and avoiding unverified CO₂ or tree-saving claims.
- **Explicit Food & Allergen Responsibility:** FoodLoop clearly separates provider-disclosed allergens from `"Please confirm with provider"` and never infers allergen-free status or food safety via AI.
- **Zero Client-Side Secrets:** `src/js/services/aiService.js` runs deterministically in local demo mode (`Demo AI`) with zero API keys in browser code.

