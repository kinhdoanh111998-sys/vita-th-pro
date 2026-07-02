import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { StaffMember } from "@/components/StaffDragDropBoard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Props {
  staff: StaffMember[];
  onAssign: (staffId: string, targetId: string) => void;
  children: ReactNode;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase() || "?";
}

export function AssignDndProvider({ staff, onAssign, children }: Props) {
  const [activeStaffId, setActiveStaffId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

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

  const activeStaff = staff.find((s) => s.id === activeStaffId) ?? null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveStaffId(null)}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeStaff ? (
          <div className="flex items-center gap-2 rounded-lg border border-brand-primary bg-white px-2.5 py-1.5 shadow-lg rotate-2">
            <Avatar className="size-7">
              <AvatarFallback className="bg-brand-soft text-brand-dark text-[10px] font-bold">
                {initials(activeStaff.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs font-bold">{activeStaff.full_name}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
