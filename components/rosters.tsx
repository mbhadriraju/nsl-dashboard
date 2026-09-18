"use client";
import { useEffect, useState } from "react";
import { useLeague } from "./league-provider";
import { Logo, Change, DataBoundary, PageTitle, Modal, teamStyle } from "./ui";
import { Shield, Users, Pencil, Star, ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Player } from "@/lib/types";
const stats = [
  ["shooting", "SHO"],
  ["pace", "PAC"],
  ["dribbling", "DRI"],
  ["passing", "PAS"],
  ["physical", "PHY"],
  ["defending", "DEF"],
] as const;
export function Rosters() {
  const { teams, players, canManage } = useLeague();
  const [slug, setSlug] = useState("villains");
  const [editing, setEditing] = useState<Player | null>(null);
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("team");
    if (t) setSlug(t);
  }, []);
  const team = teams.find((t) => t.slug === slug) || teams[0];
  const roster = players
    .filter((p) => p.team_id === team?.id)
    .sort(
      (a, b) =>
        Number(b.is_captain) - Number(a.is_captain) || b.overall - a.overall,
    );
  return (
    <div className="content-wrap">
      <PageTitle
        eyebrow="THE PEOPLE BEHIND THE BADGE"
        title="MEET THE ROSTERS"
        description="Four clubs. Twenty players. Plenty to prove."
      />
      <DataBoundary>
        <div className="team-tabs" role="tablist" aria-label="Select team">
          {teams.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={team?.id === t.id}
              className={team?.id === t.id ? "selected" : ""}
              style={teamStyle(t)}
              onClick={() => {
                setSlug(t.slug);
                history.replaceState(null, "", `?team=${t.slug}`);
              }}
            >
              <Logo team={t} size={44} />
              <span>{t.name}</span>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
        {team && (
          <>
            <section className="roster-header panel" style={teamStyle(team)}>
              <Logo team={team} size={110} />
              <div>
                <span className="eyebrow">THE CLUB</span>
                <h2>{team.name}</h2>
                <p>
                  <Shield size={15} /> Captain{" "}
                  {roster.find((p) => p.is_captain)?.name || "unassigned"}
                  <span>·</span>
                  <Users size={15} />
                  {roster.length} players
                </p>
              </div>
              <div className="roster-summary">
                <div>
                  <strong>{team.overall}</strong>
                  <span>
                    TEAM OVR <Change value={team.overall_change} />
                  </span>
                </div>
                <div>
                  <strong>{team.points}</strong>
                  <span>POINTS</span>
                </div>
              </div>
            </section>
            <div className="section-heading">
              <h2>THE SQUAD</h2>
              <span className="muted">Player ratings · Week 1</span>
            </div>
            <div className="player-grid">
              {roster.map((p) => (
                <article
                  key={p.id}
                  className={`player-card ${p.is_captain ? "captain-card" : ""}`}
                  style={teamStyle(team)}
                >
                  <div className="player-card-head">
                    <div className="player-ovr">
                      <strong>
                        {p.position === "GK" ? p.gk_overall : p.overall}
                      </strong>
                      <span>{p.position === "GK" ? "GK OVR" : "OVR"}</span>
                    </div>
                    <Logo team={team} size={58} />
                  </div>
                  <div className="player-identity">
                    <div className="player-badges">
                      {p.is_captain && (
                        <span className="badge captain">
                          <Shield size={11} /> CAPTAIN
                        </span>
                      )}
                      {p.status === "IR" && (
                        <span className="badge declined">IR</span>
                      )}
                      {p.position === "GK" && (
                        <span className="badge">GOALKEEPER</span>
                      )}
                    </div>
                    <h3>{p.name}</h3>
                  </div>
                  {p.position === "GK" ? (
                    <div className="gk-rating">
                      <Shield size={30} />
                      <div>
                        <strong>{p.gk_overall}</strong>
                        <span>GOALKEEPER OVERALL</span>
                      </div>
                    </div>
                  ) : (
                    <div className="attribute-grid">
                      {stats.map(([key, label]) => (
                        <div key={key}>
                          <span>{label}</span>
                          <b>{p[key]}</b>
                          <div className="stat-track">
                            <i style={{ width: `${p[key]}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="playstyles">
                    {p.player_playstyles.map((s) => (
                      <span key={s.name}>
                        <Star size={11} />
                        {s.name}
                        {s.is_plus ? "+" : ""}
                      </span>
                    ))}
                  </div>
                  {canManage(team.id) && (
                    <button
                      className="edit-ratings"
                      onClick={() => setEditing(p)}
                    >
                      <Pencil size={14} />
                      Edit Ratings
                    </button>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
        {editing && (
          <RatingEditor
            key={editing.id}
            player={editing}
            close={() => setEditing(null)}
          />
        )}
      </DataBoundary>
    </div>
  );
}
function RatingEditor({
  player,
  close,
}: {
  player: Player;
  close: () => void;
}) {
  const { notify, refresh } = useLeague();
  const [values, setValues] = useState({ ...player });
  const [styles, setStyles] = useState(
    player.player_playstyles
      .map((s) => s.name + (s.is_plus ? "+" : ""))
      .join(", "),
  );
  const [review, setReview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const fields = [
    ["overall", "OVR"],
    ...(player.position === "GK" ? [["gk_overall", "GK OVR"]] : stats),
  ] as [keyof Player, string][];
  async function save() {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.rpc("update_ratings", {
      p_id: player.id,
      ratings: values,
      styles: styles
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      setReview(false);
    } else {
      await refresh();
      notify(`${player.name}’s ratings updated.`);
      close();
    }
  }
  return (
    <Modal
      open
      onClose={close}
      title={review ? "Confirm rating update" : `Edit ${player.name}’s ratings`}
      description={
        review
          ? `Update ${player.name}’s OVR from ${player.overall} to ${values.overall}?`
          : "Ratings must be between 1 and 99."
      }
    >
      {review ? (
        <>
          <div className="review-changes">
            {fields
              .filter(([key]) => player[key] !== values[key])
              .map(([key, label]) => (
                <p key={key}>
                  {label}
                  <strong>
                    {String(player[key])} → {String(values[key])}
                  </strong>
                </p>
              ))}
            {player.status !== values.status && (
              <p>
                Status
                <strong>
                  {player.status} → {values.status}
                </strong>
              </p>
            )}
            <p>
              Playstyles<strong>{styles || "None"}</strong>
            </p>
          </div>
          <div className="form-actions">
            <button className="button" onClick={() => setReview(false)}>
              Back
            </button>
            <button
              className="button button-primary"
              disabled={busy}
              onClick={() => void save()}
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setReview(true);
          }}
        >
          <div className="form-grid">
            {fields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required
                  type="number"
                  min="1"
                  max="99"
                  value={String(values[key] ?? "")}
                  onChange={(e) =>
                    setValues({ ...values, [key]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
          </div>
          <label>
            Player status
            <select
              value={values.status}
              onChange={(e) => setValues({ ...values, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="IR">Injured reserve (IR)</option>
            </select>
          </label>
          <label>
            Playstyles
            <input
              value={styles}
              onChange={(e) => setStyles(e.target.value)}
              placeholder="Technical+, Flair"
            />
            <small>
              Separate playstyles with commas. Add + for enhanced playstyles.
            </small>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button type="button" className="button" onClick={close}>
              Cancel
            </button>
            <button className="button button-primary">Review changes</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
