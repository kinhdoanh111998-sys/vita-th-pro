import { Navigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth, type Role } from "@/lib/AuthContext";

type Props = {
  children: ReactNode;
  /** Roles allowed to view the protected subtree. */
  allowedRoles?: Array<Exclude<Role, null>>;
  /** Where to send unauthenticated visitors. */
  loginPath?: string;
  /** Where to send authenticated visitors without the right role. */
  forbiddenPath?: string;
};

export function AuthGuard({
  children,
  allowedRoles = ["admin", "manager"],
  loginPath = "/login",
  forbiddenPath = "/",
}: Props) {
  const { session, role, loading } = useAuth();

  // Hard failsafe: never show the spinner longer than 3s.
  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setForceReady(true), 3000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && !forceReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-muted font-bold">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!session) {
    return <Navigate to={loginPath} replace />;
  }

  if (!role || !(allowedRoles as string[]).includes(role)) {
    return <Navigate to={forbiddenPath} replace />;
  }

  return <>{children}</>;
}
