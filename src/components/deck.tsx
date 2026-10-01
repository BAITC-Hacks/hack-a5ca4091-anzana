import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Landmark, LineChart, ScrollText } from "lucide-react";
import { Logo } from "@/components/logo";
import { DEMO_REPORT_2025, formatFx, formatKzt, formatStamp, formatUsd } from "@/lib/tax/model";

const example = DEMO_REPORT_2025.disposals[0];

type Slide = {
  title: string;
  notes: string;
  body: ReactNode;
};

function Hatch() {
  return <div className="hatch pointer-events-none absolute top-3 right-3 z-10 size-12 md:size-16" aria-hidden />;
}

function Banner({ children }: { children: string }) {
  return (
    <div className="max-w-5xl border-2 border-ink bg-violet px-4 py-3 shadow-stamp-ink md:px-6 md:py-4">
      <h2 className="font-display text-2xl leading-none font-bold text-lime uppercase md:text-4xl">{children}</h2>
    </div>
  );
}

function TitleSlide() {
  return (
    <div className="slide-in relative flex min-h-full flex-col items-center justify-center gap-6 px-4 py-10 text-center md:gap-8">
      <Hatch />
      <Logo size="lg" />
      <div className="max-w-3xl border-2 border-ink bg-paper px-4 py-3 text-ink shadow-stamp-ink md:px-6 md:py-4">
        <p className="text-lg leading-snug font-semibold md:text-2xl">
          Модуль автоматического расчета налогов на криптоактивы
        </p>
      </div>
      <p className="font-display text-lg text-lime md:text-2xl">Наргиза / Команда Gove.AI</p>
    </div>
  );
}

