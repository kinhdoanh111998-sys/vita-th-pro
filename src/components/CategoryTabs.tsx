import { Link } from "@tanstack/react-router";

export function CategoryTabs({
  to,
  categories,
  current,
}: {
  to: "/products" | "/news";
  categories: string[];
  current?: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {categories.map((c) => {
        const isAll = c === "Tất cả";
        const active = isAll ? !current : current === c;
        return (
          <Link
            key={c}
            to={to}
            search={(isAll ? {} : { category: c }) as never}
            className={
              "rounded-full px-4 py-2 text-[13px] font-extrabold border transition-colors " +
              (active
                ? "bg-brand-dark text-white border-brand-dark shadow-[0_6px_18px_rgba(21,89,42,0.25)]"
                : "bg-white text-[#26352a] border-hairline hover:bg-brand-soft hover:text-brand-dark")
            }
          >
            {c}
          </Link>
        );
      })}
    </div>
  );
}
