"use client";
import { isUpcoming } from "@/lib/dates";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  Pencil,
  Trash2,
} from "lucide-react";
import { useLeague } from "./league-provider";
import {
  DataBoundary,
  PageTitle,
  Modal,
  Logo,
  Empty,
  formatDate,
  formatTime,
} from "./ui";
import { EventCard } from "./home";
import { supabase } from "@/lib/supabase";
import type { Reservation } from "@/lib/types";
const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function Schedule() {
  const { reservations, teams, profile, canManage, refresh, notify } =
    useLeague();
  const [view, setView] = useState("Month"),
    [month, setMonth] = useState(new Date()),
    [selected, setSelected] = useState<Reservation | null>(null),
    [edit, setEdit] = useState<Reservation | null>(null),
    [form, setForm] = useState(false),
    [deleteConfirm, setDeleteConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [creator, setCreator] = useState("");
  useEffect(() => {
    setCreator("");
    if (selected && supabase)
      void supabase
        .rpc("creator_name", { user_id: selected.created_by })
        .then(({ data }) => setCreator(data || "League member"));
  }, [selected]);
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (start.getDay() + 6) % 7;
  const days = Array.from(
    { length: 42 },
    (_, i) => new Date(month.getFullYear(), month.getMonth(), i - offset + 1),
  );
  const weekStart = new Date(month);
  weekStart.setDate(month.getDate() - ((month.getDay() + 6) % 7));
  const visibleDays =
    view === "Week"
      ? Array.from(
          { length: 7 },
          (_, i) =>
            new Date(
              weekStart.getFullYear(),
              weekStart.getMonth(),
              weekStart.getDate() + i,
            ),
        )
      : days;
  const upcoming = reservations.filter(isUpcoming);
  const name = (r: Reservation) =>
    r.type === "friendly"
      ? "Open friendly"
      : r.type === "practice"
        ? teams.find((t) => t.id === r.team_id)?.name
        : teams.find((t) => t.id === r.home_team_id)?.name +
          " vs " +
          teams.find((t) => t.id === r.away_team_id)?.name;
  async function remove() {
    if (!supabase || !selected) return;
    setBusy(true);
    const { error, data } = await supabase
      .from("reservations")
      .delete()
      .eq("id", selected.id)
      .select();
    setBusy(false);
    if (error || !data?.length)
      notify(error?.message || "This reservation was removed or your access changed. Refresh and try again.");
    else {
      setSelected(null);
      setDeleteConfirm(false);
      await refresh();
      notify("Reservation deleted.");
    }
  }
  return (
    <div className="content-wrap">
      <PageTitle
        eyebrow="MAKE TIME FOR THE GAME"
        title="THE MATCHDAY CALENDAR"
        description="Games, practices, and your next chance to show up."
        action={
          profile && profile.role !== "player" ? (
            <button
              className="button button-primary"
              onClick={() => {
                setEdit(null);
                setForm(true);
              }}
            >
              <Plus size={17} />
              New reservation
            </button>
          ) : undefined
        }
      />
      <DataBoundary>
        <section className="panel calendar-panel">
          <div className="calendar-toolbar">
            <div>
              <button
                className="icon-button"
                aria-label="Previous period"
                onClick={() =>
                  setMonth(
                    view === "Week"
                      ? new Date(
                          month.getFullYear(),
                          month.getMonth(),
                          month.getDate() - 7,
                        )
                      : new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
              >
                <ChevronLeft size={19} />
              </button>
              <h2>
                {month.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <button
                className="icon-button"
                aria-label="Next period"
                onClick={() =>
                  setMonth(
                    view === "Week"
                      ? new Date(
                          month.getFullYear(),
                          month.getMonth(),
                          month.getDate() + 7,
                        )
                      : new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
              >
                <ChevronRight size={19} />
              </button>
              <button
                className="button small"
                onClick={() => setMonth(new Date())}
              >
                Today
              </button>
            </div>
            <div className="segmented" aria-label="Calendar view">
              {["Month", "Week", "List"].map((v) => (
                <button
                  key={v}
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="calendar-legend">
            <span>
              <i className="game-dot" />
              Game
            </span>
            <span>
              <i className="practice-dot" />
              Practice
            </span>
            <span>
              <i className="friendly-dot" />
              Friendly
            </span>
            <span>All times: America/Chicago</span>
          </div>
          {view === "List" ? (
            <div className="event-list">
              {reservations.length ? (
                reservations.map((r) => (
                  <button
                    key={r.id}
                    className="event-list-row"
                    onClick={() => setSelected(r)}
                  >
                    <span className={`badge ${r.type}`}>{r.type}</span>
                    <strong>{name(r)}</strong>
                    <span>
                      {formatDate(r.date)} · {formatTime(r.start_time)}
                    </span>
                    <ChevronRight size={17} />
                  </button>
                ))
              ) : (
                <Empty
                  title="No fixtures booked yet."
                  description="Captains can book the next game or team practice."
                />
              )}
            </div>
          ) : (
            <div className="calendar-scroll">
              <div
                className={`calendar-grid ${view === "Week" ? "week-view" : ""}`}
              >
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                  <div className="day-label" key={d}>
                    {d}
                  </div>
                ))}
                {visibleDays.map((d) => (
                  <div
                    className={`calendar-day ${d.getMonth() !== month.getMonth() ? "outside" : ""} ${localDate(d) === localDate(new Date()) ? "today" : ""}`}
                    key={localDate(d)}
                  >
                    <span className="day-number">{d.getDate()}</span>
                    {reservations
                      .filter((r) => r.date === localDate(d))
                      .map((r) => (
                        <button
                          className={`calendar-event ${r.type}`}
                          key={r.id}
                          onClick={() => setSelected(r)}
                        >
                          <b>{formatTime(r.start_time)}</b>
                          {name(r)}
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
        <div className="section-heading">
          <h2>UPCOMING EVENTS</h2>
          <span className="muted">{upcoming.length} scheduled</span>
        </div>
        {upcoming.length ? (
          <div className="events-grid">
            {upcoming.map((r) => (
              <button
                className="event-button"
                key={r.id}
                onClick={() => setSelected(r)}
              >
                <EventCard event={r} />
              </button>
            ))}
          </div>
        ) : (
          <div className="panel">
            <Empty
              title="No fixtures booked yet."
              description="Good rivalries need a time and place. Check back for the next matchday."
            />
          </div>
        )}
        {selected && (
          <Modal
            open
            onClose={() => {
              setSelected(null);
              setDeleteConfirm(false);
            }}
            title={
              deleteConfirm
                ? "Delete reservation?"
                : selected.type === "game"
                  ? "Game details"
                  : selected.type === "friendly"
                    ? "Friendly details"
                    : "Practice details"
            }
            description={
              deleteConfirm
                ? "This removes the booking for everyone. You cannot undo this action."
                : name(selected)
            }
          >
            {deleteConfirm ? (
              <div className="form-actions">
                <button
                  className="button"
                  onClick={() => setDeleteConfirm(false)}
                >
                  Keep reservation
                </button>
                <button
                  className="button danger"
                  disabled={busy}
                  onClick={() => void remove()}
                >
                  {busy ? "Deleting…" : "Delete reservation"}
                </button>
              </div>
            ) : (
              <>
                <EventCard event={selected} />
                <dl className="event-details">
                  <dt>Ends</dt>
                  <dd>{formatTime(selected.end_time)}</dd>
                  <dt>Created by</dt>
                  <dd>{creator || "Loading…"}</dd>
                  <dt>Notes</dt>
                  <dd>{selected.notes || "No notes added."}</dd>
                </dl>
                {(canManage(selected.team_id || selected.home_team_id) ||
                  canManage(selected.away_team_id)) && (
                  <div className="form-actions">
                    <button
                      className="button danger"
                      onClick={() => setDeleteConfirm(true)}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                    <button
                      className="button button-primary"
                      onClick={() => {
                        setEdit(selected);
                        setSelected(null);
                        setForm(true);
                      }}
                    >
                      <Pencil size={15} />
                      Edit reservation
                    </button>
                  </div>
                )}
              </>
            )}
          </Modal>
        )}
        {form && (
          <ReservationForm initial={edit} close={() => setForm(false)} />
        )}
      </DataBoundary>
    </div>
  );
}
function ReservationForm({
  initial,
  close,
}: {
  initial: Reservation | null;
  close: () => void;
}) {
  const { teams, profile, canManage, refresh, notify } = useLeague();
  const managed = teams.filter((t) => canManage(t.id));
  const [type, setType] = useState<Reservation["type"]>(
      initial?.type || "game",
    ),
    [home, setHome] = useState(
      initial?.team_id || initial?.home_team_id || managed[0]?.id || "",
    ),
    [away, setAway] = useState(
      initial?.away_team_id || teams.find((t) => t.id !== home)?.id || "",
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !profile) return;
    const fd = new FormData(e.currentTarget);
    if (fd.get("end_time")! <= fd.get("start_time")!) {
      setError("End time must be after start time.");
      return;
    }
    if (fd.get("start_time")! < "18:00") {
      setError("Reservations start at 6:00 PM or later.");
      return;
    }
    if (type === "game" && home === away) {
      setError("Choose two different teams.");
      return;
    }
    setBusy(true);
    setError("");
    const payload = {
      type,
      team_id: type === "practice" ? home : null,
      home_team_id: type === "game" ? home : null,
      away_team_id: type === "game" ? away : null,
      date: fd.get("date"),
      start_time: fd.get("start_time"),
      end_time: fd.get("end_time"),
      location: String(fd.get("location")).trim(),
      notes: fd.get("notes") || null,
    };
    const query = initial
      ? supabase
          .from("reservations")
          .update(payload)
          .eq("id", initial.id)
          .select()
      : supabase
          .from("reservations")
          .insert({ ...payload, created_by: profile.id })
          .select();
    const { error, data } = await query;
    setBusy(false);
    if (error || !data?.length)
      setError(
        error?.message ||
          "You no longer have permission to change this reservation.",
      );
    else {
      await refresh();
      notify(initial ? "Reservation updated." : "Reservation booked.");
      close();
    }
  }
  return (
    <Modal
      open
      onClose={close}
      title={initial ? "Edit reservation" : "Book the pitch"}
      description="Choose teams when needed, then set a time and place. Reservations start at 6:00 PM or later."
    >
      <form onSubmit={submit}>
        <label>
          Reservation type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Reservation["type"])}
          >
            <option value="game">Game</option>
            <option value="practice">Practice</option>
            <option value="friendly">Friendly</option>
          </select>
        </label>
        {type !== "friendly" && <div className="form-grid">
          <label>
            {type === "game" ? "Home team" : "Team"}
            <select
              value={home}
              onChange={(e) => {
                setHome(e.target.value);
                if (away === e.target.value)
                  setAway(teams.find((t) => t.id !== e.target.value)!.id);
              }}
            >
              {(initial ? teams : managed).map((t) => (
                <option value={t.id} key={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          {type === "game" && (
            <label>
              Away team
              <select value={away} onChange={(e) => setAway(e.target.value)}>
                {teams
                  .filter((t) => t.id !== home)
                  .map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </div>}
        <div className="form-matchup">
          {type === "friendly" ? <b>OPEN FRIENDLY</b> : <><Logo team={teams.find((t) => t.id === home)} size={64} />
          {type === "game" && (
            <>
              <b>VS</b>
              <Logo team={teams.find((t) => t.id === away)} size={64} />
            </>
          )}</>}
        </div>
        <label>
          Date
          <input
            type="date"
            name="date"
            required
            defaultValue={initial?.date || localDate(new Date())}
          />
        </label>
        <div className="form-grid">
          <label>
            Start time
            <input
              type="time"
              name="start_time"
              min="18:00"
              required
              defaultValue={initial?.start_time || "18:00"}
            />
          </label>
          <label>
            End time
            <input
              type="time"
              name="end_time"
              required
              defaultValue={initial?.end_time}
            />
          </label>
        </div>
        <p className="muted">Times are in America/Chicago.</p>
        <label>
          Location
          <select
            name="location"
            required
            defaultValue={initial?.location || "Lakewood Elementary"}
          >
            <option value="Lakewood Elementary">Lakewood Elementary</option>
            <option value="Scheels">Scheels</option>
          </select>
        </label>
        <label>
          Notes (optional)
          <textarea
            name="notes"
            maxLength={2000}
            defaultValue={initial?.notes || ""}
            placeholder="Anything the teams should know?"
          />
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
          <button className="button button-primary" disabled={busy}>
            {busy ? "Saving…" : initial ? "Save changes" : "Book reservation"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
