import path from 'node:path';
import fs from 'node:fs/promises';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { fillInvoice, type InvoiceData } from './pdf/fillInvoice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const PROJECT_ROOT = path.resolve(process.cwd());
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const INVOICES_FILE = path.join(DATA_DIR, 'invoices.json');
const DATE_FILE = path.join(DATA_DIR, 'date.json');

// CORS: allow all in dev; in prod consider restricting
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Serve static files from project root (index.html, invoices.html, logos/, Trade/, etc.)
app.use(express.static(PROJECT_ROOT, { index: false }));

// Ensure data directory and files exist
async function ensureDataFiles() {
	try {
		await fs.mkdir(DATA_DIR, { recursive: true });
		try {
			await fs.access(INVOICES_FILE);
		} catch {
			await fs.writeFile(INVOICES_FILE, '[]', 'utf8');
		}
		try {
			await fs.access(DATE_FILE);
		} catch {
			const today = new Date();
			const mm = String(today.getMonth() + 1).padStart(2, '0');
			const dd = String(today.getDate()).padStart(2, '0');
			const yyyy = today.getFullYear();
			await fs.writeFile(DATE_FILE, JSON.stringify({ date: `${mm}-${dd}-${yyyy}` }), 'utf8');
		}
	} catch (err) {
		console.error('Could not ensure data files:', err);
	}
}

function resolveTemplatePath(): string {
	// Prefer server-local asset
	const localAsset = path.resolve(__dirname, '../assets/jonesco-invoice.pdf');
	// Fallback to workspace root for local development
	const rootAsset = path.resolve(process.cwd(), 'jonesco-invoice.pdf');
	// Optional env override
	const envAsset = process.env.TEMPLATE_PATH;
	if (envAsset) return envAsset;
	return localAsset;
}

// --- Invoices & date API ---
app.get('/api/invoices', async (_req: Request, res: Response) => {
	try {
		await ensureDataFiles();
		const raw = await fs.readFile(INVOICES_FILE, 'utf8');
		const invoices = JSON.parse(raw || '[]');
		return res.json({ invoices });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Failed to read invoices' });
	}
});

app.post('/api/invoices', async (req: Request, res: Response) => {
	try {
		await ensureDataFiles();
		const inv = req.body;
		if (!inv || !inv.id) return res.status(400).json({ error: 'Invalid invoice: id required' });
		const raw = await fs.readFile(INVOICES_FILE, 'utf8');
		const invoices: unknown[] = JSON.parse(raw || '[]');
		const idx = invoices.findIndex((i: unknown) => (i as { id?: string })?.id === inv.id);
		if (idx >= 0) invoices[idx] = inv;
		else invoices.push(inv);
		await fs.writeFile(INVOICES_FILE, JSON.stringify(invoices, null, 2), 'utf8');
		return res.json({ ok: true });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Failed to save invoice' });
	}
});

app.delete('/api/invoices/:id', async (req: Request, res: Response) => {
	try {
		await ensureDataFiles();
		const id = req.params.id;
		const raw = await fs.readFile(INVOICES_FILE, 'utf8');
		const invoices: unknown[] = JSON.parse(raw || '[]');
		const filtered = invoices.filter((i: unknown) => (i as { id?: string })?.id !== id);
		await fs.writeFile(INVOICES_FILE, JSON.stringify(filtered, null, 2), 'utf8');
		return res.json({ ok: true });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Failed to delete invoice' });
	}
});

app.post('/api/invoices/bulk-delete', async (req: Request, res: Response) => {
	try {
		await ensureDataFiles();
		const { ids } = req.body as { ids?: string[] };
		if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });
		const set = new Set(ids);
		const raw = await fs.readFile(INVOICES_FILE, 'utf8');
		const invoices: unknown[] = JSON.parse(raw || '[]');
		const filtered = invoices.filter((i: unknown) => !set.has((i as { id?: string })?.id as string));
		await fs.writeFile(INVOICES_FILE, JSON.stringify(filtered, null, 2), 'utf8');
		return res.json({ ok: true });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Failed to bulk delete' });
	}
});

