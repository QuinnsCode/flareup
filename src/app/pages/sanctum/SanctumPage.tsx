import { AppContext } from "@/worker";

export default function SanctumPage({ ctx }: { ctx: AppContext }) {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Welcome{ctx.user?.name ? `, ${ctx.user.name}` : ""}</h1>
      <p>This is your app's authenticated home. Replace this page with your own.</p>
      {ctx.organization && (
        <p style={{ color: "#64748b" }}>Org: {ctx.organization.name}</p>
      )}
    </div>
  );
}