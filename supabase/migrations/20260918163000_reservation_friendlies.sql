alter table public.reservations
  drop constraint reservations_type_check,
  drop constraint reservations_location_check,
  drop constraint reservations_check1,
  add constraint reservations_type_check check(type in ('practice','game','friendly')),
  add constraint reservations_location_check check(location in ('Lakewood Elementary','Scheels')),
  add constraint reservations_start_time_check check(start_time >= time '18:00'),
  add constraint reservations_team_shape_check check(
    (type='practice' and team_id is not null and home_team_id is null and away_team_id is null)
    or (type='game' and team_id is null and home_team_id is not null and away_team_id is not null and home_team_id<>away_team_id)
    or (type='friendly' and team_id is null and home_team_id is null and away_team_id is null)
  );

create function public.can_manage_reservation(reservation_type text, reservation_team_id uuid, reservation_home_team_id uuid, reservation_away_team_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid()
      and (role='admin' or (role='captain' and (reservation_type='friendly' or team_id = any(array_remove(array[reservation_team_id,reservation_home_team_id,reservation_away_team_id],null)))))
  )
$$;

drop policy booking_insert on public.reservations;
drop policy booking_update on public.reservations;
drop policy booking_delete on public.reservations;
create policy booking_insert on public.reservations for insert to authenticated with check(created_by=auth.uid() and public.can_manage_reservation(type,team_id,home_team_id,away_team_id));
create policy booking_update on public.reservations for update to authenticated using(public.can_manage_reservation(type,team_id,home_team_id,away_team_id)) with check(public.can_manage_reservation(type,team_id,home_team_id,away_team_id));
create policy booking_delete on public.reservations for delete to authenticated using(public.can_manage_reservation(type,team_id,home_team_id,away_team_id));
revoke execute on function public.can_manage_reservation(text,uuid,uuid,uuid) from public,anon;
grant execute on function public.can_manage_reservation(text,uuid,uuid,uuid) to authenticated;
