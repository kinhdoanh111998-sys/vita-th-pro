import { Outlet, createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_public/news")({ component: () => <Outlet /> });
