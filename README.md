# Jonesco Invoice Generator

A web-based invoice generation application for Jonesco design services. Creates professional PDF invoices with live preview, client management, and persistent storage.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (index.html)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  New Invoice │  │   Saved     │  │     Invoice Preview     │  │
│  │     Form     │  │  Invoices   │  │    (Live + Modal)       │  │
│  └──────┬───────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                 │                      │               │
│         └────────────┬────┴──────────────────────┘               │
│                      │                                           │
│              ┌───────▼───────┐                                   │
│              │   IndexedDB   │  ← Browser-based persistence      │
│              │ (jonesco-invoices)                                │
│              └───────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/invoice (optional)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (server/)                            │
│  Express.js + pdf-lib                                           │
│  - Fills template PDF with invoice data                         │
│  - Returns generated PDF for download                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Storage

### Primary Storage: IndexedDB (Browser)

Invoices are stored client-side in the browser's IndexedDB under:

- **Database name**: `jonesco-invoices`
- **Object store**: `invoices`
- **Key**: `id` (UUID string)
- **Index**: `year` (for grouping)

#### Invoice Object Schema

```typescript
interface Invoice {
  id: string;              // UUID (crypto.randomUUID() or 'seed-*' for seeded)
  year: number;            // e.g., 2025
  invoiceNumber: string;   // e.g., "LPEA-08-27-2025"
  date: string;            // ISO format: "2025-08-27"
  client: {
    name: string;          // Required - e.g., "La Plata Electric Association"
    contact?: string;      // e.g., "Amanda Anderson"
    address?: string;      // Multi-line, newline-separated
    email?: string;
    phone?: string;
  };
  summary: string;         // Brief work description
  description: string;     // Detailed breakdown (multi-line)
  savedAt: string;         // ISO timestamp when saved
}
```

### Seed Data (Pre-populated Invoices)

Historical invoices are pre-loaded via the `SEED_INVOICES` array in `index.html` (around line 1740). On first app load, these are inserted into IndexedDB if they don't already exist.

#### Adding a New Seed Invoice

To add a historical invoice to the system, add an entry to the `SEED_INVOICES` array:

```javascript
// In index.html, find: const SEED_INVOICES = [
// Add new invoice at the TOP of the array (most recent first)

{
  id: 'seed-CLIENT-MM-DD-YYYY',           // Unique ID prefixed with 'seed-'
  year: 2025,                              // Year for grouping
  invoiceNumber: 'CLIENT-MM-DD-YYYY',      // Display invoice number
  date: '2025-08-27',                      // ISO date format
  client: {
    name: 'Client Company Name',
    contact: 'Contact Person',
    address: '123 Street\nCity, ST 12345', // Use \n for line breaks
    email: 'email@example.com',
    phone: '555-123-4567'
  },
  summary: 'Brief description of work performed',
  description: 'Detailed breakdown:\n\nItem 1: X hours\nItem 2: Y hours\n\n--------------------------\nTotal Due:\n$X,XXX.00\n--------------------------',
  savedAt: '2025-08-27T12:00:00.000Z'      // ISO timestamp
},
```

**Important**: After adding seed data, users may need to clear their browser's IndexedDB for `jonesco-invoices` to see new entries (existing entries are not overwritten).

---

## Frontend Features

### Tab: New Invoice (`#tab-create`)

| Element | ID | Purpose |
|---------|-----|---------|
| Date input | `f-date` | Invoice date (MM-DD-YYYY format) |
| Client name | `f-name` | Client/company name (required for save) |
| Invoice number | `f-inv` | Auto-generated from client name + date, editable |
| Contact | `f-contact` | Client contact person |
| Address | `f-address` | Multi-line address |
| Email | `f-email` | Client email |
| Phone | `f-phone` | Client phone |
| Summary | `f-summary` | Work summary (appears in "Summary of work completed") |
| Description | `f-desc` | Detailed breakdown (appears in blue box) |

#### Actions

| Button | ID | Function |
|--------|-----|----------|
| Save Invoice | `btn-save` | Saves to IndexedDB |
| Download PDF | `btn-print` | Opens browser print dialog (Save as PDF) |
| Start from saved | `btn-start-from-saved` | Opens modal to select template |
| Clear form | `btn-clear` | Resets all fields |

#### Invoice Number Auto-Generation

Format: `{CLIENT_PREFIX}-{MM}-{DD}-{YYYY}`

- Client prefix: First 3-4 letters of client name (uppercase)
- Extracted from client name input on change

