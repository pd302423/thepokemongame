import type { ReactNode } from "react";

export default function Panel({
  title,
  subtitle,
  wide,
  onClose,
  children
}: {
  title: string;
  subtitle?: string;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className={`panel${wide ? " wide" : ""}`} role="dialog" aria-label={title}>
        <header className="panel-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.4" fill="none">
              <path d="M1 1 L11 11 M11 1 L1 11" />
            </svg>
          </button>
        </header>
        <div className="panel-body">{children}</div>
      </aside>
    </>
  );
}
