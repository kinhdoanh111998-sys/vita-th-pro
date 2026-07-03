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
    bg: "bg-[#0068FF]",
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
 * Floating sticky bottom-right action stack.
 * - Desktop (md+): full pills with icon + label + hover animation.
 * - Mobile: circular FABs; first tap expands to pill, second tap fires action.
 *   Click outside collapses. Zalo (external) opens in new tab.
 * - Hidden on any /app/* route.
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

  // Collapse on route change
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

        const commonCls =
          "group inline-flex items-center gap-2 shadow-lg ring-4 transition-all duration-300 font-bold";

        // Desktop pill (always expanded)
        const desktopCls =
          "hidden md:inline-flex h-12 px-5 rounded-full text-[14px] hover:scale-[1.03] hover:shadow-xl";

        // Mobile: circular unless expanded
        const mobileCls = expanded
          ? "md:hidden inline-flex h-12 px-4 rounded-full text-[13px]"
          : "md:hidden inline-flex h-12 w-12 rounded-full justify-center";

        const content = (
          <>
            <Icon className="w-5 h-5 shrink-0" />
            <span
              className={`whitespace-nowrap ${
                expanded ? "inline" : "hidden"
              } md:inline`}
            >
              {b.label}
            </span>
          </>
        );

        const handleMobileClick = (e: React.MouseEvent) => {
          // On mobile: first tap expands, second fires. Detect md via matchMedia.
          if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
            return; // desktop: default anchor behaviour
          }
          if (!expanded) {
            e.preventDefault();
            setActiveKey(b.key);
          }
          // else: allow default navigation
        };

        if (b.external) {
          return (
            <div key={b.key} className="flex flex-col items-end gap-1">
              <a
                href={b.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={b.label}
                onClick={handleMobileClick}
                className={`${commonCls} ${desktopCls} ${b.bg} ${b.ring} text-white`}
              >
                {content}
              </a>
              <a
                href={b.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={b.label}
                onClick={handleMobileClick}
                className={`${commonCls} ${mobileCls} ${b.bg} ${b.ring} text-white`}
              >
                {content}
              </a>
            </div>
          );
        }

        return (
          <div key={b.key} className="flex flex-col items-end gap-1">
            <Link
              to={b.href}
              aria-label={b.label}
              className={`${commonCls} ${desktopCls} ${b.bg} ${b.ring}`}
            >
              {content}
            </Link>
            <Link
              to={b.href}
              aria-label={b.label}
              onClick={handleMobileClick}
              className={`${commonCls} ${mobileCls} ${b.bg} ${b.ring}`}
            >
              {content}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
