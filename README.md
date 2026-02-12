# Killy Invoice System

A web-based invoice generation application for Killy Photography. Creates professional PDF invoices with live preview, client management, and persistent storage.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (index.html, invoices.html)          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  New Invoice │  │  Dashboard  │  │     Invoice Preview     │  │
│  │     Form     │  │   Invoices  │  │    (Live + Modal)       │  │
│  └──────┬───────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                 │                      │               │
│         └────────────┬────┴──────────────────────┘               │
│                      │                                           │
│              ┌───────▼───────┐                                   │
│              │  KillyAPI     │  ← api.js: server-first storage   │
│              │ (api.js)      │    Falls back to IndexedDB        │
│              └───────┬───────┘                                   │
│                      │                                           │
│         ┌────────────┴────────────┐                              │
│         │                         │                              │
│  ┌──────▼──────┐          ┌──────▼──────┐                        │
│  │ Server API  │          │  IndexedDB  │  ← Fallback when       │
│  │ data/*.json │          │ killy-inv.. │    server unreachable  │
│  └─────────────┘          └─────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/invoice (PDF generation)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (server/)                            │
│  Express.js + pdf-lib                                           │
│  - Serves invoices, date, bulk operations                       │
│  - Fills template PDF with invoice data                         │
│  - Returns generated PDF for download                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Storage

### Server-first with IndexedDB fallback

The `api.js` storage layer (`KillyAPI`) tries the server first. When the server is unreachable (e.g. `file://` or static hosting), it falls back to IndexedDB.

- **Server**: `GET/POST/DELETE /api/invoices`, data stored in `data/invoices.json`
- **Fallback (IndexedDB)**:
  - **Database name**: `killy-invoices`
  - **Object store**: `invoices`
  - **Key**: `id` (UUID string)
  - **Index**: `year` (for grouping)

### Invoice Object Schema

```typescript
interface Invoice {
  id: string;
  year: number;
  invoiceNumber: string;
  date: string;           // ISO or MM-DD-YYYY
  client: {
    name: string;
    contact?: string;
    company?: string;
    cityState?: string;
    phone?: string;
  };
  summary: string;
  description: string;
  clientJobId?: string;
  clientPO?: string;
  lineItems?: { detail?: string; each?: number; qty?: number; amount?: number }[];
  total?: number;
  balanceDue?: number;
  footerMessage?: string;
  showLineItems?: boolean;
  savedAt?: string;
}
```

---

## Frontend Features

### index.html – New Invoice Form

Create new invoices with client details, line items, and live preview.

### invoices.html – Dashboard

- **Search**: Filter invoices by number, client name, or date
- **Bulk selection**: Checkbox to select multiple invoices
- **Bulk delete**: Delete selected invoices
- **Import**: Import invoice data
- **Per-invoice actions**:
  - Click row → Opens preview modal
  - Download icon → Generate PDF
  - Copy icon → Use as template for new invoice
  - Trash icon → Delete invoice

### Preview Modal

Full invoice preview with actions: Download PDF, New from this, Print.

---

## Backend API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List all invoices |
| POST | `/api/invoices` | Create or update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| POST | `/api/invoices/bulk-delete` | Bulk delete by IDs |
| POST | `/api/invoices/import` | Import invoices |
| GET | `/api/date` | Get default invoice date |
| POST | `/api/invoice` | Generate filled PDF from template |
| GET | `/api/debug-grid` | Template PDF with coordinate grid for calibration |

---

## File Structure

```
Killy Invoice System/
├── index.html              # New invoice form
├── invoices.html           # Dashboard (saved invoices, search, bulk actions)
├── ui-reference.html       # UI reference / design
├── api.js                  # KillyAPI: server-first storage + IndexedDB fallback
│
├── server/
│   ├── index.ts            # Express server, /api/invoices, /api/invoice, etc.
│   └── pdf/
│       └── fillInvoice.ts  # PDF generation with pdf-lib
│
├── data/                   # Server storage (gitignored at runtime)
│   ├── invoices.json
│   └── date.json
│
├── logos/                  # Killy branding
├── Trade/                  # Trade Gothic font files (.ttf)
├── examples/               # Sample assets
│
├── jonesco-invoice.pdf     # Template PDF (legacy filename, filled by backend)
├── killy_logo.svg
├── background_optimized.jpg
│
├── package.json
├── render.yaml             # Render.com deployment config
├── tsconfig.json
└── tsconfig.server.json
```

---

## Running Locally

```bash
# Install dependencies
npm install

# Development (with hot reload)
npm run dev

# OR simple static server (frontend only, no PDF generation, IndexedDB only)
npm run serve
# Opens at http://localhost:8000

# Production build
npm run build
npm start
# Opens at http://localhost:3000
```

---

## PDF Generation Notes

The backend uses `pdf-lib` to overlay text on the template PDF. Text positions are defined in `server/pdf/fillInvoice.ts`.

To recalibrate positions:
1. Visit `/api/debug-grid` to see coordinate overlay
2. Adjust values in the `coords` object
3. Rebuild server: `npm run build`

---

## Storage Behavior

- **Server mode** (`npm start`): Invoices stored in `data/invoices.json`
- **Static / file://**: IndexedDB only; data is browser-specific
- Clearing browser data will delete IndexedDB invoices
