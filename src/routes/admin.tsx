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
      <div className="min-h-screen bg-[#f3f7f3] flex flex-col lg:flex-row">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 bg-[#112218] text-white px-4 h-14">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Mở menu"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[86%] max-w-[320px] bg-[#112218] border-0 text-white">
              <div onClick={() => setOpen(false)}>
                <AdminSidebar />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-8 bg-white rounded-md p-0.5" />
            <span className="font-black text-sm">Admin</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>

        <main className="flex-1 p-4 lg:p-7 overflow-auto">
          <Outlet />
        </main>
      </div>
    </AuthGuard>
  );
}
