import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardHeader } from "@/components/project-status/DashboardHeader";
import {
  TimelinePanel,
  BrdPanel,
  SrsPanel,
  UiPanel,
  ApiPanel,
  DbPanel,
  BrPanel,
} from "@/components/project-status/TabPanels";

export const Route = createFileRoute("/_public/project-status")({
  head: () => ({
    meta: [
      { title: "Theo dõi tiến độ dự án — VitaTH Pro" },
      {
        name: "description",
        content:
          "Dashboard tổng hợp BRD, SRS, UI/UX, API, Database và Business Rules cho dự án VitaTH Pro — cập nhật tiến độ 72% hướng đến go-live 20/09/2026.",
      },
      { property: "og:title", content: "Theo dõi tiến độ dự án — VitaTH Pro" },
      {
        property: "og:description",
        content: "Dashboard tài liệu 6 tab: BRD · SRS · UI/UX · API · Database · Business Rules.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectStatusPage,
});

type TabKey = "timeline" | "brd" | "srs" | "ui" | "api" | "db" | "br";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "timeline", label: "Timeline" },
  { key: "brd", label: "BRD" },
  { key: "srs", label: "SRS" },
  { key: "ui", label: "UI/UX" },
  { key: "api", label: "API" },
  { key: "db", label: "Database" },
  { key: "br", label: "Business Rules" },
];

function ProjectStatusPage() {
  const [tab, setTab] = useState<TabKey>("timeline");

  return (
    <main className="min-h-dvh bg-[#FAFAFA] pb-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6 pt-6 md:pt-10">
        <DashboardHeader />

        <nav className="sticky top-14 md:top-16 z-30 mt-6 -mx-4 md:mx-0 bg-[#FAFAFA]/95 backdrop-blur px-4 md:px-0 py-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                    active
                      ? "bg-[#1B9606] text-white shadow-md"
                      : "bg-white border border-[#E3E3E3] text-[#484848] hover:border-[#c9a24b] hover:text-[#7a5b1d]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-4">
          {tab === "timeline" && <TimelinePanel />}
          {tab === "brd" && <BrdPanel />}
          {tab === "srs" && <SrsPanel />}
          {tab === "ui" && <UiPanel />}
          {tab === "api" && <ApiPanel />}
          {tab === "db" && <DbPanel />}
          {tab === "br" && <BrPanel />}
        </div>
      </div>
    </main>
  );
}
