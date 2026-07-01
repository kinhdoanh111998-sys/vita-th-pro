import { useEffect, useState } from "react";

function diff(target: number) {
  const now = Date.now();
  let s = Math.max(0, Math.floor((target - now) / 1000));
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  return { d, h, m, s };
}

export function EventCountdown({ target }: { target: string }) {
  const [t, setT] = useState(() => diff(new Date(target).getTime()));
  useEffect(() => {
    const tt = new Date(target).getTime();
    const id = setInterval(() => setT(diff(tt)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const Cell = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center rounded-xl bg-white/95 backdrop-blur px-3 py-2 md:px-5 md:py-3 shadow-sm border border-emerald-100 min-w-[64px] md:min-w-[84px]">
      <span className="font-heading text-2xl md:text-4xl font-black text-emerald-700 tabular-nums">
        {String(v).padStart(2, "0")}
      </span>
      <span className="text-[10px] md:text-xs uppercase tracking-wider text-gray-500 mt-0.5">
        {l}
      </span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <Cell v={t.d} l="Ngày" />
      <Cell v={t.h} l="Giờ" />
      <Cell v={t.m} l="Phút" />
      <Cell v={t.s} l="Giây" />
    </div>
  );
}
