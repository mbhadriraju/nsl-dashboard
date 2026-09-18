"use client";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Minus,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode, CSSProperties } from "react";
import type { Team } from "@/lib/types";
import { useLeague } from "./league-provider";
export function Logo({ team, size = 44 }: { team?: Team; size?: number }) {
  return (
    <img
      className="club-logo"
      src={team?.logo_url || "/logos/nsl_logo.png"}
      alt={team ? `${team.name} crest` : "NSL league crest"}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}
export function Change({ value }: { value: number }) {
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : Minus;
  return (
    <span className={`change ${value < 0 ? "negative" : ""}`}>
      <Icon size={12} />
      {value > 0 ? "+" : ""}
      {value}
    </span>
  );
}
export function SectionTitle({
  title,
  subtitle,
  href,
  link = "View all",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {link}
          <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal">
          <div className="modal-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="icon-button" aria-label="Close dialog">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className={description ? "muted" : "sr-only"}>
            {description || title}
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <CalendarDays size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function DataBoundary({ children }: { children: ReactNode }) {
  const { loading, error, refresh } = useLeague();
  if (loading)
    return (
      <div
        className="skeleton-grid"
        aria-label="Loading league data"
        aria-busy="true"
      >
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton" key={i} />
        ))}
      </div>
    );
  if (error)
    return (
      <div className="error-state" role="alert">
        <h2>Unable to load the league</h2>
        <p>{error}</p>
        <button className="button" onClick={() => void refresh()}>
          Try again
        </button>
      </div>
    );
  return children;
}
export function teamStyle(team: Team): CSSProperties {
  return { "--team-color": team.color } as CSSProperties;
}
export function formatDate(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}
export function formatTime(time: string) {
  const [h, m] = time.split(":");
  return `${+h % 12 || 12}:${m} ${+h >= 12 ? "PM" : "AM"}`;
}
