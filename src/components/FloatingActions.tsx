import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, Search, CalendarCheck } from "lucide-react";
import { BookingActionMenu } from "@/components/BookingActionMenu";
import { useSystemSettings } from "@/lib/useSystemSettings";

type Btn = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  external?: boolean;
  action?: "booking";
  bg: string;
  ring: string;
};

const BUTTONS: Btn[] = [
  {
    key: "booking",
    label: "Đặt lịch",
    icon: CalendarCheck,
    action: "booking",
    bg: "bg-[#1B9606] text-white",
    ring: "ring-[#1B9606]/40",
  },
  {
    key: "zalo",
    label: "Liên hệ Zalo",
    icon: MessageCircle,
    href: "https://zalo.me/0988000888",
    external: true,
    bg: "bg-[#0068FF] text-white",
    ring: "ring-[#0068FF]/30",
  },
  {
    key: "lookup",
    label: "Tra cứu liệu trình",
    icon: Search,
    href: "/lookup",
    bg: "bg-white text-[#1B9606] border border-[#1B9606]",
    ring: "ring-[#1B9606]/25",
  },
];

/**
 * Sticky bottom-right stack.
 * Nút "Đặt lịch" mở BookingActionMenu (Liên hệ Zalo / Tra cứu liệu trình).
 * Hidden on any /app/* route.
 */
export function FloatingActions() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [expanded, setExpanded] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { data: sys } = useSystemSettings();
  const zaloUrl =
    (sys as { zalo_oa_url?: string | null } | null | undefined)?.zalo_oa_url ||
    sys?.zalo_link ||
    "https://zalo.me/0988000888";

  useEffect(() => {
    if (!expanded) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [expanded]);

  useEffect(() => setExpanded(false), [pathname]);

  if (pathname.startsWith("/app")) return null;

  // Mobile-only gate: first tap expands all buttons; second tap performs action.
  const isMobile = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches;

  const gateFirstTap = (e: React.MouseEvent) => {
    if (isMobile() && !expanded) {
      e.preventDefault();
      e.stopPropagation();
      setExpanded(true);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="fixed right-4 md:right-6 bottom-24 md:bottom-6 z-40 flex flex-col items-end gap-3"
    >
      {BUTTONS.map((b) => {
        const Icon = b.icon;

        const shape = expanded
          ? "h-12 w-auto px-4 rounded-full"
          : "h-12 w-12 md:w-auto md:px-5 rounded-full";

        const cls = [
          "group inline-flex items-center gap-2 shadow-lg ring-4 font-bold transition-all duration-300 justify-center",
          "text-[13px] md:text-[14px] hover:scale-[1.03] hover:shadow-xl",
          shape,
          b.bg,
          b.ring,
        ].join(" ");

        const label = (
          <span
            className={`whitespace-nowrap ${expanded ? "inline" : "hidden"} md:inline`}
          >
            {b.label}
          </span>
        );

        // Booking → popover menu 2 lựa chọn
        if (b.action === "booking") {
          // On mobile before expanded, render a plain button that only expands.
          if (!expanded) {
            return (
              <button
                key={b.key}
                type="button"
                aria-label={b.label}
                className={cls}
                onClick={(e) => {
                  if (isMobile()) {
                    e.preventDefault();
                    e.stopPropagation();
                    setExpanded(true);
                  }
                }}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </button>
            );
          }
          return (
            <BookingActionMenu
              key={b.key}
              align="end"
              trigger={
                <button type="button" aria-label={b.label} className={cls}>
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </button>
              }
            />
          );
        }

        if (b.external && b.href) {
          const href = b.key === "zalo" ? zaloUrl : b.href;
          return (
            <a
              key={b.key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={b.label}
              className={cls}
              onClick={gateFirstTap}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </a>
          );
        }

        return (
          <Link
            key={b.key}
            to={b.href!}
            aria-label={b.label}
            className={cls}
            onClick={gateFirstTap}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
