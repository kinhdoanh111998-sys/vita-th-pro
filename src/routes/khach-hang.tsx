import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/khach-hang")({
  beforeLoad: () => {
    throw redirect({ to: "/app/account", replace: true });
  },
  component: () => null,
});
