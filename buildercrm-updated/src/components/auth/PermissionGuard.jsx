import React from "react";
import { usePermissions } from "../../hooks/usePermissions.jsx";
import { ShieldAlert } from "lucide-react";

/**
 * PermissionGuard renders children only if the current user has the required permission.
 * Props:
 * - permission: string (e.g. "Leads.Delete")
 * - anyPermissions: array of strings
 * - allPermissions: array of strings
 * - fallback: React node (rendered if unauthorized)
 * - disableInsteadOfHide: boolean (disables button/input instead of hiding it)
 * - maskSensitive: boolean (masks content like `••••••••`)
 * - showDeniedAlert: boolean (shows full access denied card)
 */
export function PermissionGuard({
  permission,
  anyPermissions,
  allPermissions,
  children,
  fallback = null,
  disableInsteadOfHide = false,
  maskSensitive = false,
  showDeniedAlert = false,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin } = usePermissions();

  let isAllowed = true;

  if (!isSuperAdmin) {
    if (permission) {
      isAllowed = hasPermission(permission);
    } else if (anyPermissions && anyPermissions.length > 0) {
      isAllowed = hasAnyPermission(anyPermissions);
    } else if (allPermissions && allPermissions.length > 0) {
      isAllowed = hasAllPermissions(allPermissions);
    }
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (maskSensitive) {
    return (
      <span
        style={{
          filter: "blur(4px)",
          userSelect: "none",
          display: "inline-block",
          opacity: 0.6,
        }}
        title="Restricted: Insufficient permissions to view sensitive data"
      >
        ₹ ••••••••
      </span>
    );
  }

  if (disableInsteadOfHide && React.isValidElement(children)) {
    return React.cloneElement(children, {
      disabled: true,
      style: {
        ...(children.props.style || {}),
        opacity: 0.45,
        cursor: "not-allowed",
        pointerEvents: "none",
      },
      title: `Access Restricted: Requires permission '${permission || "Action"}'`,
    });
  }

  if (showDeniedAlert) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          background: "rgba(239, 68, 68, 0.08)",
          border: "1px solid rgba(239, 68, 68, 0.25)",
          borderRadius: 10,
          color: "#fca5a5",
          fontSize: 13,
        }}
      >
        <ShieldAlert size={20} color="#ef4444" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 600, color: "#fff" }}>Access Denied</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
            You do not possess the required permission (<code>{permission}</code>) to view this section. Contact your system administrator to request access.
          </div>
        </div>
      </div>
    );
  }

  return fallback;
}

export default PermissionGuard;
