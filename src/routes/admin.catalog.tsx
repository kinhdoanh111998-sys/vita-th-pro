import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/catalog")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/products" });
  },
});
