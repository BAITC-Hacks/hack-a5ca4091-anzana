export const ASSETS = ["BTC", "ETH", "SOL", "TON", "USDT"] as const;
export type Asset = (typeof ASSETS)[number];

export const SOURCES = ["Binance", "Bybit", "AIFC", "Вручную"] as const;
export type Source = (typeof SOURCES)[number];

export type Side = "buy" | "sell";

export type Tx = {
  id: string;
  at: string;
  asset: Asset;
  side: Side;
  qty: number;
  priceUsd: number;
  usdKzt: number;
  source: Source;
};

export const TAX_RATE = 0.1;
export const SPOT_ISO = "2026-09-30T16:33:00+05:00";

const EPS = 1e-8;

type Anchor = { t: number; v: number };

function day(isoDate: string) {
  return Date.parse(`${isoDate}T00:00:00Z`);
}

const FX: Anchor[] = [
  { t: day("2025-01-15"), v: 511.2 },
  { t: day("2025-04-01"), v: 504.8 },
  { t: day("2025-07-01"), v: 525.4 },
  { t: day("2025-10-01"), v: 538.9 },
  { t: day("2026-01-15"), v: 499.1 },
  { t: day("2026-04-01"), v: 507.6 },
  { t: day("2026-07-01"), v: 518.2 },
  { t: day("2026-09-30"), v: 527.4 },
];

const PRICES: Record<Exclude<Asset, "USDT">, Anchor[]> = {
  BTC: [
    { t: day("2025-01-01"), v: 94200 },
    { t: day("2025-06-01"), v: 105400 },
    { t: day("2025-10-01"), v: 113200 },
    { t: day("2025-12-15"), v: 97200 },
    { t: day("2026-03-01"), v: 89400 },
    { t: day("2026-06-15"), v: 86800 },
    { t: day("2026-09-30"), v: 94120 },
  ],
  ETH: [
    { t: day("2025-01-01"), v: 3340 },
    { t: day("2025-03-04"), v: 2240 },
    { t: day("2025-07-15"), v: 2985 },
    { t: day("2025-12-14"), v: 3420 },
    { t: day("2026-04-01"), v: 2100 },
    { t: day("2026-08-17"), v: 3890 },
    { t: day("2026-09-30"), v: 3650 },
  ],
  SOL: [
    { t: day("2025-01-01"), v: 190 },
    { t: day("2025-04-18"), v: 132.4 },
    { t: day("2025-08-28"), v: 188.2 },
    { t: day("2026-03-11"), v: 142.8 },
    { t: day("2026-09-24"), v: 176.5 },
    { t: day("2026-09-30"), v: 168.4 },
  ],
  TON: [
    { t: day("2025-01-01"), v: 5.4 },
    { t: day("2025-05-22"), v: 3.42 },
    { t: day("2025-11-19"), v: 5.15 },
    { t: day("2026-06-01"), v: 3.1 },
    { t: day("2026-09-30"), v: 4.82 },
  ],
};

function lerp(anchors: Anchor[], time: number) {
  if (time <= anchors[0].t) return anchors[0].v;
  const last = anchors[anchors.length - 1];
  if (time >= last.t) return last.v;
  for (let i = 1; i < anchors.length; i++) {
    if (time <= anchors[i].t) {
      const a = anchors[i - 1];
      const b = anchors[i];
      const k = (time - a.t) / (b.t - a.t);
      return a.v + (b.v - a.v) * k;
    }
  }
  return last.v;
}

