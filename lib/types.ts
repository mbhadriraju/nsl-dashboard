export interface Team {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  color: string;
  overall: number;
  overall_change: number;
  wins: number;
  losses: number;
  goals: number;
  games: number;
  points: number;
}
export interface Player {
  id: string;
  name: string;
  team_id: string;
  position: string | null;
  overall: number;
  shooting: number | null;
  pace: number | null;
  dribbling: number | null;
  passing: number | null;
  physical: number | null;
  defending: number | null;
  gk_overall: number | null;
  status: string;
  is_captain: boolean;
  player_playstyles: { name: string; is_plus: boolean }[];
}
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  role: "player" | "captain" | "admin";
  team_id: string | null;
  player_id: string | null;
}
export interface Reservation {
  id: string;
  type: "practice" | "game" | "friendly";
  team_id: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  notes: string | null;
  created_by: string;
}
export interface TradePlayer {
  player_id: string;
  from_team_id: string;
  to_team_id: string;
  player_name: string;
  player_overall: number;
}
export interface Trade {
  id: string;
  proposing_team_id: string;
  receiving_team_id: string;
  status: string;
  current_responder_team_id: string;
  parent_trade_id: string | null;
  created_at: string;
  completed_at: string | null;
  trade_players: TradePlayer[];
}
export interface LeagueData {
  teams: Team[];
  players: Player[];
  reservations: Reservation[];
  trades: Trade[];
}
