"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { LeagueData, Profile } from "@/lib/types";
type Context = LeagueData & {
  profile: Profile | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  notify: (s: string) => void;
  canManage: (id?: string | null) => boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};
const LeagueContext = createContext<Context | null>(null);
export function LeagueProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LeagueData>({
    teams: [],
    players: [],
    reservations: [],
    trades: [],
  });
  const [profile, setProfile] = useState<Profile | null>(null),
    [loading, setLoading] = useState(!!supabase),
    [error, setError] = useState(
      supabase
        ? ""
        : "Connect Supabase using the environment variables in .env.example.",
    ),
    [toast, setToast] = useState("");
  const notify = useCallback((s: string) => setToast(s), []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 6000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const refresh = useCallback(async () => {
    if (!supabase) return;
    const results = await Promise.all([
      supabase.from("teams").select("*").order("points", { ascending: false }),
      supabase
        .from("players")
        .select("*,player_playstyles(name,is_plus)")
        .order("overall", { ascending: false }),
      supabase
        .from("reservations")
        .select("*")
        .order("date")
        .order("start_time"),
      supabase
        .from("trades")
        .select("*,trade_players(*)")
        .order("created_at", { ascending: false }),
    ]);
    const failed = results.find((r) => r.error);
    if (failed) {
      setError(
        "League data could not load. Check your connection and try again.",
      );
    } else {
      setData({
        teams: results[0].data!,
        players: results[1].data!,
        reservations: results[2].data!,
        trades: results[3].data!,
      });
      setError("");
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    void refresh();
    if (!supabase) return;
    const db = supabase;
    const loadProfile = async (id?: string) => {
      if (!id) {
        setProfile(null);
        return;
      }
      const { data, error } = await db
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) notify("Your profile could not load. Try signing in again.");
      setProfile(data);
    };
    void db.auth
      .getSession()
      .then(({ data }) => loadProfile(data.session?.user.id));
    const { data: auth } = db.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void loadProfile(session?.user.id), 0);
    });
    const channel = db
      .channel("league-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      auth.subscription.unsubscribe();
      void db.removeChannel(channel);
    };
  }, [refresh, notify]);
  const signIn = async () => {
    if (!supabase) {
      notify("Sign-in is waiting for the league’s Supabase connection.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
    if (error) notify(error.message);
  };
  const signOut = async () => {
    const result = await supabase?.auth.signOut();
    if (result?.error) notify(result.error.message);
    else setProfile(null);
  };
  return (
    <LeagueContext.Provider
      value={{
        ...data,
        profile,
        loading,
        error,
        refresh,
        notify,
        canManage: (id) =>
          profile?.role === "admin" ||
          (profile?.role === "captain" && profile.team_id === id),
        signIn,
        signOut,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            ×
          </button>
        </div>
      )}
    </LeagueContext.Provider>
  );
}
export function useLeague() {
  const context = useContext(LeagueContext);
  if (!context) throw new Error("LeagueProvider missing");
  return context;
}
