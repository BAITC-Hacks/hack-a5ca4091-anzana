import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ASSETS, SEED, availableYears, reportFor, type Source, type Tx } from "@/lib/tax/model";

export type Profile = { name: string; iin: string };

type Portfolio = {
  txs: Tx[];
  year: number;
  years: number[];
  profile: Profile;
  dirty: boolean;
  report: ReturnType<typeof reportFor>;
  setYear: (year: number) => void;
  setProfile: (profile: Profile) => void;
  addTx: (tx: Tx) => void;
  removeTx: (id: string) => void;
  importTxs: (txs: Tx[]) => { added: number; skipped: number };
  reset: () => void;
};

const KEY = "gove-crypto-tax-v1";
const Ctx = createContext<Portfolio | null>(null);

function isTx(value: unknown): value is Tx {
  if (!value || typeof value !== "object") return false;
  const tx = value as Tx;
  return (
    typeof tx.id === "string" &&
    typeof tx.at === "string" &&
    (ASSETS as readonly string[]).includes(tx.asset) &&
    (tx.side === "buy" || tx.side === "sell") &&
    typeof tx.qty === "number" &&
    tx.qty > 0 &&
    typeof tx.priceUsd === "number" &&
    typeof tx.usdKzt === "number"
  );
}

const SOURCES: Source[] = ["Binance", "Bybit", "AIFC", "Вручную"];

function normalize(tx: Tx): Tx {
  return {
    ...tx,
    source: SOURCES.includes(tx.source) ? tx.source : "Вручную",
  };
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [txs, setTxs] = useState<Tx[]>(SEED);
  const [year, setYear] = useState(2025);
  const [profile, setProfile] = useState<Profile>({ name: "Наргиза (демо)", iin: "" });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { txs?: unknown; year?: number; profile?: Profile };
        if (Array.isArray(parsed.txs)) {
          const clean = parsed.txs.filter(isTx).map(normalize);
          if (clean.length) setTxs(clean);
        }
        if (typeof parsed.year === "number") setYear(parsed.year);
        if (parsed.profile && typeof parsed.profile.name === "string") {
          setProfile({ name: parsed.profile.name, iin: parsed.profile.iin ?? "" });
        }
      }
    } catch {
      /* демо-портфель остаётся */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify({ txs, year, profile }));
  }, [txs, year, profile, ready]);

  const years = availableYears(txs);
  const safeYear = years.includes(year) ? year : years[0];
  const seedIds = SEED.map((tx) => tx.id).sort().join("|");
  const ownIds = txs.map((tx) => tx.id).sort().join("|");

  const value: Portfolio = {
    txs,
    year: safeYear,
    years,
    profile,
    dirty: seedIds !== ownIds,
    report: reportFor(txs, safeYear),
    setYear,
    setProfile,
    addTx: (tx) => {
      setTxs((prev) => [...prev, tx]);
      setYear(Number(tx.at.slice(0, 4)) || safeYear);
    },
    removeTx: (id) => setTxs((prev) => prev.filter((tx) => tx.id !== id)),
    importTxs: (incoming) => {
      let added = 0;
      let skipped = 0;
      const next = [...txs];
      for (const tx of incoming) {
        const dup = next.some(
          (item) => item.at === tx.at && item.asset === tx.asset && item.side === tx.side && item.qty === tx.qty,
        );
        if (dup) {
          skipped += 1;
          continue;
        }
        next.push({ ...tx, id: `imp-${added}-${tx.at}-${tx.asset}` });
        added += 1;
      }
      setTxs(next);
      return { added, skipped };
    },
    reset: () => {
      setTxs(SEED);
      setYear(2025);
      setProfile({ name: "Наргиза (демо)", iin: "" });
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePortfolio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Портфель не подключён");
  return ctx;
}
