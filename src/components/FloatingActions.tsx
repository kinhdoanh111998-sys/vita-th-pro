import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, Search, CalendarCheck } from "lucide-react";

type Btn = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  external?: boolean;
  bg: string;
  ring: string;
};

const BUTTONS: Btn[] = [
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
  {
    key: "booking",
    label: "Đặt lịch",
    icon: CalendarCheck,
    href: "/booking",
    bg: "bg-[#1B9606] text-white",
    ring: "ring-[#1B9606]/40",
  },
];

/**
 * Sticky bottom-right stack.
 * - Desktop (md+): full pills with icon + label, always expanded.
 * - Mobile: single circular FAB per action. First tap expands the pill (label
 *   fades in), second tap fires the action. Click outside collapses.
 * Rendered as ONE element per action — responsive classes drive shape.
 * Hidden on any /app/* route.
 */
export function FloatingActions() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeKey) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setActiveKey(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [activeKey]);

  useEffect(() => setActiveKey(null), [pathname]);

  if (pathname.startsWith("/app")) return null;

  return (
    <div
      ref={wrapRef}
      className="fixed right-4 md:right-6 bottom-4 md:bottom-6 z-40 flex flex-col items-end gap-3"
    >
      {BUTTONS.map((b) => {
        const Icon = b.icon;
        const expanded = activeKey === b.key;

        // ONE element per action. Shape controlled by responsive classes.
        // Mobile default: 48px circle. Expanded on mobile: pill with label.
        // Desktop (md+): always pill with label.
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

        const isDesktop = () =>
          typeof window !== "undefined" &&
          window.matchMedia("(min-width: 768px)").matches;

        const handleTap = (e: React.MouseEvent) => {
          if (isDesktop()) return; // desktop: default navigation
          if (!expanded) {
            e.preventDefault();
            setActiveKey(b.key);
          }
        };

        if (b.external) {
          return (
            <a
              key={b.key}
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={b.label}
              onClick={handleTap}
              className={cls}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </a>
          );
        }

        return (
          <Link
            key={b.key}
            to={b.href}
            aria-label={b.label}
            onClick={handleTap}
            className={cls}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
