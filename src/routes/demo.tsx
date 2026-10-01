import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DemoApp, type Tab } from "@/components/demo-app";
import { PortfolioProvider } from "@/components/portfolio";

const TABS: Tab[] = ["overview", "trades", "basis", "decl"];

export const Route = createFileRoute("/demo")({
  validateSearch: (search: Record<string, unknown>): { tab: Tab } => {
    const tab = search.tab;
    if (typeof tab === "string" && TABS.includes(tab as Tab)) return { tab: tab as Tab };
    return { tab: "overview" };
  },
  component: DemoPage,
});

function DemoPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: "/demo" });
  return (
    <PortfolioProvider>
      <DemoApp
        tab={tab}
        onTab={(next) => {
          void navigate({ search: { tab: next }, replace: true });
        }}
      />
    </PortfolioProvider>
  );
}
