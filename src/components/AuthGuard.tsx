import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/AuthContext";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();

  const allowed = role === "admin" || role === "manager";

  useEffect(() => {
    if (loading) return;
    if (!session || !allowed) {
      navigate({ to: "/login" });
    }
  }, [loading, session, allowed, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-muted font-bold">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!session || !allowed) return null;

  return <>{children}</>;
}