app.post('/api/invoices/import', async (req: Request, res: Response) => {
	try {
		await ensureDataFiles();
		const { invoices } = req.body as { invoices?: unknown[] };
		if (!Array.isArray(invoices)) return res.status(400).json({ error: 'invoices array required' });
		await fs.writeFile(INVOICES_FILE, JSON.stringify(invoices, null, 2), 'utf8');
		return res.json({ ok: true });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Failed to import' });
	}
});

app.get('/api/date', async (_req: Request, res: Response) => {
	try {
		await ensureDataFiles();
		const raw = await fs.readFile(DATE_FILE, 'utf8');
		const data = JSON.parse(raw || '{}');
		const date = data.date || (() => {
			const d = new Date();
			const mm = String(d.getMonth() + 1).padStart(2, '0');
			const dd = String(d.getDate()).padStart(2, '0');
			const yyyy = d.getFullYear();
			return `${mm}-${dd}-${yyyy}`;
		})();
		return res.json({ date });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Failed to read date' });
	}
});

app.post('/api/invoice', async (req: Request, res: Response) => {
	try {
		const data = req.body as InvoiceData;
		// Basic validation
		if (!data || !data.invoiceNumber || !data.client || !data.client.name) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		let templateBytes: Uint8Array | null = null;
		const candidates = [resolveTemplatePath(), path.resolve(process.cwd(), 'jonesco-invoice.pdf')];
		for (const p of candidates) {
			try {
				const buf = await fs.readFile(p);
				templateBytes = new Uint8Array(buf);
				break;
			} catch {
				// try next
			}
		}
		if (!templateBytes) {
			return res.status(500).json({ error: 'Template PDF not found. Set TEMPLATE_PATH or place file in server/assets.' });
		}

		const pdfBytes = await fillInvoice(templateBytes, data, { drawGrid: false });
		const filename = `invoice-${data.invoiceNumber}.pdf`;
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
		return res.status(200).send(Buffer.from(pdfBytes));
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Failed to generate invoice' });
	}
});

// Optional: debug grid to calibrate coordinates
app.get('/api/debug-grid', async (_req: Request, res: Response) => {
	try {
		let templateBytes: Uint8Array | null = null;
		const candidates = [resolveTemplatePath(), path.resolve(process.cwd(), 'jonesco-invoice.pdf')];
		for (const p of candidates) {
			try {
				const buf = await fs.readFile(p);
				templateBytes = new Uint8Array(buf);
				break;
			} catch {
				// try next
			}
		}
		if (!templateBytes) {
			return res.status(500).json({ error: 'Template PDF not found.' });
		}
		// Minimal data to render page + grid
		const minimalData: InvoiceData = {
			invoiceNumber: 'DEBUG',
			client: { name: 'Client Name', contact: '', address: '', email: '', phone: '' },
			summary: 'Summary',
			description: 'Description',
			date: new Date().toISOString().slice(0, 10)
		};
		const pdfBytes = await fillInvoice(templateBytes, minimalData, { drawGrid: true });
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', 'inline; filename="debug-grid.pdf"');
		return res.status(200).send(Buffer.from(pdfBytes));
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Failed to render debug grid' });
	}
});

// Serve static index.html file
app.get('/', async (_req, res) => {
	try {
		const indexPath = path.resolve(process.cwd(), 'index.html');
		const html = await fs.readFile(indexPath, 'utf8');
		res.contentType('text/html').send(html);
	} catch {
		res.status(404).send('index.html not found.');
	}
});

ensureDataFiles().then(() => {
	app.listen(PORT, () => {
		console.log(`Server listening on http://localhost:${PORT}`);
	});
}).catch((err) => {
	console.error('Failed to initialize data files:', err);
	process.exit(1);
});
