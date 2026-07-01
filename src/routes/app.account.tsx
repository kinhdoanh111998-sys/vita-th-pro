import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/account")({
  component: () => (
    <div className="p-4">
      <h1 className="text-xl font-bold">Tài khoản</h1>
      <p className="text-brand-muted mt-2">Thông tin cá nhân của bạn.</p>
    </div>
  ),
});
