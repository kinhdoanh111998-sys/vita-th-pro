import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/store")({
  component: () => (
    <div className="p-4">
      <h1 className="text-xl font-bold">Cửa hàng</h1>
      <p className="text-brand-muted mt-2">Đang cập nhật…</p>
    </div>
  ),
});