function unitNoise(iso: string, salt: string) {
  let h = 2166136261;
  const s = `${iso}|${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function quoteAt(iso: string, asset: Asset) {
  const time = Date.parse(iso);
  const safeTime = Number.isFinite(time) ? time : Date.parse(SPOT_ISO);
  const fx = lerp(FX, safeTime);
  const usdKzt = Math.round((fx + (unitNoise(iso, "fx") - 0.5) * 0.28) * 100) / 100;
  if (asset === "USDT") return { priceUsd: 1, usdKzt };
  const px = lerp(PRICES[asset], safeTime);
  const priceUsd = Math.round(px * (1 + (unitNoise(iso, asset) - 0.5) * 0.0016) * 100) / 100;
  return { priceUsd, usdKzt };
}

export const SEED: Tx[] = [
  { id: "t1", at: "2025-02-11T09:14:22+05:00", asset: "BTC", side: "buy", qty: 0.42, priceUsd: 96840, usdKzt: 504.18, source: "Binance" },
  { id: "t2", at: "2025-03-04T16:02:51+05:00", asset: "ETH", side: "buy", qty: 6.5, priceUsd: 2240, usdKzt: 499.72, source: "Bybit" },
  { id: "t3", at: "2025-04-18T11:33:08+05:00", asset: "SOL", side: "buy", qty: 85, priceUsd: 132.4, usdKzt: 512.05, source: "Binance" },
  { id: "t4", at: "2025-05-22T19:48:17+05:00", asset: "TON", side: "buy", qty: 1200, priceUsd: 3.42, usdKzt: 510.44, source: "Bybit" },
  { id: "t5", at: "2025-06-09T08:21:44+05:00", asset: "BTC", side: "sell", qty: 0.12, priceUsd: 105620, usdKzt: 518.9, source: "Binance" },
  { id: "t6", at: "2025-07-15T13:05:03+05:00", asset: "ETH", side: "sell", qty: 2, priceUsd: 2985, usdKzt: 526.33, source: "Binance" },
  { id: "t7", at: "2025-08-28T21:17:39+05:00", asset: "SOL", side: "sell", qty: 30, priceUsd: 188.2, usdKzt: 538.11, source: "Bybit" },
  { id: "t8", at: "2025-09-12T10:44:12+05:00", asset: "BTC", side: "buy", qty: 0.18, priceUsd: 112450, usdKzt: 541.6, source: "Binance" },
  { id: "t9", at: "2025-10-03T15:29:55+05:00", asset: "USDT", side: "buy", qty: 8000, priceUsd: 1, usdKzt: 537.22, source: "Binance" },
  { id: "t10", at: "2025-11-19T07:58:26+05:00", asset: "TON", side: "sell", qty: 400, priceUsd: 5.15, usdKzt: 522.08, source: "Bybit" },
  { id: "t11", at: "2025-12-14T18:12:41+05:00", asset: "ETH", side: "sell", qty: 1.5, priceUsd: 3420, usdKzt: 509.75, source: "Binance" },
  { id: "t12", at: "2026-01-20T12:06:18+05:00", asset: "BTC", side: "sell", qty: 0.08, priceUsd: 98400, usdKzt: 498.4, source: "Binance" },
  { id: "t13", at: "2026-03-11T09:40:02+05:00", asset: "SOL", side: "buy", qty: 40, priceUsd: 142.8, usdKzt: 503.15, source: "AIFC" },
  { id: "t14", at: "2026-06-02T16:22:47+05:00", asset: "BTC", side: "buy", qty: 0.1, priceUsd: 87200, usdKzt: 511.9, source: "Binance" },
  { id: "t15", at: "2026-08-17T11:11:33+05:00", asset: "ETH", side: "sell", qty: 1.2, priceUsd: 3890, usdKzt: 519.6, source: "Bybit" },
  { id: "t16", at: "2026-09-24T14:33:09+05:00", asset: "SOL", side: "sell", qty: 25, priceUsd: 176.5, usdKzt: 524.28, source: "Binance" },
];

export function unitKzt(priceUsd: number, usdKzt: number) {
  return priceUsd * usdKzt;
}

function money(n: number) {
  return Math.round(n * 100) / 100;
}

export type LotUse = {
  at: string;
  qty: number;
  unitCostKzt: number;
};

export type Disposal = {
  tx: Tx;
  sold: number;
  shortfall: number;
  proceeds: number;
  cost: number;
  gain: number;
  lots: LotUse[];
};

export type Holding = {
  asset: Asset;
  qty: number;
  costKzt: number;
  avgCostKzt: number;
  markUsd: number;
  markKzt: number;
  marketKzt: number;
  unrealized: number;
};

export type YearReport = {
  year: number;
  disposals: Disposal[];
  proceeds: number;
  cost: number;
  gainTotal: number;
  gains: number;
  losses: number;
  taxable: number;
  tax: number;
  months: { key: string; label: string; gain: number }[];
};

type Lot = {
  at: string;
  asset: Asset;
  qty: number;
  unitCostKzt: number;
};

function yearOf(iso: string) {
  const y = Number(iso.slice(0, 4));
  return Number.isFinite(y) ? y : 0;
}

export function buildBooks(txs: Tx[]) {
  const sorted = [...txs].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  const queues = new Map<Asset, Lot[]>();
  const disposals: Disposal[] = [];

  for (const tx of sorted) {
    const queue = queues.get(tx.asset) ?? [];
    queues.set(tx.asset, queue);
    if (tx.side === "buy") {
      queue.push({
        at: tx.at,
        asset: tx.asset,
        qty: tx.qty,
        unitCostKzt: unitKzt(tx.priceUsd, tx.usdKzt),
      });
      continue;
    }
    let need = tx.qty;
    let cost = 0;
    const lots: LotUse[] = [];
    while (need > EPS && queue.length) {
      const lot = queue[0];
      const take = Math.min(lot.qty, need);
      cost += take * lot.unitCostKzt;
      lots.push({ at: lot.at, qty: take, unitCostKzt: lot.unitCostKzt });
      lot.qty -= take;
      need -= take;
      if (lot.qty <= EPS) queue.shift();
    }
    const shortfall = need > EPS ? need : 0;
    const sold = tx.qty - shortfall;
    const proceeds = sold * unitKzt(tx.priceUsd, tx.usdKzt);
    disposals.push({
      tx,
      sold,
      shortfall,
      proceeds: money(proceeds),
      cost: money(cost),
      gain: money(proceeds - cost),
      lots,
    });
  }

  const spotFx = quoteAt(SPOT_ISO, "USDT").usdKzt;
  const holdings: Holding[] = [];
  for (const asset of ASSETS) {
    const left = (queues.get(asset) ?? []).filter((lot) => lot.qty > EPS);
    const qty = left.reduce((s, lot) => s + lot.qty, 0);
    if (qty <= EPS) continue;
    const costKzt = left.reduce((s, lot) => s + lot.qty * lot.unitCostKzt, 0);
    const markUsd = quoteAt(SPOT_ISO, asset).priceUsd;
    const markKzt = markUsd * spotFx;
    const marketKzt = qty * markKzt;
    holdings.push({
      asset,
      qty,
      costKzt: money(costKzt),
      avgCostKzt: qty > 0 ? costKzt / qty : 0,
      markUsd,
      markKzt,
      marketKzt: money(marketKzt),
      unrealized: money(marketKzt - costKzt),
    });
  }

  return { disposals, holdings, spotFx };
}

const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export function reportFor(txs: Tx[], year: number): YearReport & { holdings: Holding[]; spotFx: number } {
  const { disposals, holdings, spotFx } = buildBooks(txs);
  const inYear = disposals.filter((d) => yearOf(d.tx.at) === year);
  const proceeds = money(inYear.reduce((s, d) => s + d.proceeds, 0));
  const cost = money(inYear.reduce((s, d) => s + d.cost, 0));
  const gainTotal = money(inYear.reduce((s, d) => s + d.gain, 0));
  const gains = money(inYear.filter((d) => d.gain > 0).reduce((s, d) => s + d.gain, 0));
  const losses = money(inYear.filter((d) => d.gain < 0).reduce((s, d) => s + d.gain, 0));
  const taxable = Math.max(0, gainTotal);
  const tax = Math.round(taxable * TAX_RATE);
  const byMonth = new Map<string, number>();
  for (const d of inYear) {
    const key = d.tx.at.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + d.gain);
  }
  const months = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, gain]) => {
      const m = Number(key.slice(5, 7)) - 1;
      return { key, label: `${MONTHS[m]} ${key.slice(2, 4)}`, gain: money(gain) };
    });
  return { year, disposals: inYear, proceeds, cost, gainTotal, gains, losses, taxable, tax, months, holdings, spotFx };
}

export function availableYears(txs: Tx[]) {
  const years = new Set<number>();
  for (const tx of txs) {
    const y = yearOf(tx.at);
    if (y) years.add(y);
  }
  if (!years.size) years.add(2025);
  return [...years].sort((a, b) => b - a);
}

export function inYear(iso: string, year: number) {
  return yearOf(iso) === year;
}

const kzt0 = new Intl.NumberFormat("ru-KZ", { maximumFractionDigits: 0 });
const kzt2 = new Intl.NumberFormat("ru-KZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const qtyFmt = new Intl.NumberFormat("ru-KZ", { maximumFractionDigits: 8 });
const fxFmt = new Intl.NumberFormat("ru-KZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatKzt(n: number) {
  const sign = n < 0 ? "−" : "";
  return `${sign}${kzt0.format(Math.abs(Math.round(n)))} ₸`;
}

export function formatKztExact(n: number) {
  const sign = n < 0 ? "−" : "";
  return `${sign}${kzt2.format(Math.abs(n))} ₸`;
}

export function formatUsd(n: number) {
  return usd.format(n);
}

export function formatQty(n: number) {
  return qtyFmt.format(n);
}

export function formatFx(n: number) {
  return fxFmt.format(n);
}

const stampFmt = new Intl.DateTimeFormat("ru-KZ", {
  timeZone: "Asia/Almaty",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function formatStamp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return stampFmt.format(d);
}

export function formatDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-KZ", {
    timeZone: "Asia/Almaty",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function sideLabel(side: Side) {
  return side === "buy" ? "покупка" : "продажа";
}

export function toCsv(txs: Tx[]) {
  const header = "datetime,asset,side,qty,price_usd,usd_kzt,source";
  const lines = [...txs]
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((tx) =>
      [tx.at, tx.asset, tx.side, tx.qty, tx.priceUsd, tx.usdKzt, tx.source].join(","),
    );
  return [header, ...lines].join("\n");
}

export function parseCsv(text: string): { txs: Tx[]; errors: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const txs: Tx[] = [];
  const errors: string[] = [];
  lines.forEach((line, index) => {
    if (index === 0 && /asset/i.test(line) && /side/i.test(line)) return;
    const cells = line.split(",").map((c) => c.trim());
    if (cells.length < 6) {
      errors.push(`Строка ${index + 1}: мало колонок`);
      return;
    }
    const [rawAt, rawAsset, rawSide, rawQty, rawPx, rawFx, rawSource] = cells;
    const asset = rawAsset.toUpperCase() as Asset;
    if (!ASSETS.includes(asset)) {
      errors.push(`Строка ${index + 1}: неизвестный актив ${rawAsset}`);
      return;
    }
    const sideRaw = rawSide.toLowerCase();
    const side: Side | null =
      sideRaw === "buy" || sideRaw === "покупка"
        ? "buy"
        : sideRaw === "sell" || sideRaw === "продажа"
          ? "sell"
          : null;
    if (!side) {
      errors.push(`Строка ${index + 1}: сторона должна быть buy или sell`);
      return;
    }
    const qty = Number(rawQty);
    const priceUsd = Number(rawPx);
    const usdKzt = Number(rawFx);
    if (!(qty > 0) || !(priceUsd > 0) || !(usdKzt > 0)) {
      errors.push(`Строка ${index + 1}: количество и курсы должны быть больше нуля`);
      return;
    }
    let at = rawAt;
    if (!/[zZ]|[+-]\d\d:\d\d$/.test(at) && /^\d{4}-\d{2}-\d{2}T/.test(at)) at = `${at}+05:00`;
    if (Number.isNaN(Date.parse(at))) {
      errors.push(`Строка ${index + 1}: не разобрали дату`);
      return;
    }
    const source = (SOURCES as readonly string[]).includes(rawSource) ? (rawSource as Source) : "Вручную";
    txs.push({
      id: `csv-${index}-${asset}-${at}`,
      at,
      asset,
      side,
      qty,
      priceUsd,
      usdKzt,
      source,
    });
  });
  return { txs, errors };
}

export const DEMO_REPORT_2025 = reportFor(SEED, 2025);
