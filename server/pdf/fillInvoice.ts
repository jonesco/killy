import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';

export type InvoiceData = {
	invoiceNumber: string;
	client: {
		name: string;
		contact?: string;
		address?: string;
		email?: string;
		phone?: string;
	};
	summary: string;
	description: string; // multi-line allowed
	date?: string; // ISO yyyy-mm-dd
};

type Options = {
	drawGrid?: boolean;
};

type Coords = {
	invoiceNumber: { x: number; y: number };
	clientName: { x: number; y: number };
	clientAddress: { x: number; y: number };
	summary: { x: number; y: number };
	date: { x: number; y: number };
	descriptionBox: { x: number; y: number; width: number; lineHeight: number; height?: number };
};

// NOTE: These are initial guesses; use /api/debug-grid to calibrate and then tweak.
const coords: Coords = {
	invoiceNumber: { x: 460, y: 730 },
	clientName: { x: 70, y: 670 },
	clientAddress: { x: 70, y: 650 },
	summary: { x: 70, y: 610 },
	date: { x: 460, y: 710 },
	descriptionBox: { x: 40, y: 480, width: 520, lineHeight: 16, height: 160 }
};

export async function fillInvoice(templateBytes: Uint8Array, data: InvoiceData, options: Options = {}): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.load(templateBytes);
	const [page] = pdfDoc.getPages();
	const font: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const boldFont: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
	const fontSize = 12;
	const smallSize = 10;

	if (options.drawGrid) {
		drawCalibrationGrid(page);
	}

	// Invoice Number and Date
	drawText(page, boldFont, data.invoiceNumber, coords.invoiceNumber.x, coords.invoiceNumber.y, fontSize, rgb(0, 0, 0));
	if (data.date) {
		drawText(page, font, data.date, coords.date.x, coords.date.y, fontSize, rgb(0, 0, 0));
	}

	// Client Info
	drawText(page, boldFont, data.client.name, coords.clientName.x, coords.clientName.y, fontSize, rgb(0, 0, 0));
	let y = coords.clientName.y - (fontSize + 4);
	if (data.client.contact) {
		drawText(page, font, `Attn: ${data.client.contact}`, coords.clientName.x, y, smallSize, rgb(0, 0, 0));
		y -= smallSize + 2;
	}
	const addressLines = (data.client.address || '').split(/\r?\n/).filter(Boolean);
	if (!data.client.contact && addressLines.length > 0) {
		y = coords.clientAddress.y;
	}
	for (const line of addressLines) {
		drawText(page, font, line, coords.clientName.x, y, smallSize, rgb(0, 0, 0));
		y -= smallSize + 2;
	}
	if (data.client.email) {
		drawText(page, font, data.client.email, coords.clientName.x, y, smallSize, rgb(0, 0, 0));
		y -= smallSize + 2;
	}
	if (data.client.phone) {
		drawText(page, font, data.client.phone, coords.clientName.x, y, smallSize, rgb(0, 0, 0));
		// y -= smallSize + 2;
	}

	// Summary
	drawText(page, font, data.summary, coords.summary.x, coords.summary.y, fontSize, rgb(0, 0, 0));

	// Description box (blue area) with wrapping
	const lines = wrapText(font, data.description || '', fontSize, coords.descriptionBox.width);
	let descY = coords.descriptionBox.y;
	const maxHeight = coords.descriptionBox.height ?? 9999;
	for (const line of lines) {
		if (descY < coords.descriptionBox.y - maxHeight) break;
		drawText(page, font, line, coords.descriptionBox.x, descY, fontSize, rgb(0, 0, 0));
		descY -= coords.descriptionBox.lineHeight;
	}

	return await pdfDoc.save();
}

function drawText(page: any, font: PDFFont, text: string, x: number, y: number, size: number, color: unknown) {
	if (!text) return;
	page.drawText(text, { x, y, size, font, color });
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
	const paragraphs = text.replace(/\r/g, '').split('\n');
	const lines: string[] = [];
	for (const para of paragraphs) {
		const words = para.split(/\s+/);
		let line = '';
		for (const word of words) {
			const testLine = line ? `${line} ${word}` : word;
			const width = font.widthOfTextAtSize(testLine, size);
			if (width <= maxWidth) {
				line = testLine;
			} else {
				if (line) lines.push(line);
				// If single long word, hard-break it
				if (font.widthOfTextAtSize(word, size) > maxWidth) {
					lines.push(...breakLongWord(font, word, size, maxWidth));
					line = '';
				} else {
					line = word;
				}
			}
		}
		if (line) lines.push(line);
	}
	return lines;
}

function breakLongWord(font: PDFFont, word: string, size: number, maxWidth: number): string[] {
	const chars = [...word];
	let part = '';
	const parts: string[] = [];
	for (const ch of chars) {
		const test = part + ch;
		if (font.widthOfTextAtSize(test, size) <= maxWidth) {
			part = test;
		} else {
			if (part) parts.push(part);
			part = ch;
		}
	}
	if (part) parts.push(part);
	return parts;
}

function drawCalibrationGrid(page: any) {
	// Light coordinate grid every 50 units
	const { width, height } = page.getSize();
	const step = 50;
	for (let x = 0; x <= width; x += step) {
		page.drawLine({ start: { x, y: 0 }, end: { x, y: height }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
		page.drawText(String(x), { x: x + 2, y: 4, size: 6, color: rgb(0.5, 0.5, 0.5) });
	}
	for (let y = 0; y <= height; y += step) {
		page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
		page.drawText(String(y), { x: 2, y: y + 2, size: 6, color: rgb(0.5, 0.5, 0.5) });
	}
}


