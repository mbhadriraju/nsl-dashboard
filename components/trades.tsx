"use client";
import { useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Plus,
  Shield,
  Check,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { useLeague } from "./league-provider";
import { DataBoundary, PageTitle, Modal, Logo, Empty, teamStyle } from "./ui";
import { supabase } from "@/lib/supabase";
import type { Trade, Player, Team } from "@/lib/types";
export function Trades() {
  const { teams, trades, profile, canManage, refresh, notify, signIn } =
    useLeague();
  const [tab, setTab] = useState("Trade Market"),
    [open, setOpen] = useState(false),
    [counter, setCounter] = useState<Trade | null>(null),
    [confirm, setConfirm] = useState<{ trade: Trade; action: string } | null>(
      null,
    ),
    [busy, setBusy] = useState(false);
  const active = (t: Trade) =>
    ["pending", "countered"].includes(t.status) &&
    !trades.some((c) => c.parent_trade_id === t.id);
  const shown = trades.filter((t) =>
    tab === "Trade Market"
      ? active(t)
      : tab === "Sent Offers"
        ? canManage(t.proposing_team_id)
        : tab === "Received Offers"
          ? canManage(t.current_responder_team_id) && active(t)
          : !active(t),
  );
  async function respond() {
    if (!supabase || !confirm) return;
    setBusy(true);
    const { error } = await supabase.rpc("respond_trade", {
      trade_id: confirm.trade.id,
      action: confirm.action,
    });
    setBusy(false);
    if (error) notify(error.message);
    else {
      await refresh();
      notify(
        confirm.action === "accept"
          ? "Trade completed. Rosters updated."
          : `Offer ${confirm.action === "cancel" ? "cancelled" : "declined"}.`,
      );
      setConfirm(null);
    }
  }
  return (
    <div className="content-wrap">
      <PageTitle
        eyebrow="BIG MOVES. NEW POSSIBILITIES."
        title="NSL TRADE CENTER"
        description="Find the missing piece. Make your next move."
        action={
          profile && profile.role !== "player" ? (
            <button
              className="button button-primary"
              onClick={() => {
                setCounter(null);
                setOpen(true);
              }}
            >
              <Plus size={17} />
              Propose trade
            </button>
          ) : undefined
        }
      />
      <DataBoundary>
        <div className="trade-stats">
          <div>
            <ArrowLeftRight size={22} />
            <strong>{trades.filter(active).length}</strong>
            <span>Active offers</span>
          </div>
          <div>
            <Check size={22} />
            <strong>
              {trades.filter((t) => t.status === "completed").length}
            </strong>
            <span>Completed trades</span>
          </div>
          <div>
            <Shield size={22} />
            <strong>{teams.length}</strong>
            <span>Clubs in the market</span>
          </div>
        </div>
        <div
          className="trade-tabs"
          role="tablist"
          aria-label="Trade categories"
        >
          {[
            "Trade Market",
            "Sent Offers",
            "Received Offers",
            "Trade History",
          ].map((t) => (
            <button
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              key={t}
            >
              {t}
            </button>
          ))}
        </div>
        {!profile && ["Sent Offers", "Received Offers"].includes(tab) ? (
          <div className="panel">
            <Empty
              title="Your club’s next move starts here."
              description="Sign in to see your sent and received offers."
            >
              <button
                className="button button-primary"
                onClick={() => void signIn()}
              >
                Sign In with Google
              </button>
            </Empty>
          </div>
        ) : shown.length ? (
          <div className="trade-list">
            {shown.map((t) => (
              <article className="trade-card panel" key={t.id}>
                <header>
                  <span className={`badge ${t.status}`}>{t.status}</span>
                  <span>
                    {new Date(t.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {t.parent_trade_id && <span>Counter offer</span>}
                </header>
                <div className="trade-exchange">
                  {[t.proposing_team_id, t.receiving_team_id].map((id, i) => (
                    <div className="trade-side" key={id}>
                      <div className="trade-side-head">
                        <Logo team={teams.find((x) => x.id === id)} size={50} />
                        <h3>{teams.find((x) => x.id === id)?.name}</h3>
                      </div>
                      <span className="eyebrow">
                        {i === 0 ? "SENDING" : "IN RETURN"}
                      </span>
                      {t.trade_players
                        .filter((p) => p.from_team_id === id)
                        .map((p) => (
                          <div className="trade-player" key={p.player_id}>
                            <span>{p.player_name}</span>
                            <strong>
                              {p.player_overall}
                              <small> OVR</small>
                            </strong>
                          </div>
                        ))}
                    </div>
                  ))}
                  <ArrowLeftRight className="exchange-icon" size={26} />
                </div>
                {t.completed_at && (
                  <p className="trade-completed">
                    <Check size={15} />
                    Completed {new Date(t.completed_at).toLocaleString()}.
                    Players transferred.
                  </p>
                )}
                {active(t) && (
                  <div className="trade-actions">
                    {canManage(t.current_responder_team_id) && (
                      <>
                        <button
                          className="button"
                          onClick={() => {
                            setCounter(t);
                            setOpen(true);
                          }}
                        >
                          Counter Offer
                        </button>
                        <button
                          className="button danger"
                          onClick={() =>
                            setConfirm({ trade: t, action: "decline" })
                          }
                        >
                          Decline
                        </button>
                        <button
                          className="button button-primary"
                          onClick={() =>
                            setConfirm({ trade: t, action: "accept" })
                          }
                        >
                          Accept trade
                        </button>
                      </>
                    )}
                    {canManage(t.proposing_team_id) && (
                      <button
                        className="button"
                        onClick={() =>
                          setConfirm({ trade: t, action: "cancel" })
                        }
                      >
                        Cancel offer
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="panel market-empty">
            <ArrowLeftRight size={44} />
            <h2>The market is quiet.</h2>
            <p>
              {tab === "Trade History"
                ? "Completed and closed offers will appear here."
                : "A new teammate could change everything. Captains, make the first move."}
            </p>
            {profile &&
              profile.role !== "player" &&
              tab !== "Trade History" && (
                <button
                  className="button button-primary"
                  onClick={() => {
                    setCounter(null);
                    setOpen(true);
                  }}
                >
                  Create an offer <ArrowUpRight size={17} />
                </button>
              )}
          </div>
        )}
        <div className="trade-help">
          <Shield size={19} />
          <p>
            Both captains agree. Players move together. Pending offers never
            change your roster.
          </p>
        </div>
        {open && (
          <TradeComposer counter={counter} close={() => setOpen(false)} />
        )}
        {confirm && (
          <Modal
            open
            onClose={() => setConfirm(null)}
            title={
              confirm.action === "accept"
                ? "Complete this trade?"
                : confirm.action === "decline"
                  ? "Decline this offer?"
                  : "Cancel this offer?"
            }
            description={
              confirm.action === "accept"
                ? "The proposing captain has already approved this version. Accepting transfers every listed player immediately."
                : "This closes the current offer. Rosters remain unchanged."
            }
          >
            <div className="form-actions">
              <button className="button" onClick={() => setConfirm(null)}>
                Go back
              </button>
              <button
                className="button button-primary"
                disabled={busy}
                onClick={() => void respond()}
              >
                {busy
                  ? "Updating…"
                  : confirm.action === "accept"
                    ? "Accept and complete"
                    : confirm.action === "decline"
                      ? "Decline offer"
                      : "Cancel offer"}
              </button>
            </div>
          </Modal>
        )}
      </DataBoundary>
    </div>
  );
}
function TradeComposer({
  counter,
  close,
}: {
  counter: Trade | null;
  close: () => void;
}) {
  const { teams, players, canManage, notify, refresh } = useLeague();
  const managed = teams.filter((t) => canManage(t.id));
  const [own, setOwn] = useState(
    counter?.current_responder_team_id || managed[0]?.id || "",
  );
  const [other, setOther] = useState(
    counter?.proposing_team_id || teams.find((t) => t.id !== own)?.id || "",
  );
  const [outgoing, setOutgoing] = useState<string[]>(
      counter?.trade_players
        .filter((p) => p.from_team_id === own)
        .map((p) => p.player_id) || [],
    ),
    [incoming, setIncoming] = useState<string[]>(
      counter?.trade_players
        .filter((p) => p.from_team_id !== own)
        .map((p) => p.player_id) || [],
    ),
    [review, setReview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit() {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.rpc("propose_trade", {
      own_team: own,
      other_team: other,
      outgoing,
      incoming,
      parent_id: counter?.id || null,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      setReview(false);
    } else {
      await refresh();
      notify(counter ? "Counter offer sent." : "Trade offer sent.");
      close();
    }
  }
  function picker(
    teamId: string,
    selected: string[],
    set: (v: string[]) => void,
  ) {
    return (
      <div className="trade-picker">
        <div className="trade-side-head">
          <Logo team={teams.find((t) => t.id === teamId)} size={46} />
          <h3>{teams.find((t) => t.id === teamId)?.name}</h3>
        </div>
        {players
          .filter((p) => p.team_id === teamId)
          .map((p) => (
            <label
              className={`player-option ${selected.includes(p.id) ? "chosen" : ""}`}
              key={p.id}
            >
              <input
                type="checkbox"
                disabled={p.is_captain}
                checked={selected.includes(p.id)}
                onChange={() =>
                  set(
                    selected.includes(p.id)
                      ? selected.filter((id) => id !== p.id)
                      : [...selected, p.id],
                  )
                }
              />
              <span>
                {p.name}
                {p.is_captain && <small>Captain · protected</small>}
              </span>
              <b>{p.overall}</b>
            </label>
          ))}
      </div>
    );
  }
  return (
    <Modal
      open
      onClose={close}
      title={
        review
          ? "Review your trade"
          : counter
            ? "Counter offer"
            : "Build a trade proposal"
      }
      description={
        review
          ? "Sending this offer approves your side of the exchange. The other captain makes the final call."
          : "Select a club and the players each side will send."
      }
    >
      {review ? (
        <div className="trade-review">
          {[own, other].map((id) => (
            <div key={id}>
              <div className="trade-side-head">
                <Logo team={teams.find((t) => t.id === id)} size={48} />
                <h3>{teams.find((t) => t.id === id)?.name}</h3>
              </div>
              <span className="eyebrow">SENDING</span>
              {players
                .filter((p) =>
                  (id === own ? outgoing : incoming).includes(p.id),
                )
                .map((p) => (
                  <div className="trade-player" key={p.id}>
                    {p.name}
                    <b>{p.overall} OVR</b>
                  </div>
                ))}
            </div>
          ))}
          <ArrowLeftRight size={24} />
        </div>
      ) : (
        <>
          <div className="form-grid">
            <label>
              Your team
              <select
                disabled={!!counter}
                value={own}
                onChange={(e) => {
                  setOwn(e.target.value);
                  setOutgoing([]);
                  setIncoming([]);
                  if (other === e.target.value)
                    setOther(teams.find((t) => t.id !== e.target.value)!.id);
                }}
              >
                {managed.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Trade with
              <select
                disabled={!!counter}
                value={other}
                onChange={(e) => {
                  setOther(e.target.value);
                  setIncoming([]);
                }}
              >
                {teams
                  .filter((t) => t.id !== own)
                  .map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="trade-picker-grid">
            {picker(own, outgoing, setOutgoing)}
            {picker(other, incoming, setIncoming)}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
      <div className="form-actions">
        <button
          className="button"
          onClick={() => (review ? setReview(false) : close())}
        >
          {review ? "Back" : "Cancel"}
        </button>
        <button
          className="button button-primary"
          disabled={busy || !outgoing.length || !incoming.length}
          onClick={() => (review ? void submit() : setReview(true))}
        >
          {busy ? "Sending…" : review ? "Send offer" : "Review trade"}
          <ArrowRight size={16} />
        </button>
      </div>
    </Modal>
  );
}
