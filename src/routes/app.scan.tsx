import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/scan")({
  component: () => (
    <div className="p-4">
      <h1 className="text-xl font-bold">Quét QR</h1>
      <p className="text-brand-muted mt-2">Camera sẽ được kích hoạt tại đây.</p>
    </div>
  ),
});
