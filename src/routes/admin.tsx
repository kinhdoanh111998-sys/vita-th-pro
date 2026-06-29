import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/AdminSidebar";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#f3f7f3] flex flex-col lg:flex-row">
      <AdminSidebar />
      <main className="flex-1 p-5 lg:p-7 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
