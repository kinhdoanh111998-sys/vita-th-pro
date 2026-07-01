import { Navigate, useLocation } from "@tanstack/react-router";
import { type ReactNode } from "react";
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

const CUSTOMER_SAFE_PATHS = ["/portal/my-treatments", "/portal/affiliate"];

/** Pick a safe landing route per role so we never bounce a signed-in user
 *  back to /login (which would just re-redirect them and create a loop). */
function landingForRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "manager":
      return "/admin";
    case "staff":
    case "employee":
    case "sale":
    case "technician":
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
  const { pathname } = useLocation();
  const { session, role, loading, isLoadingRole } = useAuth();

  // Session/profile state is asynchronous. Never redirect while role is loading,
  // otherwise /login ↔ /portal can loop before the DB query resolves.
  if (loading || isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-muted font-bold">
        Đang tải hệ thống...
      </div>
    );
  }

  // No session at all → straight to login.
  if (!session) {
    return <Navigate to={loginPath} replace />;
  }

  // Customer whitelist: if a customer is already authenticated and is opening
  // their allowed portal pages, render immediately instead of falling through
  // to any broader portal/admin routing branch.
  if (role === "customer" && CUSTOMER_SAFE_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  // Signed in but wrong role for this subtree → send to their own home,
  // NEVER back to /login (would loop). Customers stay inside /portal/*.
  if (!role || !(allowedRoles as string[]).includes(role)) {
    const target = forbiddenPath ?? landingForRole(role);
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
