create type public.league_role as enum ('player','captain','admin');
create type public.trade_status as enum ('pending','countered','accepted','declined','cancelled','completed');
create table public.teams (
 id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, logo_url text not null, color text not null,
 overall int not null check(overall between 1 and 99), overall_change int not null default 0,
 wins int not null default 0, losses int not null default 0, goals int not null default 0, games int not null default 0, points int not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.players (
 id uuid primary key default gen_random_uuid(), name text not null unique, team_id uuid not null references public.teams(id), position text,
 overall int not null check(overall between 1 and 99), shooting int check(shooting between 1 and 99), pace int check(pace between 1 and 99), dribbling int check(dribbling between 1 and 99), passing int check(passing between 1 and 99), physical int check(physical between 1 and 99), defending int check(defending between 1 and 99), gk_overall int check(gk_overall between 1 and 99),
 status text not null default 'active' check(status in ('active','IR')), is_captain boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint goalkeeper_rating check ((position = 'GK' and gk_overall is not null) or (position is distinct from 'GK' and shooting is not null and pace is not null and dribbling is not null and passing is not null and physical is not null and defending is not null))
);
create index players_team_idx on public.players(team_id);
create table public.player_playstyles (id uuid primary key default gen_random_uuid(), player_id uuid not null references public.players(id) on delete cascade, name text not null check(length(name) between 1 and 60), is_plus boolean not null default false, unique(player_id,name));
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade, full_name text, email text, avatar_url text,
 role public.league_role not null default 'player', team_id uuid references public.teams(id), player_id uuid references public.players(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint captain_team check(role <> 'captain' or team_id is not null)
);
create index profiles_team_idx on public.profiles(team_id);
create table public.reservations (
 id uuid primary key default gen_random_uuid(), type text not null check(type in ('practice','game')), team_id uuid references public.teams(id), home_team_id uuid references public.teams(id), away_team_id uuid references public.teams(id),
 date date not null, start_time time not null, end_time time not null, location text not null check(length(trim(location)) between 1 and 200), notes text check(length(notes)<=2000), created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(end_time>start_time), check((type='practice' and team_id is not null and home_team_id is null and away_team_id is null) or (type='game' and team_id is null and home_team_id is not null and away_team_id is not null and home_team_id<>away_team_id))
);
create index reservations_date_idx on public.reservations(date);
create table public.trades (
 id uuid primary key default gen_random_uuid(), proposing_team_id uuid not null references public.teams(id), receiving_team_id uuid not null references public.teams(id), status public.trade_status not null default 'pending', created_by uuid not null references public.profiles(id), current_responder_team_id uuid not null references public.teams(id), parent_trade_id uuid references public.trades(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), completed_at timestamptz,
 check(proposing_team_id<>receiving_team_id), check(current_responder_team_id in (proposing_team_id,receiving_team_id))
);
create table public.trade_players (
 id uuid primary key default gen_random_uuid(), trade_id uuid not null references public.trades(id), player_id uuid not null references public.players(id), from_team_id uuid not null references public.teams(id), to_team_id uuid not null references public.teams(id), player_name text not null, player_overall int not null, unique(trade_id,player_id), check(from_team_id<>to_team_id)
);
create index trade_players_player_idx on public.trade_players(player_id);
create table public.trade_history(id uuid primary key default gen_random_uuid(),trade_id uuid not null unique references public.trades(id), snapshot jsonb not null, completed_at timestamptz not null default now());
create function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['teams','players','profiles','reservations','trades'] loop execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()',t); end loop; end $$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id,full_name,email,avatar_url) values(new.id,new.raw_user_meta_data->>'full_name',new.email,new.raw_user_meta_data->>'avatar_url'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create function public.can_manage(t uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.profiles where id=auth.uid() and (role='admin' or (role='captain' and team_id=t))) $$;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
do $$ declare t text; begin foreach t in array array['teams','players','player_playstyles','profiles','reservations','trades','trade_players','trade_history'] loop execute format('alter table public.%I enable row level security',t); execute format('revoke all on public.%I from anon,authenticated',t); end loop; end $$;
do $$ declare t text; begin foreach t in array array['teams','players','player_playstyles','reservations','trades','trade_players','trade_history'] loop execute format('grant select on public.%I to anon,authenticated',t); execute format('create policy public_read on public.%I for select using(true)',t); end loop; end $$;
grant select on public.profiles to authenticated;
create policy own_profile on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
-- Profile emails stay private. Only this minimal creator label is exposed.
create function public.creator_name(user_id uuid) returns text language sql stable security definer set search_path='' as $$ select full_name from public.profiles where id=user_id $$;
grant update(overall,shooting,pace,dribbling,passing,physical,defending,gk_overall,status) on public.players to authenticated;
create policy team_ratings on public.players for update to authenticated using(public.can_manage(team_id)) with check(public.can_manage(team_id));
grant insert,update,delete on public.reservations to authenticated;
create policy booking_insert on public.reservations for insert to authenticated with check(created_by=auth.uid() and public.can_manage(coalesce(team_id,home_team_id)));
create policy booking_update on public.reservations for update to authenticated using(public.can_manage(coalesce(team_id,home_team_id)) or public.can_manage(away_team_id)) with check(public.can_manage(coalesce(team_id,home_team_id)) or public.can_manage(away_team_id));
create policy booking_delete on public.reservations for delete to authenticated using(public.can_manage(coalesce(team_id,home_team_id)) or public.can_manage(away_team_id));
create function public.protect_reservation() returns trigger language plpgsql set search_path='' as $$ begin if new.created_by<>old.created_by or new.created_at<>old.created_at then raise exception 'Reservation ownership cannot be changed'; end if; return new; end $$;
create trigger reservation_owner before update on public.reservations for each row execute function public.protect_reservation();
create function public.update_ratings(p_id uuid, ratings jsonb, styles text[]) returns void language plpgsql security definer set search_path='' as $$
declare p public.players; s text; begin
 select * into p from public.players where id=p_id for update;
 if p.id is null or not public.can_manage(p.team_id) then raise exception 'You cannot edit this player'; end if;
 if coalesce(array_length(styles,1),0)>8 then raise exception 'Use at most eight playstyles'; end if;
 update public.players set overall=(ratings->>'overall')::int,shooting=(ratings->>'shooting')::int,pace=(ratings->>'pace')::int,dribbling=(ratings->>'dribbling')::int,passing=(ratings->>'passing')::int,physical=(ratings->>'physical')::int,defending=(ratings->>'defending')::int,gk_overall=(ratings->>'gk_overall')::int,status=ratings->>'status' where id=p_id;
 delete from public.player_playstyles where player_id=p_id;
 foreach s in array styles loop if length(trim(s))>0 then insert into public.player_playstyles(player_id,name,is_plus) values(p_id,trim(trailing '+' from trim(s)),right(trim(s),1)='+'); end if; end loop;
end $$;
-- All trade writes are RPC-only. Proposing a version constitutes that side's acceptance.
create function public.propose_trade(own_team uuid, other_team uuid, outgoing uuid[], incoming uuid[], parent_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare tid uuid; previous public.trades; p public.players; begin
 if not public.can_manage(own_team) or own_team=other_team then raise exception 'Not authorized for this team'; end if;
 if coalesce(array_length(outgoing,1),0)<1 or coalesce(array_length(incoming,1),0)<1 then raise exception 'Select players from both teams'; end if;
 if (select count(distinct x) from unnest(outgoing||incoming) x)<>array_length(outgoing||incoming,1) then raise exception 'Duplicate players'; end if;
 if parent_id is not null then
 select * into previous from public.trades where id=parent_id for update;
 if previous.id is null or previous.status not in ('pending','countered') or previous.current_responder_team_id<>own_team or previous.proposing_team_id<>other_team then raise exception 'This offer cannot be countered'; end if;
 update public.trades set status='countered',current_responder_team_id=other_team where id=parent_id;
 end if;
 perform id from public.players where id=any(outgoing||incoming) order by id for update;
 if (select count(*) from public.players where id=any(outgoing) and team_id=own_team)<>array_length(outgoing,1) or (select count(*) from public.players where id=any(incoming) and team_id=other_team)<>array_length(incoming,1) then raise exception 'A player has changed teams. Refresh your offer'; end if;
 if exists(select 1 from public.players where id=any(outgoing||incoming) and is_captain) then raise exception 'Captains cannot be traded; an admin must first reassign captaincy'; end if;
 insert into public.trades(proposing_team_id,receiving_team_id,created_by,current_responder_team_id,parent_trade_id,status) values(own_team,other_team,auth.uid(),other_team,parent_id,case when parent_id is null then 'pending'::public.trade_status else 'countered'::public.trade_status end) returning id into tid;
 for p in select * from public.players where id=any(outgoing||incoming) loop insert into public.trade_players(trade_id,player_id,from_team_id,to_team_id,player_name,player_overall) values(tid,p.id,p.team_id,case when p.team_id=own_team then other_team else own_team end,p.name,p.overall); end loop;
 return tid;
end $$;
create function public.respond_trade(trade_id uuid, action text) returns void language plpgsql security definer set search_path='' as $$
declare t public.trades; begin
 select * into t from public.trades where id=trade_id for update;
 if t.id is null or t.status not in ('pending','countered') or exists(select 1 from public.trades where parent_trade_id=t.id) then raise exception 'This version is no longer active'; end if;
 if action='cancel' then
 if not public.can_manage(t.proposing_team_id) then raise exception 'Only the proposing captain can cancel'; end if;
 update public.trades set status='cancelled' where id=t.id; return;
 end if;
 if not public.can_manage(t.current_responder_team_id) then raise exception 'Only the receiving captain can respond'; end if;
 if action='decline' then update public.trades set status='declined' where id=t.id; return; end if;
 if action<>'accept' then raise exception 'Invalid action'; end if;
 perform p.id from public.players p join public.trade_players tp on tp.player_id=p.id where tp.trade_id=t.id order by p.id for update of p;
 if exists(select 1 from public.trade_players tp join public.players p on p.id=tp.player_id where tp.trade_id=t.id and (p.team_id<>tp.from_team_id or p.is_captain)) then raise exception 'Roster changed. Create a new offer'; end if;
 update public.players p set team_id=tp.to_team_id from public.trade_players tp where tp.trade_id=t.id and p.id=tp.player_id;
 update public.profiles pr set team_id=p.team_id from public.players p where pr.player_id=p.id and pr.role='player' and p.id in(select player_id from public.trade_players where trade_players.trade_id=t.id);
 update public.trades set status='completed',completed_at=now() where id=t.id;
 insert into public.trade_history(trade_id,snapshot) select t.id,jsonb_build_object('proposing_team_id',t.proposing_team_id,'receiving_team_id',t.receiving_team_id,'players',jsonb_agg(to_jsonb(tp))) from public.trade_players tp where tp.trade_id=t.id;
end $$;
revoke execute on all functions in schema public from public,anon;
grant execute on function public.can_manage(uuid),public.is_admin(),public.update_ratings(uuid,jsonb,text[]),public.propose_trade(uuid,uuid,uuid[],uuid[],uuid),public.respond_trade(uuid,text) to authenticated;
grant execute on function public.creator_name(uuid) to anon,authenticated;
-- Public realtime streams contain no profile data.
alter publication supabase_realtime add table public.teams,public.players,public.player_playstyles,public.reservations,public.trades,public.trade_players;
