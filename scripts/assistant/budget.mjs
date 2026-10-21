import { closeSync, constants, fstatSync, fsyncSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { modelPolicy } from './config.mjs';

const entry = z.object({id: z.string().uuid(), amount: z.number().finite().nonnegative(), state: z.enum(['reserved', 'settled'])}).strict();
const ledgerSchema = z.object({version: z.literal(1), capUsd: z.number().finite().positive(), halted: z.boolean(), entries: z.array(entry)}).strict();

function appendSnapshot(file, ledger) {
  const fd = openSync(file, constants.O_WRONLY | constants.O_APPEND);
  try {
    const payload = JSON.stringify(ledger) + '\n';
    if (fstatSync(fd).size + Buffer.byteLength(payload) > modelPolicy.maxJournalBytes) throw new Error('Budget journal limit');
    writeFileSync(fd, payload); fsyncSync(fd);
  }
  finally { closeSync(fd); }
}

export function readBudget(file) {
  const journal = readFileSync(file, 'utf8');
  if (!journal.endsWith('\n')) throw new Error('Incomplete budget write');
  // Any torn/corrupt entry stops startup. Never fall back to an older budget snapshot.
  return journal.trimEnd().split('\n').map(line => ledgerSchema.parse(JSON.parse(line))).at(-1);
}

export function initializeBudget(file, capUsd) {
  // Provision explicitly once; a missing runtime ledger must never silently reset spending.
  const fd = openSync(file, 'wx', 0o600);
  try { writeFileSync(fd, JSON.stringify(ledgerSchema.parse({version: 1, capUsd, halted: false, entries: []})) + '\n'); fsyncSync(fd); }
  finally { closeSync(fd); }
}

export function openBudget(file, capUsd, reservationUsd, persist = appendSnapshot) {
  if (!Number.isFinite(reservationUsd) || reservationUsd <= 0 || reservationUsd > capUsd) throw new Error('Invalid reservation');
  const lock = `${file}.lock`;
  const fd = openSync(lock, 'wx', 0o600);
  let closed = false;
  let recoveryRequired = false;
  const release = () => { if (!closed) { closeSync(fd); if (!recoveryRequired) unlinkSync(lock); closed = true; } };
  try {
    const ledger = readBudget(file);
    if (ledger.capUsd !== capUsd || new Set(ledger.entries.map(e => e.id)).size !== ledger.entries.length) throw new Error('Budget mismatch');
    const save = () => { try { persist(file, ledger); } catch (error) { ledger.halted = true; recoveryRequired = true; throw error; } };
    return {
      reserve() {
        if (closed || ledger.halted) throw new Error('Budget closed');
        const committed = ledger.entries.reduce((sum, item) => sum + item.amount, 0);
        if (committed + reservationUsd > capUsd || ledger.entries.length >= modelPolicy.maxReservations) throw new Error('Project budget exhausted');
        const item = {id: randomUUID(), amount: reservationUsd, state: 'reserved'};
        ledger.entries.push(item); save(); return item.id;
      },
      settle(id, actualUsd) {
        const item = ledger.entries.find(e => e.id === id);
        // Unknown, cancelled or malformed responses retain the full reservation permanently.
        if (closed || !item || item.state !== 'reserved' || !Number.isFinite(actualUsd) || actualUsd < 0) return;
        if (actualUsd > item.amount) { ledger.halted = true; item.amount = actualUsd; save(); throw new Error('Billing anomaly; spending stopped'); }
        item.amount = actualUsd; item.state = 'settled'; save();
      },
      close: release,
    };
  } catch (error) { release(); throw error; }
}
