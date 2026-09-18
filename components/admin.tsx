"use client";
import { useEffect, useState } from "react";
import { Pencil, Users } from "lucide-react";
import { useLeague } from "./league-provider";
import { Modal, Logo, SectionTitle } from "./ui";
import { supabase } from "@/lib/supabase";
import type { Profile, Team } from "@/lib/types";
export function Admin() {
  const { profile, teams, notify } = useLeague();
  const [users, setUsers] = useState<Profile[]>([]),
    [editing, setEditing] = useState<Profile | null>(null),
    [team, setTeam] = useState<Team | null>(null),
    [error, setError] = useState("");
  async function load() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");
    if (error) setError(error.message);
    else setUsers(data || []);
  }
  useEffect(() => {
    if (profile?.role === "admin") void load();
  }, [profile?.role]);
  if (profile?.role !== "admin") return null;
  return (
    <>
      <section className="admin-section">
        <SectionTitle
          title="LEAGUE ADMINISTRATION"
          subtitle="Manage official standings and team ratings."
        />
        <div className="admin-team-grid">
          {teams.map((t) => (
            <button className="panel" key={t.id} onClick={() => setTeam(t)}>
              <Logo team={t} />
              <span>
                <strong>{t.name}</strong>
                <small>
                  {t.points} points · {t.overall} OVR
                </small>
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="admin-section">
        <SectionTitle
          title="MEMBERS & CAPTAINS"
          subtitle="Members appear here after their first Google sign-in."
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="admin-users">
          {users.map((u) => (
            <div className="panel admin-user-row" key={u.id}>
              <Users size={20} />
              <div>
                <h3>{u.full_name || "League member"}</h3>
                <p>{u.email}</p>
              </div>
              <span className="badge">{u.role}</span>
              <button className="button" onClick={() => setEditing(u)}>
                <Pencil size={13} />
                Manage
              </button>
            </div>
          ))}
        </div>
      </section>
      {editing && (
        <ProfileEditor
          user={editing}
          close={() => setEditing(null)}
          done={() => {
            void load();
            notify("Member access updated.");
          }}
        />
      )}
      {team && <TeamEditor team={team} close={() => setTeam(null)} />}
    </>
  );
}
function ProfileEditor({
  user,
  close,
  done,
}: {
  user: Profile;
  close: () => void;
  done: () => void;
}) {
  const { teams, players } = useLeague();
  const [role, setRole] = useState(user.role),
    [team, setTeam] = useState(user.team_id || ""),
    [player, setPlayer] = useState(user.player_id || ""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_assign_profile", {
      user_id: user.id,
      new_role: role,
      new_team: team || null,
      new_player: player || null,
    });
    setBusy(false);
    if (error) setError(error.message);
    else {
      done();
      close();
    }
  }
  return (
    <Modal
      open
      onClose={close}
      title={`Manage ${user.full_name || user.email}`}
      description="Captain access applies to every player currently on the selected team."
    >
      <form onSubmit={save}>
        <label>
          League role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Profile["role"])}
          >
            <option value="player">Player</option>
            <option value="captain">Captain</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>
          Team
          <select
            value={team}
            required={role === "captain"}
            onChange={(e) => {
              setTeam(e.target.value);
              setPlayer("");
            }}
          >
            <option value="">No team assigned</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Player
          <select
            value={player}
            required={role === "captain"}
            onChange={(e) => setPlayer(e.target.value)}
          >
            <option value="">Not linked to a player</option>
            {players
              .filter((p) => p.team_id === team)
              .map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="button" type="button" onClick={close}>
            Cancel
          </button>
          <button className="button button-primary" disabled={busy}>
            {busy ? "Saving…" : "Save access"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function TeamEditor({ team, close }: { team: Team; close: () => void }) {
  const { refresh, notify } = useLeague();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [review, setReview] = useState(false),
    [values, setValues] = useState({ ...team });
  const fields = [
    ["overall", "Overall"],
    ["overall_change", "OVR change"],
    ["wins", "Wins"],
    ["losses", "Losses"],
    ["goals", "Goals"],
    ["games", "Games"],
    ["points", "Points"],
  ] as const;
  async function save() {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_update_team", {
      team: team.id,
      values_json: values,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      setReview(false);
    } else {
      await refresh();
      notify("Official team stats updated.");
      close();
    }
  }
  return (
    <Modal
      open
      onClose={close}
      title={review ? "Publish updated standings?" : `Edit ${team.name}`}
      description={
        review
          ? "These changes update the league table for everyone."
          : "Update official statistics and team rating."
      }
    >
      {review ? (
        <>
          <div className="review-changes">
            {fields
              .filter(([key]) => values[key] !== team[key])
              .map(([key, label]) => (
                <p key={key}>
                  {label}
                  <strong>
                    {team[key]} → {values[key]}
                  </strong>
                </p>
              ))}
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
              {busy ? "Publishing…" : "Publish changes"}
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
                  type="number"
                  min={
                    key === "overall_change" ? -99 : key === "overall" ? 1 : 0
                  }
                  max={key === "overall" ? 99 : undefined}
                  required
                  value={values[key]}
                  onChange={(e) =>
                    setValues({ ...values, [key]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button className="button" type="button" onClick={close}>
              Cancel
            </button>
            <button className="button button-primary">Review changes</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
