import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/vita-th-pro-logo.png";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [open, setOpen] = useState(false);
  
  return (
    <AuthGuard allowedRoles={["admin", "manager"]} forbiddenPath="/">
      <div className="min-h-screen bg-brand-bg flex flex-col lg:flex-row">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 bg-brand-surface text-brand-text border-b border-brand-border px-4 h-14">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Mở menu"
                className="inline-flex items-center justify-center w-10 h-10 rounded-[8px] hover:bg-brand-bg text-brand-text"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[86%] max-w-[320px] bg-brand-surface border-0 text-brand-text">
              {/* FIXED: Bổ sung chiều cao 100% và thanh cuộn ẩn cho menu Mobile */}
              <div onClick={() => setOpen(false)} className="h-full overflow-y-auto scrollbar-none pb-10">
                <AdminSidebar />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-8 bg-white rounded-md p-0.5 border border-brand-border" />
            <span className="font-heading font-semibold text-sm text-brand-text">Admin</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Desktop sidebar */}
        {/* FIXED: Bổ sung sticky, giới hạn h-screen và bật scrollbar cho menu PC/Tablet */}
        <div className="hidden lg:block sticky top-0 h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          <AdminSidebar />
        </div>

        <main className="flex-1 p-4 lg:p-7 overflow-auto">
          <Outlet />
        </main>
      </div>
    </AuthGuard>
  );
}
