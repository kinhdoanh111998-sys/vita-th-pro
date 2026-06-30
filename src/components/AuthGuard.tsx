import { Navigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth, type Role } from "@/lib/AuthContext";

type AllowedRole = Exclude<Role, null>;

type Props = {
  children: ReactNode;
  /** Roles allowed to view the protected subtree. */
  allowedRoles?: Array<AllowedRole>;
  /** Where to send unauthenticated visitors. */
  loginPath?: string;
  /** Where to send authenticated visitors without the right role. */
  forbiddenPath?: string;
};

/** Pick a safe landing route per role so we never bounce a signed-in user
 *  back to /login (which would just re-redirect them and create a loop). */
function landingForRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "manager":
    case "staff":
      return "/portal/dashboard";
    case "customer":
      return "/portal/my-treatments";
    default:
      return "/";
  }
}

export function AuthGuard({
  children,
  allowedRoles = ["admin", "manager"],
  loginPath = "/login",
  forbiddenPath,
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

  // No session at all → straight to login.
  if (!session) {
    return <Navigate to={loginPath} replace />;
  }

  // Signed in but wrong role for this subtree → send to their own home,
  // NEVER back to /login (would loop). Customers stay inside /portal/*.
  if (!role || !(allowedRoles as string[]).includes(role)) {
    const target = forbiddenPath ?? landingForRole(role);
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
