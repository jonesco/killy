# Jonesco Invoice Generator User Flows

## Primary Flow: Create and Export Invoice
1. User opens app on `New Invoice` tab.
2. User enters client name and date.
3. System auto-generates invoice number (`PREFIX-MM-DD-YYYY`).
4. User fills contact/address/summary/description.
5. Preview updates in real time.
6. User clicks `Save Invoice`.
7. System writes invoice record to IndexedDB.
8. User clicks `Download PDF` or `Print`.
9. System produces PDF (browser print or API-generated file).

## Flow: Create From Existing Invoice
1. User navigates to `Saved Invoices`.
2. User searches or browses by year.
3. User selects `Copy` / `Start from saved`.
4. System opens `New Invoice` with fields prefilled.
5. User edits date/details and exports new invoice.

## Flow: Search and Preview Historical Invoice
1. User opens `Saved Invoices`.
2. User enters search text (client/invoice/date).
3. System filters invoice list instantly.
4. User clicks row to open preview modal.
5. User can export, print, or clone invoice from modal.

## Flow: Bulk Delete
1. User enters `Saved Invoices`.
2. User selects multiple invoices via checkboxes.
3. User clicks `Delete Selected`.
4. System requests confirmation.
5. Confirmed records are removed from IndexedDB and UI updates.

## UX Rules
- Keep form actions persistent and obvious (`Save`, `Download`, `Clear`).
- Keep high visual parity between preview and PDF output.
- Use clear empty/error states for missing required fields.
- Preserve user-entered line breaks in address and description content.
- Always show recent invoices first within year groups.

## Edge Cases
- Missing required fields on save/export.
- Duplicate invoice numbers.
- Very long descriptions exceeding PDF description box.
- Browser storage disabled/unavailable.
- Missing server template PDF for API export.

## Suggested Empty/Error Copy
- Save error: "Invoice could not be saved. Please try again."
- Required fields: "Client name and invoice number are required."
- Export error: "PDF generation failed. Verify template availability."
- No results: "No invoices match your search."
