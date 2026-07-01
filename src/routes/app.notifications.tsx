import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/notifications")({
  component: () => (
    <div className="p-4">
      <h1 className="text-xl font-bold">Thông báo</h1>
      <p className="text-brand-muted mt-2">Chưa có thông báo mới.</p>
    </div>
  ),
});
