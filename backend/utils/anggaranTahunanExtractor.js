// Ekstraksi anggaran per tahun dari teks dokumen RKA secara deterministik (tanpa AI),
// supaya SEMUA tahun yang tertulis di dokumen (n-1, n, n+1, n+2, ...) terbaca — bukan hanya tahun berjalan.
// Hasilnya digabung dengan hasil AI (lihat mergeAnggaranTahunan).

const YEAR_MIN = 2000;
const YEAR_MAX = 2100;

function parseRupiah(raw) {
  // "6.273.600,00" -> 6273600 ; "6,273,600.00" -> 6273600
  let s = String(raw || '').trim();
  if (!s) return undefined;
  if (/,\d{1,2}$/.test(s) && s.includes('.')) s = s.replace(/,\d{1,2}$/, '');
  else if (/\.\d{1,2}$/.test(s) && s.includes(',')) s = s.replace(/\.\d{1,2}$/, '');
  const n = Number(s.replace(/[.,\s]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

const LABEL_PRIORITY = [
  [/alokasi/i, 4],
  [/pagu/i, 4],
  [/prakiraan|perkiraan|maju/i, 3],
  [/rencana/i, 3],
  [/anggaran|jumlah|total/i, 2]
];

function priorityOf(label) {
  for (const [re, p] of LABEL_PRIORITY) if (re.test(label)) return p;
  return 1;
}

// Pola: "<label> Tahun 2027 ... Rp 1.234.567,00"  /  "Tahun Anggaran 2027 : Rp. 1.234"
const PATTERN = /((?:alokasi|pagu(?:\s+indikatif)?|rencana|prakiraan\s+maju|perkiraan\s+maju|anggaran|jumlah)?[^\S\n]*(?:tahun(?:\s+anggaran)?|ta\.?)[^\S\n]*)((?:19|20)\d{2})([^\n]{0,60}?\n?[^\n]{0,15}?)Rp\.?\s*([\d][\d.,]*)/gi;

export function extractAnggaranTahunanFromText(rawText) {
  const text = String(rawText || '').replace(/\r\n?/g, '\n');
  if (!text) return [];
  const best = new Map(); // tahun -> { jumlah, prio, idx }
  let m;
  let idx = 0;
  PATTERN.lastIndex = 0;
  while ((m = PATTERN.exec(text)) !== null) {
    idx++;
    const tahun = Number(m[2]);
    if (tahun < YEAR_MIN || tahun > YEAR_MAX) continue;
    const jumlah = parseRupiah(m[4]);
    if (!jumlah || jumlah < 1000) continue;
    const prio = priorityOf(m[1] || '');
    const cur = best.get(tahun);
    if (!cur || prio > cur.prio) best.set(tahun, { jumlah, prio, idx });
  }
  return [...best.entries()]
    .map(([tahun, v]) => ({ tahun, jumlah: v.jumlah, _prio: v.prio }))
    .sort((a, b) => a.tahun - b.tahun);
}

function cleanRows(rows) {
  const out = new Map();
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || typeof r !== 'object') continue;
    const tahun = Math.trunc(Number(r.tahun));
    const jumlah = Number(r.jumlah);
    if (!Number.isFinite(tahun) || tahun < YEAR_MIN || tahun > YEAR_MAX) continue;
    if (!Number.isFinite(jumlah) || jumlah <= 0) continue;
    out.set(tahun, { tahun, jumlah: Math.round(jumlah) });
  }
  return out;
}

// Gabungkan: hasil AI utama + AI terfokus + regex dokumen. Tiap tahun hanya muncul sekali.
// Nilai dari regex berlabel kuat (Alokasi/Pagu/Rencana, prio >= 3) menimpa AI; selain itu AI tetap dipakai.
export function mergeAnggaranTahunan(aiRows, extraAiRows, regexRows) {
  const merged = cleanRows(aiRows);
  for (const [t, v] of cleanRows(extraAiRows)) if (!merged.has(t)) merged.set(t, v);
  for (const r of Array.isArray(regexRows) ? regexRows : []) {
    if (!merged.has(r.tahun) || (r._prio || 0) >= 3) merged.set(r.tahun, { tahun: r.tahun, jumlah: r.jumlah });
  }
  return [...merged.values()].sort((a, b) => a.tahun - b.tahun);
}
