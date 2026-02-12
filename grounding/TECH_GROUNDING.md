# Jonesco Invoice Generator Technical Grounding

## Current Stack
- Frontend: Static `index.html` (HTML/CSS/vanilla JS).
- Backend: Node.js + Express (`server/index.ts`).
- PDF Engine: `pdf-lib` (`server/pdf/fillInvoice.ts`).
- Storage: Browser IndexedDB (`jonesco-invoices` / `invoices`).
- Runtime: TypeScript for server, transpiled with `tsc`.

## Project Files (Source of Truth)
- `index.html`: Main UI, form logic, preview rendering, IndexedDB interactions.
- `invoices.html`: Alternate/related invoice UI surface.
- `ui-reference.html`: Visual and component style reference.
- `server/index.ts`: API routes and template resolution.
- `server/pdf/fillInvoice.ts`: PDF text placement, wrapping, and calibration.
- `jonesco-invoice.pdf`: Base template used for PDF filling.

## Data Contract
```ts
type Invoice = {
  id: string;
  year: number;
  invoiceNumber: string;
  date: string; // ISO yyyy-mm-dd
  client: {
    name: string;
    contact?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  summary: string;
  description: string;
  savedAt: string; // ISO timestamp
};
```

## API Surface
### POST `/api/invoice`
- Input: invoice payload compatible with `InvoiceData`.
- Output: generated PDF bytes with attachment filename `invoice-{invoiceNumber}.pdf`.
- Error cases:
  - `400` missing required fields.
  - `500` missing template or generation failure.

### GET `/api/debug-grid`
- Returns template PDF with coordinate grid overlays for tuning text positions.

### GET `/`
- Serves `index.html`.

## Technical Constraints
- Must preserve current Trade Gothic visual style in UI.
- PDF coordinates are template-specific and sensitive to template revisions.
- Description text is wrapped and clipped to box height.
- IndexedDB is local-only; no built-in sync across machines/browsers.

## Implementation Standards for New Work
- Keep data model backward-compatible with existing IndexedDB records.
- Add fields as optional first; include migration handling in read layer.
- Do not break seed invoice initialization behavior.
- Preserve API route shape unless introducing explicit versioning.
- Keep PDF coordinate map centralized in `fillInvoice.ts`.

## Testing Guidance
- Manual smoke tests:
  - Create, save, search, preview, clone, delete invoice.
  - Export PDF through both print and `/api/invoice`.
  - Validate long text wrapping in description box.
- Regression checks:
  - Invoice number auto-generation behavior.
  - Year grouping and sort order in saved list.
  - Required field validation and user messaging.

## Future Technical Enhancements
- Add schema versioning for IndexedDB records.
- Add JSON import/export backup.
- Optional persistent backend storage.
- Add lightweight e2e tests for core invoice workflows.
