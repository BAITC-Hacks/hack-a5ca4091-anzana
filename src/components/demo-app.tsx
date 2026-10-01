import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowLeftRight,
  Download,
  FileText,
  LayoutDashboard,
  Scale,
  Trash2,
  Upload,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { usePortfolio } from "@/components/portfolio";
import {
  ASSETS,
  formatDay,
  formatFx,
  formatKzt,
  formatKztExact,
  formatQty,
  formatStamp,
  formatUsd,
  inYear,
  parseCsv,
  quoteAt,
  sideLabel,
  toCsv,
  type Asset,
  type Side,
  type Tx,
} from "@/lib/tax/model";

export type Tab = "overview" | "trades" | "basis" | "decl";

const TABS: { id: Tab; label: string; icon: typeof Scale }[] = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  { id: "trades", label: "Сделки", icon: ArrowLeftRight },
  { id: "basis", label: "База", icon: Scale },
  { id: "decl", label: "Декларация", icon: FileText },
];

function download(name: string, text: string) {
  const blob = new Blob([`\uFEFF${text}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function tone(n: number) {
  if (n > 0.5) return "text-lime";
  if (n < -0.5) return "text-loss";
  return "text-muted";
}

export function DemoApp({ tab, onTab }: { tab: Tab; onTab: (tab: Tab) => void }) {
  return (
    <div className="min-h-dvh bg-ink text-fg">
      <header className="sticky top-0 z-20 border-b-4 border-lime bg-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-3 py-3">
          <Link to="/" className="flex items-center gap-3" aria-label="К презентации">
            <Logo size="sm" />
            <span className="leading-tight">
              <span className="block font-display text-sm text-lime">CRYPTO TAX</span>
              <span className="block text-xs text-muted">модуль для РК</span>
            </span>
          </Link>
          <YearSwitch />
        </div>
        <p className="mx-auto max-w-6xl px-3 pb-3 text-xs leading-relaxed text-muted">
          Тестовый контур: курс USD/KZT и цена актива фиксируются на секунду сделки. Модель FIFO, ИПН 10%.
          Это демонстрация, не консультация и не отправка в КГД.
        </p>
      </header>
      <div className="mx-auto grid max-w-6xl md:grid-cols-[220px_1fr]">
        <nav className="hidden gap-1 border-r border-line p-3 md:flex md:flex-col" aria-label="Разделы модуля">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTab(item.id)}
              aria-current={tab === item.id}
              className={`flex min-h-11 items-center gap-2 px-3 text-left text-sm font-semibold ${
                tab === item.id ? "bg-lime text-ink" : "text-fg hover:bg-ink-2"
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </button>
          ))}
          <Link to="/" className="mt-4 flex min-h-11 items-center px-3 text-sm text-lime">
            К слайдам
          </Link>
        </nav>
        <main className="px-3 py-4 pb-28 md:px-6 md:pb-10">
          {tab === "overview" ? <Overview onTab={onTab} /> : null}
          {tab === "trades" ? <Trades /> : null}
          {tab === "basis" ? <Basis /> : null}
          {tab === "decl" ? <Declaration /> : null}
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t-4 border-lime bg-ink md:hidden" aria-label="Разделы модуля">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTab(item.id)}
            aria-current={tab === item.id}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
              tab === item.id ? "text-lime" : "text-muted"
            }`}
          >
            <item.icon className="size-5" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function YearSwitch() {
  const { year, years, setYear, dirty } = usePortfolio();
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">{dirty ? "свой реестр" : "демо"}</span>
      <div className="flex border-2 border-lime" role="group" aria-label="Налоговый период">
        {years.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setYear(item)}
            aria-pressed={item === year}
            className={`min-h-11 min-w-16 px-3 font-display text-sm ${item === year ? "bg-lime text-ink" : "text-lime"}`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function Overview({ onTab }: { onTab: (tab: Tab) => void }) {
  const { year, report, dirty } = usePortfolio();
  const market = report.holdings.reduce((sum, row) => sum + row.marketKzt, 0);
  const unreal = report.holdings.reduce((sum, row) => sum + row.unrealized, 0);
  const steps: { n: string; label: string; tab: Tab }[] = [
    { n: "1", label: "Сделки загружены", tab: "trades" },
    { n: "2", label: "Курсы на секунду", tab: "trades" },
    { n: "3", label: "База по FIFO", tab: "basis" },
    { n: "4", label: "Форма готова", tab: "decl" },
  ];
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl md:text-3xl">Период {year}</h1>
        <p className="mt-1 text-sm text-muted">
          {dirty ? "Реестр изменён" : "Демо-портфель"} · срез рынка 30 сен 2026, 16:33 · USD/KZT {formatFx(report.spotFx)}
        </p>
      </div>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <li key={step.label}>
            <button
              type="button"
              onClick={() => onTab(step.tab)}
              className="flex min-h-12 w-full items-center gap-2 border border-line px-3 text-left text-sm hover:border-lime"
            >
              <span className="grid size-7 shrink-0 place-items-center bg-lime font-display text-sm text-ink">{step.n}</span>
              {step.label}
            </button>
          </li>
        ))}
      </ol>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Реализованный доход" value={formatKzt(report.proceeds)} hint="Выручка от продаж в тенге" />
        <Stat label="Расходы FIFO" value={formatKzt(report.cost)} hint="Себестоимость закрытых лотов" />
        <Stat label="Налогооблагаемая база" value={formatKzt(report.taxable)} hint="Прирост минус убыток внутри года" />
        <Stat label="ИПН 10%" value={formatKzt(report.tax)} hint="К уплате за период" accent />
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <section className="border border-line bg-panel p-4">
          <h2 className="font-display text-sm text-lime uppercase">Прирост по месяцам</h2>
          <MonthChart />
        </section>
        <section className="border border-line bg-panel p-4">
          <h2 className="font-display text-sm text-lime uppercase">Позиция сейчас</h2>
          <p className={`mt-3 font-display text-3xl tabular-nums ${tone(unreal)}`}>{formatKzt(unreal)}</p>
          <p className="mt-1 text-sm text-muted">Нереализованный результат · в налог не входит</p>
          <p className="mt-4 text-sm">Рыночная стоимость {formatKzt(market)}</p>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            У USDT цена в долларах не меняется, но тенговая оценка зависит от курса НБ РК. Пока актив не продан, эта разница не облагается.
          </p>
        </section>
      </div>
      <Holdings />
    </div>
  );
}

function Stat({ label, value, hint, accent = false }: { label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <article className={`border-2 p-4 ${accent ? "border-lime bg-ink-2" : "border-line bg-ink-2"}`}>
      <h2 className="text-xs text-muted uppercase">{label}</h2>
      <p className={`mt-2 font-display text-2xl tabular-nums md:text-3xl ${accent ? "text-lime" : "text-fg"}`}>{value}</p>
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </article>
  );
}

function MonthChart() {
  const { report } = usePortfolio();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!report.months.length) {
    return <p className="mt-6 text-sm text-muted">В этом периоде нет продаж. Налог появляется только при реализации.</p>;
  }
  if (!ready) return <div className="mt-4 h-52 border border-line" />;
  return (
    <div className="mt-4 h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={report.months} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "color-mix(in srgb, var(--color-lime) 12%, transparent)" }}
            contentStyle={{
              background: "var(--color-panel)",
              border: "1px solid var(--color-lime)",
              borderRadius: 0,
              color: "var(--color-fg)",
            }}
            formatter={(value) => [formatKzt(Number(value ?? 0)), "Прирост"]}
          />
          <Bar dataKey="gain" maxBarSize={36}>
            {report.months.map((month) => (
              <Cell key={month.key} fill={month.gain >= 0 ? "var(--color-lime)" : "var(--color-loss)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Holdings() {
  const { report } = usePortfolio();
  if (!report.holdings.length) return null;
  return (
    <section>
      <h2 className="font-display text-sm text-lime uppercase">Остатки лотов</h2>
      <div className="mt-3 grid gap-2">
        {report.holdings.map((row) => (
          <article key={row.asset} className="grid gap-2 border border-line px-3 py-3 sm:grid-cols-5 sm:items-center">
            <p className="font-display text-lg">{row.asset}</p>
            <p className="text-sm tabular-nums">
              <span className="block text-xs text-muted">Количество</span>
              {formatQty(row.qty)}
            </p>
            <p className="text-sm tabular-nums">
              <span className="block text-xs text-muted">Средняя цена</span>
              {formatKzt(row.avgCostKzt)}
            </p>
            <p className="text-sm tabular-nums">
              <span className="block text-xs text-muted">Рынок</span>
              {formatUsd(row.markUsd)}
            </p>
            <p className={`text-sm tabular-nums sm:text-right ${tone(row.unrealized)}`}>
              <span className="block text-xs text-muted sm:text-right">Нереализ.</span>
              {formatKzt(row.unrealized)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

const control = "scheme-dark min-h-11 w-full border-2 border-line bg-ink px-3 text-base text-fg";

function Trades() {
  const { txs, year, report, addTx, removeTx, importTxs, reset } = usePortfolio();
  const fileRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState("2026-09-28");
  const [time, setTime] = useState("11:04:17");
  const [asset, setAsset] = useState<Asset>("BTC");
  const [side, setSide] = useState<Side>("sell");
  const [qty, setQty] = useState("0.02");
  const [quote, setQuote] = useState<{ priceUsd: number; usdKzt: number } | null>(null);
  const [pulling, setPulling] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [armReset, setArmReset] = useState(false);
  const [onlyYear, setOnlyYear] = useState(false);

  useEffect(() => {
    setQuote(null);
  }, [date, time, asset]);

  const ordered = [...txs].sort((a, b) => b.at.localeCompare(a.at));
  const visible = onlyYear ? ordered.filter((tx) => inYear(tx.at, year)) : ordered;
  const held = report.holdings.find((row) => row.asset === asset)?.qty ?? 0;

  async function pull() {
    setError("");
    setMessage("");
    const iso = composeIso(date, time);
    if (Number.isNaN(Date.parse(iso))) {
      setError("Проверьте дату и время. Секунды в формате ЧЧ:ММ:СС.");
      return;
    }
    setPulling(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    setQuote(quoteAt(iso, asset));
    setPulling(false);
  }

  function commit() {
    if (!quote) return;
    const amount = Number(qty.replace(",", "."));
    if (!(amount > 0)) {
      setError("Укажите количество больше нуля.");
      return;
    }
    const iso = composeIso(date, time);
    const tx: Tx = {
      id: `live-${Date.now().toString(36)}`,
      at: iso,
      asset,
      side,
      qty: amount,
      priceUsd: quote.priceUsd,
      usdKzt: quote.usdKzt,
      source: "Вручную",
    };
    addTx(tx);
    setQuote(null);
    setError("");
    setMessage(`Сделка записана. Курсы зафиксированы на ${formatStamp(iso)}. Период переключён на ${iso.slice(0, 4)}.`);
  }

  const sellTooMuch = side === "sell" && Number(qty.replace(",", ".")) > held + 1e-8;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl md:text-3xl">Сделки</h1>
        <p className="mt-1 text-sm text-muted">Каждая строка хранит секунду операции, цену актива и курс USD/KZT.</p>
      </div>
      <form
        className="grid gap-3 border-2 border-lime bg-ink-2 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (quote) commit();
          else void pull();
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-sm text-lime uppercase">Новая сделка</h2>
          <p className="text-xs text-muted">Поля уже заполнены для показа</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Дата</span>
            <input className={control} type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Время до секунды, Алматы</span>
            <input className={control} type="time" step={1} value={time} onChange={(event) => setTime(event.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Актив</span>
            <select className={control} value={asset} onChange={(event) => setAsset(event.target.value as Asset)}>
              {ASSETS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Сторона</span>
            <select className={control} value={side} onChange={(event) => setSide(event.target.value as Side)}>
              <option value="buy">Покупка</option>
              <option value="sell">Продажа</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Количество</span>
            <input className={control} inputMode="decimal" value={qty} onChange={(event) => setQty(event.target.value)} />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void pull()}
              disabled={pulling}
              className="min-h-11 w-full bg-lime px-3 font-semibold text-ink disabled:opacity-60"
            >
              {pulling ? "Фиксируем…" : "Подтянуть курсы"}
            </button>
          </div>
        </div>
        {sellTooMuch ? (
          <p className="text-sm text-loss">На остатке только {formatQty(held)} {asset}. Непокрытая часть не попадёт в базу.</p>
        ) : null}
        {quote ? (
          <div className="grid gap-3 border border-line p-3 sm:grid-cols-3">
            <p className="text-sm">
              <span className="block text-xs text-muted">Цена актива</span>
              <span className="font-display text-lg tabular-nums">{formatUsd(quote.priceUsd)}</span>
            </p>
            <p className="text-sm">
              <span className="block text-xs text-muted">USD/KZT · НБ РК</span>
              <span className="font-display text-lg tabular-nums">{formatFx(quote.usdKzt)}</span>
            </p>
            <p className="text-sm">
              <span className="block text-xs text-muted">Тенге за единицу</span>
              <span className="font-display text-lg tabular-nums">{formatKzt(quote.priceUsd * quote.usdKzt)}</span>
            </p>
            <button type="button" onClick={commit} className="min-h-11 bg-violet px-3 font-semibold text-paper sm:col-span-3">
              Записать сделку и пересчитать налог
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted">Курсы подтянутся из тестового фида Нацбанка и биржи на выбранную секунду.</p>
        )}
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        {message ? <p className="text-sm text-lime">{message}</p> : null}
      </form>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 border-2 border-lime px-3 text-sm font-semibold text-lime"
        >
          <Upload className="size-4" />
          Импорт CSV
        </button>
        <button
          type="button"
          onClick={() => download(`gove-reestr-${year}.csv`, toCsv(txs))}
          className="inline-flex min-h-11 items-center gap-2 border-2 border-line px-3 text-sm text-fg"
        >
          <Download className="size-4" />
          Скачать реестр
        </button>
        <button
          type="button"
          onClick={() => setOnlyYear((value) => !value)}
          className="min-h-11 border-2 border-line px-3 text-sm"
          aria-pressed={onlyYear}
        >
          {onlyYear ? `Только ${year}` : "Вся история"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!armReset) {
              setArmReset(true);
              return;
            }
            reset();
            setArmReset(false);
            setMessage("Демо-портфель восстановлен.");
          }}
          className="min-h-11 border-2 border-line px-3 text-sm text-muted"
        >
          {armReset ? "Точно сбросить" : "Сбросить демо"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const parsed = parseCsv(await file.text());
            const result = importTxs(parsed.txs);
            setError(parsed.errors.slice(0, 3).join(" "));
            setMessage(`Добавлено ${result.added}, пропущено дублей ${result.skipped}.`);
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        {visible.map((tx) => {
          const outside = !inYear(tx.at, year);
          return (
            <article key={tx.id} className={`border border-line px-3 py-3 ${outside ? "opacity-55" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg">
                    {tx.asset} · {sideLabel(tx.side)}
                    {outside ? <span className="ml-2 text-xs text-muted">вне {year}</span> : null}
                  </p>
                  <p className="mt-1 text-sm tabular-nums text-muted">{formatStamp(tx.at)}</p>
                </div>
                <button type="button" onClick={() => removeTx(tx.id)} aria-label="Удалить сделку" className="grid size-11 place-items-center text-muted hover:text-loss">
                  <Trash2 className="size-4" />
                </button>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted">Количество</dt>
                  <dd className="tabular-nums">{formatQty(tx.qty)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Цена</dt>
                  <dd className="tabular-nums">{formatUsd(tx.priceUsd)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">USD/KZT</dt>
                  <dd className="tabular-nums">{formatFx(tx.usdKzt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Сумма</dt>
                  <dd className="tabular-nums">{formatKzt(tx.qty * tx.priceUsd * tx.usdKzt)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-muted">{tx.source}</p>
            </article>
          );
        })}
        {!visible.length ? <p className="text-sm text-muted">В выбранном периоде сделок нет.</p> : null}
      </div>
    </div>
  );
}

