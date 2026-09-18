"use client";
import Link from "next/link";
import { Admin } from "./admin";
import { useLeague } from "./league-provider";
import { PageTitle, Logo, Empty } from "./ui";
import { CalendarDays, ArrowLeftRight, Users } from "lucide-react";
export function Account({ captain = false }: { captain?: boolean }) {
  const { profile, teams, signIn } = useLeague();
  const team = teams.find((t) => t.id === profile?.team_id);
  return (
    <div className="content-wrap">
      <PageTitle
        eyebrow="YOUR PLACE IN THE LEAGUE"
        title={captain ? "CAPTAIN DASHBOARD" : "YOUR PROFILE"}
        description={
          captain
            ? "Your team. Your decisions."
            : "Your club and league account."
        }
      />
      {!profile ? (
        <div className="panel">
          <Empty
            title="Welcome to the league."
            description="Sign in with Google to access your profile."
          >
            <button
              className="button button-primary"
              onClick={() => void signIn()}
            >
              Sign In with Google
            </button>
          </Empty>
        </div>
      ) : captain && profile.role === "player" ? (
        <div className="panel">
          <Empty
            title="Captain access required"
            description="Your account currently has player access. Contact the league admin to assign your captain role."
          />
        </div>
      ) : (
        <>
          <section className="account-card panel">
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                width={64}
                height={64}
                alt="Your avatar"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <h2>{profile.full_name}</h2>
              <p>{profile.email}</p>
              <span className="badge">{profile.role}</span>
            </div>
            {team && (
              <Link href={`/rosters?team=${team.slug}`}>
                <Logo team={team} />
                {team.name}
              </Link>
            )}
          </section>
          {!team && (
            <p className="muted">
              Your account has not been assigned to a team yet. A league admin
              can link your player profile.
            </p>
          )}
          {captain && (
            <div className="captain-grid">
              <Link
                className="panel"
                href={team ? `/rosters?team=${team.slug}` : "/rosters"}
              >
                <Users />
                <h2>Manage ratings</h2>
                <p>Review your squad and update player ratings.</p>
              </Link>
              <Link className="panel" href="/schedule">
                <CalendarDays />
                <h2>Book the pitch</h2>
                <p>Schedule a game or a team practice.</p>
              </Link>
              <Link className="panel" href="/trades">
                <ArrowLeftRight />
                <h2>Manage trades</h2>
                <p>Build offers and respond to incoming trades.</p>
              </Link>
            </div>
          )}
          {captain && <Admin />}
        </>
      )}
    </div>
  );
}