function ProblemSlide() {
  const cards = [
    {
      icon: LineChart,
      title: "Хаос в расчетах",
      text: "Курс крипты и USD меняется ежесекундно. Вручную зафиксировать точный курс сделки практически невозможно.",
    },
    {
      icon: ScrollText,
      title: "Сложность",
      text: "Пользователи не знают, как рассчитать прирост стоимости по требованиям налогового законодательства РК.",
    },
    {
      icon: Landmark,
      title: "Теневой рынок",
      text: "Граждане уходят в тень из-за сложности процедур, а государство недополучает налоги.",
    },
  ];
  return (
    <div className="slide-in relative flex min-h-full flex-col gap-5 p-4 md:p-8">
      <Hatch />
      <Banner>Проблема</Banner>
      <div className="grid items-start gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="flex flex-col border-4 border-ink bg-paper p-5 text-ink shadow-stamp-lime">
            <card.icon className="size-8 text-violet" strokeWidth={2.25} />
            <h3 className="mt-4 font-display text-lg leading-tight font-bold uppercase">{card.title}</h3>
            <p className="mt-3 text-sm leading-relaxed md:text-base">{card.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function SolutionSlide() {
  const points = [
    {
      lead: "Авто-фиксация:",
      text: "Подтягиваем курс USD/KZT и криптоактива на точную секунду сделки.",
    },
    {
      lead: "Математическая точность:",
      text: "Расчет налогооблагаемой базы согласно закону.",
    },
    {
      lead: "Декларация в 1 клик:",
      text: "Генерация готовой формы для налоговых органов.",
    },
  ];
  return (
    <div className="slide-in relative flex min-h-full flex-col gap-5 p-4 md:p-8">
      <Hatch />
      <Banner>Решение: Gove.AI Crypto Tax</Banner>
      <div className="grid flex-1 items-center gap-6 lg:grid-cols-2">
        <ul className="flex flex-col gap-5">
          {points.map((point) => (
            <li key={point.lead} className="flex gap-3 text-base leading-relaxed md:text-lg">
              <ArrowRight className="mt-1 size-5 shrink-0 text-lime" />
              <p>
                <span className="font-bold text-lime">{point.lead}</span> {point.text}
              </p>
            </li>
          ))}
        </ul>
        <FixationCard />
      </div>
    </div>
  );
}

function FixationCard() {
  return (
    <div className="border-2 border-lime bg-panel p-4 shadow-stamp-violet md:p-5">
      <p className="font-display text-xs text-lime uppercase">Фиксация на секунду сделки</p>
      <p className="mt-3 font-display text-xl text-fg">{example ? formatStamp(example.tx.at) : ""}</p>
      <p className="mt-1 text-sm text-muted">Алматы · продажа BTC · демо-портфель</p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="border border-line p-3">
          <dt className="text-xs text-muted">Цена актива</dt>
          <dd className="mt-1 font-display text-lg tabular-nums">{example ? formatUsd(example.tx.priceUsd) : ""}</dd>
        </div>
        <div className="border border-line p-3">
          <dt className="text-xs text-muted">USD/KZT · НБ РК</dt>
          <dd className="mt-1 font-display text-lg tabular-nums">{example ? formatFx(example.tx.usdKzt) : ""}</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
        <div>
          <p className="text-xs text-muted">ИПН 10% за 2025</p>
          <p className="font-display text-2xl text-lime tabular-nums md:text-3xl">{formatKzt(DEMO_REPORT_2025.tax)}</p>
        </div>
        <p className="max-w-40 text-right text-xs text-muted">База {formatKzt(DEMO_REPORT_2025.taxable)} · FIFO</p>
      </div>
    </div>
  );
}

function DoneSlide() {
  const items = [
    "Разработана архитектура модуля и математическая модель фиксации курсов.",
    "Подготовлен MVP-репозиторий проекта на GitHub.",
    "Настроена интеграция с тестовыми API бирж и данными Нацбанка.",
  ];
  return (
    <div className="slide-in relative flex min-h-full flex-col gap-6 p-4 md:p-8">
      <Hatch />
      <Banner>Что уже сделано</Banner>
      <ul className="flex flex-1 flex-col justify-center gap-4">
        {items.map((item) => (
          <li key={item} className="flex gap-3 border border-line bg-ink-2 px-4 py-4 text-base leading-relaxed md:text-xl">
            <ArrowRight className="mt-1 size-5 shrink-0 text-lime" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DemoSlide() {
  const steps = [
    "Загрузка транзакций (CSV/API)",
    "Привязка курсов на дату операции",
    "Мгновенный расчет налога",
    "Экспорт готового отчета",
  ];
  return (
    <div className="slide-in relative flex min-h-full flex-col gap-5 p-4 md:p-8">
      <Hatch />
      <Banner>Демонстрация MVP</Banner>
      <div className="grid flex-1 items-center gap-6 lg:grid-cols-2">
        <div>
          <p className="font-display text-lg text-lime md:text-xl">Алгоритм работы:</p>
          <ol className="mt-4 flex flex-col gap-3">
            {steps.map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-base md:text-lg">
                <span className="grid size-9 shrink-0 place-items-center bg-lime font-display text-sm font-bold text-ink">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-4 border-2 border-lime bg-ink-2 p-5">
          <p className="text-sm text-muted">На демо-портфеле налог уже посчитан. Откройте модуль и пройдите те же четыре шага вживую.</p>
          <p className="font-display text-3xl text-lime tabular-nums md:text-4xl">{formatKzt(DEMO_REPORT_2025.tax)}</p>
          <p className="text-sm text-muted">ИПН за 2025 · {DEMO_REPORT_2025.disposals.length} закрытых сделок</p>
          <Link
            to="/demo"
            search={{ tab: "overview" }}
            className="inline-flex min-h-12 items-center justify-center bg-lime px-4 text-center font-display text-base font-bold text-ink shadow-stamp-violet"
          >
            Открыть живое демо
          </Link>
        </div>
      </div>
    </div>
  );
}

function RoadmapSlide() {
  const steps = [
    { title: "Интеграция", text: "Запуск работы с биржами МФЦА (AIFC)." },
    { title: "Песочница", text: "Пилотное тестирование в регуляторной песочнице." },
    { title: "Автоматизация", text: "Прямая отправка деклараций через eGov." },
  ];
  return (
    <div className="slide-in relative flex min-h-full flex-col gap-6 p-4 md:p-8">
      <Hatch />
      <Banner>Планы на будущее</Banner>
      <div className="relative grid flex-1 content-center gap-4 md:grid-cols-3">
        <div className="absolute top-3 right-[16%] left-[16%] hidden h-1 bg-lime md:block" aria-hidden />
        {steps.map((step) => (
          <article key={step.title} className="relative border-2 border-paper bg-violet p-5 text-paper">
            <span className="absolute -top-3 left-6 size-6 border-4 border-ink bg-lime" aria-hidden />
            <h3 className="mt-3 font-display text-xl font-bold">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed md:text-base">{step.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function AskSlide() {
  const items = [
    {
      title: "API и данные",
      text: "Доступ к тестовым API Комитета госдоходов (КГД) и Нацбанка РК.",
    },
    {
      title: "Экспертиза",
      text: "Методологическая поддержка налоговых экспертов по криптодоходам.",
    },
    {
      title: "Регуляторика",
      text: "Поддержка для входа в регуляторную песочницу Минфина / МФЦА.",
    },
  ];
  return (
    <div className="slide-in relative flex min-h-full flex-col gap-4 p-4 md:gap-5 md:p-8">
      <Hatch />
      <Banner>Запрос к партнерам</Banner>
      <div className="flex flex-1 flex-col justify-center gap-3">
        {items.map((item) => (
          <article key={item.title} className="border-2 border-lime bg-ink-2 px-4 py-4 md:px-5">
            <h3 className="font-display text-lg text-lime uppercase md:text-xl">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg md:text-base">{item.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function CloseSlide() {
  return (
    <div className="slide-in relative flex min-h-full flex-col items-center justify-center gap-5 px-4 py-10 text-center">
      <Hatch />
      <p className="font-display text-sm text-lime uppercase">Gove.AI Crypto Tax</p>
      <h2 className="font-display text-4xl font-bold uppercase md:text-6xl">Спасибо</h2>
      <p className="max-w-xl text-base text-muted md:text-lg">
        Модуль можно открыть прямо сейчас и показать расчёт, фиксацию курса и форму декларации.
      </p>
      <p className="font-display text-3xl text-lime tabular-nums">{formatKzt(DEMO_REPORT_2025.tax)}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/demo"
          search={{ tab: "overview" }}
          className="inline-flex min-h-12 items-center justify-center bg-lime px-5 font-display text-sm font-bold text-ink shadow-stamp-violet"
        >
          Открыть модуль
        </Link>
      </div>
    </div>
  );
}

const SLIDES: Slide[] = [
  {
    title: "Титул",
    notes:
      "Здравствуйте. Меня зовут Наргиза, команда Gove.AI. Мы сделали платформу, которая отдаёт Комитету государственных доходов точные и актуальные данные по налогу на криптоактивы.",
    body: <TitleSlide />,
  },
  {
    title: "Проблема",
    notes:
      "Курс крипты и курс доллара к тенге меняются каждую секунду. Вручную точную цифру сделки не поймать. Человек ошибается в декларации или уходит в тень. КГД получает неточные данные, бюджет недобирает налог.",
    body: <ProblemSlide />,
  },
  {
    title: "Решение",
    notes:
      "Платформа фиксирует на секунду сделки цену актива и курс доллара к тенге. Покажите карточку справа. На демо-портфеле за 2025 год ИПН — триста девяносто три тысячи восемьсот шестьдесят восемь тенге. Это не оценка, цифру можно проверить по каждой сделке.",
    body: <SolutionSlide />,
  },
  {
    title: "Сделано",
    notes:
      "Коротко, без паузы: архитектура готова, модуль уже считает, тестовые курсы бирж и Нацбанка подключены. Сразу переходите в демо.",
    body: <DoneSlide />,
  },
  {
    title: "Демо",
    notes:
      "Откройте демо. Сделки: время до секунды и два курса. Нажмите «Подтянуть курсы» — подставятся актуальные данные. База пересчитается сразу. Декларация — в один клик, её можно скачать.",
    body: <DemoSlide />,
  },
  {
    title: "Планы",
    notes:
      "Если данные точные и свежие, плательщик не боится декларации, а КГД видит реальную базу, не догадку. Дальше — биржи МФЦА, пилот в песочнице и передача отчёта через eGov.",
    body: <RoadmapSlide />,
  },
  {
    title: "Запрос",
    notes:
      "Чтобы довести это до пилота, просим тестовый доступ к данным КГД и Нацбанка, методику по криптодоходам и вход в регуляторную песочницу. Тогда цифры не придётся переносить руками.",
    body: <AskSlide />,
  },
  {
    title: "Финал",
    notes: "Спасибо. Если данные точные, КГД получает актуальную базу, а не теневой оборот. Готовы показать расчёт.",
    body: <CloseSlide />,
  },
];

export function Deck() {
  const [index, setIndex] = useState(0);
  const [notes, setNotes] = useState(false);
  const last = SLIDES.length - 1;
  const slide = SLIDES[index];

  useEffect(() => {
    const hash = Number(window.location.hash.replace("#", ""));
    if (hash >= 1 && hash <= SLIDES.length) setIndex(hash - 1);
  }, []);

  useEffect(() => {
    const next = `#${index + 1}`;
    if (window.location.hash !== next) window.history.replaceState(null, "", next);
  }, [index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        setIndex((n) => Math.min(last, n + 1));
      } else if (event.key === "ArrowLeft" || event.key === "PageUp" || event.key === "Backspace") {
        event.preventDefault();
        setIndex((n) => Math.max(0, n - 1));
      } else if (event.key === "Home") setIndex(0);
      else if (event.key === "End") setIndex(last);
      else if (event.key === "n" || event.key === "N" || event.key === "т" || event.key === "Т") setNotes((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last]);

  const go = (dir: number) => setIndex((n) => Math.min(last, Math.max(0, n + dir)));

  return (
    <div className="flex h-dvh flex-col bg-ink text-fg">
      <div className="m-2 mb-16 flex min-h-0 flex-1 flex-col border-4 border-lime md:m-3 md:mb-16">
        <div className="h-1 bg-line" aria-hidden>
          <div className="h-full bg-lime" style={{ width: `${((index + 1) / SLIDES.length) * 100}%` }} />
        </div>
        <div
          className="relative min-h-0 flex-1 overflow-y-auto"
          onPointerUp={(event) => {
            const startX = Number((event.currentTarget as HTMLElement).dataset.x || "");
            const startY = Number((event.currentTarget as HTMLElement).dataset.y || "");
            if (!startX && !startY) return;
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx < 0 ? 1 : -1);
            delete event.currentTarget.dataset.x;
            delete event.currentTarget.dataset.y;
          }}
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("a, button")) return;
            event.currentTarget.dataset.x = String(event.clientX);
            event.currentTarget.dataset.y = String(event.clientY);
          }}
        >
          <div className="min-h-full" role="region" aria-roledescription="слайд" aria-label={`${index + 1} из ${SLIDES.length}: ${slide.title}`}>
            {slide.body}
          </div>
        </div>
        {notes ? (
          <div className="border-t border-line bg-ink-2 px-4 py-3">
            <p className="font-display text-xs text-lime uppercase">Заметка спикера · {slide.title}</p>
            <p className="mt-1 max-w-4xl text-sm leading-relaxed">{slide.notes}</p>
          </div>
        ) : null}
        <footer className="flex items-center gap-2 border-t-4 border-lime px-2 py-2 md:px-3">
          <button
            type="button"
            aria-label="Предыдущий слайд"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="grid size-11 place-items-center border-2 border-lime text-lime disabled:opacity-30"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex flex-1 items-center justify-center gap-1.5">
            {SLIDES.map((item, n) => (
              <button
                key={item.title}
                type="button"
                aria-label={`Слайд ${n + 1}: ${item.title}`}
                aria-current={n === index}
                onClick={() => setIndex(n)}
                className={n === index ? "h-2.5 w-6 bg-lime" : "size-2.5 bg-line"}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setNotes((v) => !v)}
            aria-pressed={notes}
            className="hidden min-h-11 border-2 border-line px-3 text-sm text-muted sm:inline-flex sm:items-center"
          >
            Заметки
          </button>
          <Link
            to="/demo"
            search={{ tab: "overview" }}
            className="inline-flex min-h-11 items-center border-2 border-lime px-3 text-sm font-semibold text-lime"
          >
            Демо
          </Link>
          <button
            type="button"
            aria-label="Следующий слайд"
            onClick={() => go(1)}
            disabled={index === last}
            className="grid size-11 place-items-center bg-lime text-ink disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </footer>
      </div>
    </div>
  );
}