function composeIso(date: string, time: string) {
  const clock = time.length === 5 ? `${time}:00` : time;
  return `${date}T${clock}+05:00`;
}

function Basis() {
  const { year, report } = usePortfolio();
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl md:text-3xl">База {year}</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
          Прирост = цена продажи в тенге минус себестоимость лотов FIFO. Тенге считаются как цена в USD,
          умноженная на курс USD/KZT на секунду именно этой операции. Убыток одной сделки уменьшает базу внутри года.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Прирост" value={formatKzt(report.gains)} hint="Положительные закрытия" />
        <Stat label="Убыток" value={formatKzt(report.losses)} hint="Отрицательные закрытия" />
        <Stat label="ИПН 10%" value={formatKzt(report.tax)} hint={`База ${formatKzt(report.taxable)}`} accent />
      </div>
      <div className="flex flex-col gap-2">
        {report.disposals.map((row) => (
          <article key={row.tx.id} className="border border-line p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg">
                {row.tx.asset} · {formatQty(row.sold)}
              </h2>
              <p className={`font-display text-lg tabular-nums ${tone(row.gain)}`}>{formatKzt(row.gain)}</p>
            </div>
            <p className="mt-1 text-sm text-muted">{formatStamp(row.tx.at)}</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted">Выручка</dt>
                <dd className="tabular-nums">{formatKztExact(row.proceeds)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Себестоимость FIFO</dt>
                <dd className="tabular-nums">{formatKztExact(row.cost)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Курс продажи</dt>
                <dd className="tabular-nums">
                  {formatUsd(row.tx.priceUsd)} × {formatFx(row.tx.usdKzt)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Лоты:{" "}
              {row.lots.map((lot) => `${formatQty(lot.qty)} от ${formatDay(lot.at)}`).join("; ") || "нет покрытия"}
              {row.shortfall > 0 ? ` · не хватило ${formatQty(row.shortfall)}` : ""}
            </p>
          </article>
        ))}
        {!report.disposals.length ? (
          <p className="border border-line p-4 text-sm text-muted">В {year} году продаж нет, налогооблагаемая база нулевая.</p>
        ) : null}
      </div>
    </div>
  );
}

function Declaration() {
  const { year, report, profile, setProfile, txs } = usePortfolio();
  const lines = [
    ["Реализованный доход", formatKztExact(report.proceeds)],
    ["Расходы на приобретение (FIFO)", formatKztExact(report.cost)],
    ["Прирост", formatKztExact(report.gains)],
    ["Убыток периода", formatKztExact(report.losses)],
    ["Налогооблагаемая база", formatKztExact(report.taxable)],
    ["Ставка ИПН", "10%"],
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Декларация</h1>
          <p className="mt-1 text-sm text-muted">Форма для показа. В eGov пока не отправляется.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const body = [
                "asset,datetime,qty,proceeds_kzt,cost_kzt,gain_kzt,price_usd,usd_kzt",
                ...report.disposals.map((row) =>
                  [
                    row.tx.asset,
                    row.tx.at,
                    row.sold,
                    row.proceeds,
                    row.cost,
                    row.gain,
                    row.tx.priceUsd,
                    row.tx.usdKzt,
                  ].join(","),
                ),
                `TAX,${year},,,,${report.tax},,`,
              ].join("\n");
              download(`gove-deklaraciya-${year}.csv`, body);
            }}
            className="inline-flex min-h-11 items-center gap-2 border-2 border-lime px-3 text-sm font-semibold text-lime"
          >
            <Download className="size-4" />
            Скачать расчёт
          </button>
          <button
            type="button"
            onClick={() => download(`gove-reestr-${year}.csv`, toCsv(txs.filter((tx) => inYear(tx.at, year))))}
            className="inline-flex min-h-11 items-center gap-2 border-2 border-line px-3 text-sm"
          >
            Реестр периода
          </button>
          <button
            type="button"
            onClick={() => {
              document.body.classList.add("print-decl");
              const cleanup = () => {
                document.body.classList.remove("print-decl");
                window.removeEventListener("afterprint", cleanup);
              };
              window.addEventListener("afterprint", cleanup);
              window.print();
            }}
            className="min-h-11 bg-lime px-4 text-sm font-semibold text-ink"
          >
            Печать
          </button>
        </div>
      </div>
      <div className="bg-ink-2 p-2 md:p-4">
        <article id="decl-sheet" className="mx-auto max-w-3xl bg-paper p-5 text-ink shadow-stamp-lime md:p-8">
          <p className="font-display text-xs uppercase">Gove.AI · приложение к декларации</p>
          <h2 className="mt-2 font-display text-2xl leading-tight">
            Имущественный доход по цифровым активам за {year} год
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="block text-xs text-ink/70">Налогоплательщик</span>
              <input
                className="mt-1 w-full border-b border-ink bg-transparent py-1 text-base text-ink outline-none"
                value={profile.name}
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="block text-xs text-ink/70">ИИН</span>
              <input
                className="mt-1 w-full border-b border-ink bg-transparent py-1 text-base text-ink tabular-nums outline-none"
                inputMode="numeric"
                maxLength={12}
                placeholder="000000000000"
                value={profile.iin}
                onChange={(event) => setProfile({ ...profile, iin: event.target.value.replace(/\D/g, "").slice(0, 12) })}
              />
            </label>
          </div>
          <dl className="mt-6 border-t-2 border-ink">
            {lines.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 border-b border-ink/20 py-2 text-sm">
                <dt>{label}</dt>
                <dd className="font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="font-display text-lg">Сумма ИПН</dt>
              <dd className="font-display text-2xl tabular-nums">{formatKzt(report.tax)}</dd>
            </div>
          </dl>
          <h3 className="mt-6 font-display text-sm uppercase">Реестр реализаций</h3>
          <div className="mt-2 flex flex-col">
            {report.disposals.map((row) => (
              <p key={row.tx.id} className="border-t border-ink/15 py-2 text-sm leading-relaxed">
                <span className="font-semibold">
                  {formatStamp(row.tx.at)} · {row.tx.asset} · {formatQty(row.sold)}
                </span>
                <br />
                {formatUsd(row.tx.priceUsd)} × {formatFx(row.tx.usdKzt)} · прирост {formatKztExact(row.gain)}
              </p>
            ))}
            {!report.disposals.length ? <p className="py-3 text-sm">Реализаций за период нет.</p> : null}
          </div>
          <p className="mt-6 text-xs leading-relaxed text-ink/70">
            Метод учёта — FIFO. Иностранная валюта пересчитана по курсу тенге, зафиксированному на секунду сделки.
            Нереализованный результат в базу не включён. Документ сформирован модулем Gove.AI для демонстрации и не
            заменяет форму, утверждённую Комитетом государственных доходов.
          </p>
          <div className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
            <p>Подпись налогоплательщика ____________</p>
            <p>Дата ____________</p>
          </div>
        </article>
      </div>
    </div>
  );
}
