import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/AuthContext";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-muted font-bold">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  const allowed = role === "admin" || role === "manager";
  if (!session || !allowed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