### Tab: Saved Invoices (`#tab-saved`)

Displays all invoices from IndexedDB, grouped by year (newest first).

#### Features
- **Search**: Filter invoices by number, client name, or date
- **Bulk selection**: Checkbox to select multiple invoices
- **Bulk delete**: Delete selected invoices
- **Per-invoice actions**:
  - Click row → Opens preview modal
  - Download icon → Generate PDF
  - Copy icon → Use as template for new invoice
  - Trash icon → Delete invoice

### Preview Modal

Full invoice preview with actions:
- Download PDF
- New from this (use as template)
- Print

---

## Backend API

### `POST /api/invoice`

Generates a filled PDF from the template.

**Request Body:**
```json
{
  "invoiceNumber": "LPEA-08-27-2025",
  "client": {
    "name": "La Plata Electric Association",
    "contact": "Amanda Anderson",
    "address": "123 Main St\nDurango, CO 81301",
    "email": "amanda@lpea.com",
    "phone": "970-555-1234"
  },
  "summary": "Design services",
  "description": "Detailed work breakdown...",
  "date": "2025-08-27"
}
```

**Response:** PDF file download

### `GET /api/debug-grid`

Returns the template PDF with a coordinate grid overlay for calibrating text positions.

### `GET /`

Serves the frontend `index.html`.

---

## File Structure

```
invoice/
├── index.html              # Main frontend (HTML + CSS + JS, ~78KB)
│                           # - All UI components
│                           # - IndexedDB logic
│                           # - SEED_INVOICES array (line ~1740)
│                           # - Form handling and preview
│
├── server/
│   ├── index.ts            # Express server
│   │                       # - POST /api/invoice
│   │                       # - GET /api/debug-grid
│   │                       # - GET / (serves index.html)
│   │
│   └── pdf/
│       └── fillInvoice.ts  # PDF generation with pdf-lib
│                           # - Text positioning coordinates
│                           # - Text wrapping logic
│                           # - Calibration grid
│
├── Trade/                  # Trade Gothic font files (.ttf)
│                           # Used by frontend CSS
│
├── jonesco-invoice.pdf     # Template PDF (filled by backend)
├── jonesco_logo_invoice.svg # Logo for invoice header
├── background.png          # Blue box background image
│
├── package.json            # Dependencies: express, cors, pdf-lib
├── render.yaml             # Render.com deployment config
├── tsconfig.json           # TypeScript config (frontend)
└── tsconfig.server.json    # TypeScript config (server)
```

---

## Key Code Locations

| Feature | File | Line/Section |
|---------|------|--------------|
| Seed invoices array | `index.html` | ~1740 (`SEED_INVOICES`) |
| IndexedDB open/save | `index.html` | ~1724 (`openDB`, `saveInvoiceToDB`) |
| Form → Preview binding | `index.html` | ~1665 (`refreshPreviewFromForm`) |
| Invoice number generation | `index.html` | ~1420 (`generateInvoiceNumber`) |
| PDF text coordinates | `server/pdf/fillInvoice.ts` | ~31 (`coords` object) |
| PDF text wrapping | `server/pdf/fillInvoice.ts` | ~103 (`wrapText`) |

---

## Running Locally

```bash
# Install dependencies
npm install

# Development (with hot reload)
npm run dev

# OR simple static server (frontend only, no PDF generation)
npm run serve
# Opens at http://localhost:8000

# Production build
npm run build
npm start
# Opens at http://localhost:3000
```

---

## PDF Generation Notes

The backend uses `pdf-lib` to overlay text on `jonesco-invoice.pdf`. Text positions are defined in `server/pdf/fillInvoice.ts`:

```typescript
const coords = {
  invoiceNumber: { x: 460, y: 730 },
  clientName: { x: 70, y: 670 },
  clientAddress: { x: 70, y: 650 },
  summary: { x: 70, y: 610 },
  date: { x: 460, y: 710 },
  descriptionBox: { x: 40, y: 480, width: 520, lineHeight: 16, height: 160 }
};
```

To recalibrate positions:
1. Visit `/api/debug-grid` to see coordinate overlay
2. Adjust values in `coords` object
3. Rebuild server

---

## Browser Storage Warning

Since invoices are stored in IndexedDB:
- Data is **browser-specific** (won't sync across devices)
- Clearing browser data will **delete all invoices**
- Seed invoices will be re-added on next load, but user-created invoices will be lost

For persistent cross-device storage, consider adding a backend database.
