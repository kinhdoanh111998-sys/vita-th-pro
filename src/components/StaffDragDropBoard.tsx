import { useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Search, GripVertical, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type StaffMember = {
  id: string;
  full_name: string;
  role: string;
  meta?: string; // ví dụ "Đang rảnh" | "Có ca 15:00"
};

export type DropTarget = {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  highlight?: "warn" | "danger" | "ok" | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  content?: ReactNode; // custom body
  actions?: ReactNode; // custom footer
};

interface Props {
  staff: StaffMember[];
  targets: DropTarget[];
  onAssign: (staffId: string, targetId: string) => void;
  emptyStaffText?: string;
  emptyTargetsText?: string;
  leftTitle?: string;
  rightTitle?: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  manager: "Quản lý",
  staff: "Nhân viên",
  technician: "Kỹ thuật viên",
  sale: "Sale",
  employee: "Nhân sự",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase() || "?";
}

function StaffCard({ s, dragging = false }: { s: StaffMember; dragging?: boolean }) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border border-hairline bg-white px-3 py-2.5 shadow-sm",
        dragging ? "ring-2 ring-brand-primary shadow-lg rotate-1" : "hover:border-brand-primary/40 hover:shadow",
      ].join(" ")}
    >
      <GripVertical className="size-4 text-ink-muted shrink-0" />
      <Avatar className="size-9 shrink-0">
        <AvatarFallback className="bg-brand-soft text-brand-dark text-xs font-bold">
          {initials(s.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-sm truncate">{s.full_name}</div>
        <div className="text-[11px] text-ink-muted truncate">
          {ROLE_LABEL[s.role] ?? s.role}
          {s.meta ? ` · ${s.meta}` : ""}
        </div>
      </div>
    </div>
  );
}

function DraggableStaff({ s }: { s: StaffMember }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `staff:${s.id}`,
    data: { staffId: s.id },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.35 : 1, touchAction: "none" }}
    >
      <StaffCard s={s} />
    </div>
  );
}

function DroppableTarget({
  t,
  activeStaffId,
}: {
  t: DropTarget;
  activeStaffId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `target:${t.id}`,
    data: { targetId: t.id },
  });

  const highlightRing =
    t.highlight === "danger"
      ? "ring-2 ring-rose-400 animate-pulse"
      : t.highlight === "warn"
      ? "ring-2 ring-amber-400 animate-pulse"
      : t.highlight === "ok"
      ? "ring-1 ring-emerald-300"
      : "";

  return (
    <div
      ref={setNodeRef}
      className={[
        "rounded-2xl border-2 bg-white p-4 transition-all",
        isOver && activeStaffId
          ? "border-brand-primary bg-brand-soft/40 scale-[1.01] shadow-md"
          : "border-dashed border-hairline hover:border-brand-primary/40",
        highlightRing,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="font-black text-sm truncate">{t.title}</div>
          {t.subtitle && <div className="text-xs text-ink-muted truncate">{t.subtitle}</div>}
        </div>
        {t.badge && (
          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-lime text-[#34483a]">
            {t.badge}
          </span>
        )}
      </div>

      {t.content}

      <div className="mt-3 rounded-xl border border-hairline bg-brand-bg/40 p-2 flex items-center gap-2 text-xs">
        <UserIcon className="size-3.5 text-ink-muted" />
        {t.assigneeName ? (
          <span className="font-bold text-brand-dark truncate">{t.assigneeName}</span>
        ) : (
          <span className="text-ink-muted italic">Kéo thẻ nhân viên vào đây…</span>
        )}
      </div>

      {t.actions && <div className="mt-2">{t.actions}</div>}
    </div>
  );
}

export function StaffDragDropBoard({
  staff,
  targets,
  onAssign,
  emptyStaffText = "Không có nhân viên khả dụng.",
  emptyTargetsText = "Không có việc cần phân công.",
  leftTitle = "Nhân viên",
  rightTitle = "Việc cần làm",
}: Props) {
  const [q, setQ] = useState("");
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const filteredStaff = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return staff;
    return staff.filter(
      (s) =>
        s.full_name.toLowerCase().includes(kw) ||
        (ROLE_LABEL[s.role] ?? s.role).toLowerCase().includes(kw),
    );
  }, [q, staff]);

  const activeStaff = staff.find((s) => s.id === activeStaffId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    const sid = (e.active.data.current as { staffId?: string })?.staffId ?? null;
    setActiveStaffId(sid);
  }
  function handleDragEnd(e: DragEndEvent) {
    setActiveStaffId(null);
    const sid = (e.active.data.current as { staffId?: string })?.staffId;
    const tid = (e.over?.data.current as { targetId?: string } | undefined)?.targetId;
    if (sid && tid) onAssign(sid, tid);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveStaffId(null)}
    >
      <div className="grid lg:grid-cols-[320px_1fr] gap-5">
        {/* LEFT: STAFF POOL */}
        <aside className="bg-white border border-hairline rounded-2xl p-4 h-fit lg:sticky lg:top-4 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-sm">
              {leftTitle} <span className="text-ink-muted font-semibold">({filteredStaff.length})</span>
            </h3>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-ink-muted" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm nhân viên…"
              className="pl-8"
            />
          </div>
          <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[120px]">
            {filteredStaff.length === 0 ? (
              <div className="text-xs text-ink-muted italic text-center py-6">{emptyStaffText}</div>
            ) : (
              filteredStaff.map((s) => <DraggableStaff key={s.id} s={s} />)
            )}
          </div>
        </aside>

        {/* RIGHT: DROP ZONES */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-sm">
              {rightTitle} <span className="text-ink-muted font-semibold">({targets.length})</span>
            </h3>
          </div>
          {targets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-hairline bg-white p-10 text-center text-ink-muted text-sm">
              {emptyTargetsText}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {targets.map((t) => (
                <DroppableTarget key={t.id} t={t} activeStaffId={activeStaffId} />
              ))}
            </div>
          )}
        </section>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeStaff ? (
          <div className="w-[280px]">
            <StaffCard s={activeStaff} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
