/**
 * Storage layer: tries server first, falls back to IndexedDB.
 * Works when opened via file:// (IndexedDB only) or when served from server.
 */
(function (global) {
	'use strict';

	const IDB_NAME = 'killy-invoices';
	const IDB_STORE = 'invoices';
	const IDB_VERSION = 1;

	function openDB() {
		return new Promise((resolve, reject) => {
			const r = indexedDB.open(IDB_NAME, IDB_VERSION);
			r.onerror = () => reject(r.error);
			r.onsuccess = () => resolve(r.result);
			r.onupgradeneeded = function (e) {
				const db = e.target.result;
				if (!db.objectStoreNames.contains(IDB_STORE)) {
					const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
					store.createIndex('year', 'year', { unique: false });
				}
			};
		});
	}

	async function getAllFromDB() {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, 'readonly');
			const req = tx.objectStore(IDB_STORE).getAll();
			req.onsuccess = () => resolve(req.result || []);
			req.onerror = () => reject(req.error);
		});
	}

	async function getByIdFromDB(id) {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, 'readonly');
			const req = tx.objectStore(IDB_STORE).get(id);
			req.onsuccess = () => resolve(req.result || null);
			req.onerror = () => reject(req.error);
		});
	}

	async function saveToDB(inv) {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, 'readwrite');
			tx.objectStore(IDB_STORE).put(inv);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	async function deleteFromDB(id) {
		const db = await openDB();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(IDB_STORE, 'readwrite');
			tx.objectStore(IDB_STORE).delete(id);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	async function apiGetInvoices() {
		const res = await fetch('/api/invoices');
		if (!res.ok) throw new Error('Server error');
		const data = await res.json();
		return data.invoices;
	}

	async function apiSaveInvoice(inv) {
		const res = await fetch('/api/invoices', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(inv)
		});
		if (!res.ok) throw new Error('Server error');
	}

	async function apiDeleteInvoice(id) {
		const res = await fetch('/api/invoices/' + encodeURIComponent(id), { method: 'DELETE' });
		if (!res.ok) throw new Error('Server error');
	}

	async function apiBulkDelete(ids) {
		const res = await fetch('/api/invoices/bulk-delete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ids })
		});
		if (!res.ok) throw new Error('Server error');
	}

	async function apiImport(invoices) {
		const res = await fetch('/api/invoices/import', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ invoices })
		});
		if (!res.ok) throw new Error('Server error');
	}

	async function apiGetDate() {
		const res = await fetch('/api/date');
		if (!res.ok) throw new Error('Server error');
		const data = await res.json();
		return data.date;
	}

	async function getAllInvoices() {
		try {
			return await apiGetInvoices();
		} catch {
			return await getAllFromDB();
		}
	}

	async function getInvoiceById(id) {
		try {
			const invoices = await apiGetInvoices();
			return invoices.find(function (i) { return i.id === id; }) || null;
		} catch {
			return await getByIdFromDB(id);
		}
	}

	async function saveInvoice(inv) {
		try {
			await apiSaveInvoice(inv);
			await saveToDB(inv);
		} catch {
			await saveToDB(inv);
		}
	}

	async function deleteInvoice(id) {
		try {
			await apiDeleteInvoice(id);
		} catch (_) { /* continue to local */ }
		await deleteFromDB(id);
	}

	async function bulkDeleteInvoices(ids) {
		try {
			await apiBulkDelete(ids);
		} catch (_) { /* continue to local */ }
		const db = await openDB();
		return new Promise(function (resolve, reject) {
			const tx = db.transaction(IDB_STORE, 'readwrite');
			const store = tx.objectStore(IDB_STORE);
			ids.forEach(function (id) { store.delete(id); });
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	async function importInvoices(invoices) {
		try {
			await apiImport(invoices);
		} catch (_) { /* continue to local */ }
		const db = await openDB();
		return new Promise(function (resolve, reject) {
			const tx = db.transaction(IDB_STORE, 'readwrite');
			const store = tx.objectStore(IDB_STORE);
			store.clear();
			invoices.forEach(function (inv) { store.put(inv); });
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	async function getDefaultDate() {
		try {
			return await apiGetDate();
		} catch {
			return null;
		}
	}

	global.KillyAPI = {
		getAllInvoices,
		getInvoiceById,
		saveInvoice,
		deleteInvoice,
		bulkDeleteInvoices,
		importInvoices,
		getDefaultDate,
		getAllFromDB,
		saveToDB
	};
})(typeof window !== 'undefined' ? window : this);
