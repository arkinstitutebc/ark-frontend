/**
 * Small inline pill displaying a user role label.
 * Used in topbar/navbar dropdown headers and admin tables.
 *
 * Pass `showAdminLabel` when rendering inside the *current user's* own context
 * (e.g. their own dropdown header) — when role==="admin", a muted "Viewing as
 * admin" sibling is appended. In contexts that show *other* users' roles
 * (e.g. admin user list), omit the prop.
 */
export function RolePill(props: { role: string; showAdminLabel?: boolean; class?: string }) {
  return (
    <>
      <span
        class={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-muted text-muted capitalize ${props.class ?? ""}`}
      >
        {props.role}
      </span>
      {props.showAdminLabel && props.role === "admin" && (
        <span class="ml-2 text-[11px] text-muted">Viewing as admin</span>
      )}
    </>
  )
}
