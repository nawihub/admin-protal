/** Re-mounts on every navigation so each page eases in. Pure CSS - never leaves a page hidden. */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
