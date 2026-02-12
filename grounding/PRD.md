# Jonesco Invoice Generator PRD

## Product Overview
Jonesco Invoice Generator is a web app for creating, saving, searching, previewing, and exporting branded client invoices. It supports rapid invoice creation with a live preview and persistent browser-side storage, with optional server-side PDF generation from a fixed template.

## Problem Statement
Jonesco needs a repeatable way to generate professional invoices without manually editing PDFs or losing historical records. The current need is a fast, reliable process for:
- Creating new invoices from structured fields
- Reusing prior invoices as templates
- Managing historical invoices by year
- Exporting polished PDFs that match the Jonesco brand

## Goals
- Reduce time-to-create invoice to under 3 minutes for repeat clients.
- Ensure invoice formatting consistency across all generated PDFs.
- Keep invoice history accessible and searchable in-app.
- Support both print-based and server-generated PDF export workflows.

## Non-Goals
- Multi-user authentication and role-based access.
- Cloud sync across devices.
- Full accounting integrations (QuickBooks/Xero/etc.).
- Payment collection workflows.

## Target Users
- Primary: Jonesco owner/operator creating invoices.
- Secondary: Internal admin staff preparing invoices from prior jobs.

## User Stories
- As a user, I can create a new invoice from a form and immediately preview it.
- As a user, I can save invoices locally and retrieve them later.
- As a user, I can search past invoices by client, invoice number, or date.
- As a user, I can duplicate a prior invoice to use as a template.
- As a user, I can export a final PDF suitable for client delivery.
- As a user, I can bulk-delete outdated invoices from local storage.

## Functional Requirements
1. Invoice Creation
- Form captures date, invoice number, client details, summary, and detailed description.
- Invoice number auto-generates from client name + date, but remains editable.
- Required validation: client name and invoice number before save/export.

2. Live Preview
- App renders an on-screen preview matching invoice visual style.
- Preview updates as fields change.
- Modal preview supports print/export actions.

3. Local Persistence
- Store invoices in IndexedDB database `jonesco-invoices`.
- Invoice records grouped by year for navigation.
- Seed records may pre-populate on first run.

4. Saved Invoices UX
- Search/filter by invoice number, client name, or date.
- Per-record actions: preview, export, duplicate, delete.
- Bulk selection and bulk delete supported.

5. PDF Export
- Browser print-to-PDF available from preview.
- Optional API route (`POST /api/invoice`) returns PDF bytes from server.
- PDF output should preserve template layout and text readability.

## Non-Functional Requirements
- Performance: Saved invoice list operations should remain responsive with 1,000+ invoices.
- Reliability: Save and delete actions should not silently fail; errors should be surfaced.
- Compatibility: Works in modern Chromium, Safari, and Firefox desktop browsers.
- Maintainability: Core logic stays in plain TypeScript/JavaScript without framework lock-in.

## Success Metrics
- 95% of invoices created without manual PDF post-editing.
- <1% failure rate on invoice save/export flows.
- Median time from open form to export under 3 minutes.

## Risks and Mitigations
- Risk: IndexedDB data loss via browser clearing.
- Mitigation: Add import/export backup flow in future roadmap.

- Risk: PDF coordinate drift if template changes.
- Mitigation: Keep calibration endpoint and coordinate map in one module.

- Risk: Long description overflow in PDF text area.
- Mitigation: Wrap text with max-height clipping and preview warnings.

## Roadmap (Phased)
1. Stabilization
- Tighten field validation and error messaging.
- Add regression checks for save/search/export.

2. Data Durability
- JSON backup/export and restore.
- Optional server-side persistence mode.

3. Workflow Enhancements
- Invoice status flags (draft/sent/paid).
- Optional totals and line-item editor.
