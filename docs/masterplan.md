## masterplan.md

### 🚀 Elevator Pitch (30 seconds)
A calm, capable invoicing system built just for Jonesco. Create, edit, track, and manage invoices with ease — and instantly visualize revenue trends by client, service, or timeframe.

### ❓ Problem & Mission
**Problem**: Off-the-shelf invoicing tools are bloated or generic. Jonesco needs a lightweight solution tailored to its workflow — one that makes invoicing painless and tracking revenue intuitive.

**Mission**: Build a custom invoice generator that feels effortless to use, centralizes records, and turns raw invoices into real business insight.

### 🎯 Target Audience
- **Primary**: Jonesco’s internal team (admin, finance, project leads).
- **Secondary**: Select clients receiving invoices (via secure share links or PDF).
- **Tertiary**: Jonesco leadership reviewing financial health at a glance.

### 🧩 Core Features
- Create & edit invoices (itemized, tax, due date, notes)
- Auto-generate PDFs and send/share securely
- View all invoices in sortable table
- Track revenue by:
  - Client
  - Month
  - Service or category
- Flag unpaid/overdue invoices
- Search and filter by keyword/date/status
- Export CSV reports

### 🛠️ High-Level Tech Stack
- **Frontend**: React or Next.js → fast UI, print-friendly invoice views
- **Backend**: Supabase → fast to set up, auth + database in one
- **Database**: Postgres (via Supabase) → great for structured invoice data
- **PDF Generation**: `react-pdf` or server-side render
- **Auth**: Supabase Auth → email login for now
- **Charts**: Chart.js or Recharts → simple and effective visualizations

### 🧬 Conceptual Data Model
- **User**
  - id, name, email, role
- **Client**
  - id, name, contact_email, default_terms
- **Invoice**
  - id, client_id, status (draft/sent/paid), issue_date, due_date, notes
- **InvoiceItem**
  - id, invoice_id, description, quantity, rate, total

Relationships:
- One `Client` has many `Invoices`
- One `Invoice` has many `InvoiceItems`

### 🎨 UI Design Principles
- **Feels like**: A calm studio in Copenhagen — minimal, warm, and deliberate:contentReference[oaicite:0]{index=0}
- Use whitespace generously; avoid clutter
- Tables should default to focus mode; reveal detail on interaction
- Animations = gentle + purposeful (e.g., fade on invoice send)
- Default state: supportive empty states with helpful tips (e.g., "No invoices yet — create your first one!")

### 🔐 Security & Compliance
- Authenticated user access (Supabase Auth)
- Private invoice data (row-level security per user/org)
- Secure PDF links (tokenized URL or download-only)
- GDPR-compliant data handling (Supabase covers most)

### 🛣️ Phased Roadmap
**MVP**  
- Manual invoice creation, edit, PDF download  
- Basic client management  
- View all invoices in a sortable table  

**V1**  
- Basic analytics (total revenue by month/client)  
- Search/filter, CSV export  
- Status tags (sent/paid/overdue)  

**V2**  
- Reminders for unpaid invoices  
- Send invoices via email from app  
- Client portal (view past invoices)

### ⚠️ Risks & Mitigations
- **Too much scope early** → Use phased delivery with tight MVP
- **Invoice formatting edge cases** → Use templated components with tests
- **Low adoption** → Build for internal use first, test with actual Jonesco staff

### 🌱 Future Expansion Ideas
- Recurring invoices (subscriptions)
- Stripe or Wise integration for payments
- AI-generated invoice summaries or categorization
- Multi-user org permissions (finance vs admin vs read-only)
