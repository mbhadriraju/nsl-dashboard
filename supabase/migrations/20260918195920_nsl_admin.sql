create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
create table private.bootstrap_admins(email text primary key);
insert into private.bootstrap_admins(email) values('madhbhad@gmail.com');
create function private.bootstrap_admin(user_id uuid,user_email text,confirmed_at timestamptz) returns void language plpgsql security definer set search_path='' as $$ begin
 if confirmed_at is not null and exists(select 1 from private.bootstrap_admins where email=lower(user_email)) then
 update public.profiles set role='admin' where id=user_id;
 if found then delete from private.bootstrap_admins where email=lower(user_email); end if;
 end if;
end $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$ begin
 insert into public.profiles(id,full_name,email,avatar_url) values(new.id,new.raw_user_meta_data->>'full_name',new.email,new.raw_user_meta_data->>'avatar_url');
 perform private.bootstrap_admin(new.id,new.email,new.email_confirmed_at);
 return new;
end $$;
create function private.on_email_verified() returns trigger language plpgsql security definer set search_path='' as $$ begin
 perform private.bootstrap_admin(new.id,new.email,new.email_confirmed_at);return new;
end $$;
create trigger on_nsl_email_verified after update of email_confirmed_at on auth.users for each row execute function private.on_email_verified();
do $$ declare u record; begin for u in select id,email,email_confirmed_at from auth.users where lower(email)='madhbhad@gmail.com' loop perform private.bootstrap_admin(u.id,u.email,u.email_confirmed_at); end loop; end $$;
create function public.admin_assign_profile(user_id uuid,new_role public.league_role,new_team uuid,new_player uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare old_profile public.profiles; selected_player public.players; begin
 if not public.is_admin() then raise exception 'Admin access required'; end if;
 select * into old_profile from public.profiles where id=user_id for update;
 if old_profile.id is null then raise exception 'This user has not signed in yet'; end if;
 if user_id=auth.uid() and new_role<>'admin' then raise exception 'You cannot remove your own admin access'; end if;
 if new_role='captain' and (new_team is null or new_player is null) then raise exception 'Assign a captain to a team and player'; end if;
 if new_player is not null then select * into selected_player from public.players where id=new_player for update; if selected_player.id is null or selected_player.team_id is distinct from new_team then raise exception 'Player must belong to the selected team'; end if; end if;
 if exists(select 1 from public.profiles where player_id=new_player and id<>user_id) then raise exception 'That player already has an account'; end if;
 if new_role='captain' and exists(select 1 from public.profiles where role='captain' and team_id=new_team and id<>user_id) then raise exception 'This team already has a captain account. Reassign it first'; end if;
 update public.profiles set role=new_role,team_id=new_team,player_id=new_player where id=user_id;
 if new_role='captain' then update public.players set is_captain=(id=new_player) where team_id=new_team; end if;
end $$;
create function public.admin_update_team(team uuid,values_json jsonb) returns void language plpgsql security definer set search_path='' as $$ begin
 if not public.is_admin() then raise exception 'Admin access required';end if;
 update public.teams set overall=(values_json->>'overall')::int,overall_change=(values_json->>'overall_change')::int,wins=(values_json->>'wins')::int,losses=(values_json->>'losses')::int,goals=(values_json->>'goals')::int,games=(values_json->>'games')::int,points=(values_json->>'points')::int where id=team;
 if not found then raise exception 'Team not found';end if;
end $$;
alter table public.teams add constraint nonnegative_standings check(wins>=0 and losses>=0 and goals>=0 and games>=0 and points>=0);
create unique index profiles_player_unique on public.profiles(player_id) where player_id is not null;
create unique index profiles_captain_unique on public.profiles(team_id) where role='captain';
create index reservations_team_idx on public.reservations(team_id);
create index reservations_home_idx on public.reservations(home_team_id);
create index reservations_away_idx on public.reservations(away_team_id);
create index reservations_creator_idx on public.reservations(created_by);
create index trades_proposing_idx on public.trades(proposing_team_id);
create index trades_receiving_idx on public.trades(receiving_team_id);
create index trades_responder_idx on public.trades(current_responder_team_id);
create index trades_creator_idx on public.trades(created_by);
create index trades_parent_idx on public.trades(parent_trade_id);
create index trade_players_from_idx on public.trade_players(from_team_id);
create index trade_players_to_idx on public.trade_players(to_team_id);
revoke all on all functions in schema private from public,anon,authenticated;
revoke execute on function public.admin_assign_profile(uuid,public.league_role,uuid,uuid),public.admin_update_team(uuid,jsonb) from public,anon;
grant execute on function public.admin_assign_profile(uuid,public.league_role,uuid,uuid),public.admin_update_team(uuid,jsonb) to authenticated;
