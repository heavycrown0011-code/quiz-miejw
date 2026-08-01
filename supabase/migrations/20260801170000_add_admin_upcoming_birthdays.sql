create or replace function public.admin_upcoming_birthdays(p_limit integer default 5)
returns table (
  submission_id uuid,
  participant_name text,
  phone text,
  birth_date date,
  next_birthday date,
  days_until integer,
  turning_age integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'America/Manaus')::date;
  v_limit integer := least(greatest(coalesce(p_limit, 5), 1), 20);
begin
  perform private.require_admin();

  return query
  with latest_participants as (
    select distinct on (regexp_replace(coalesce(s.phone, ''), '\D', '', 'g'))
      s.id,
      s.participant_name,
      s.phone,
      s.birth_date
    from public.submissions s
    where s.birth_date is not null
      and nullif(regexp_replace(coalesce(s.phone, ''), '\D', '', 'g'), '') is not null
    order by regexp_replace(coalesce(s.phone, ''), '\D', '', 'g'), s.submitted_at desc
  ), birthday_this_year as (
    select
      p.*,
      make_date(
        extract(year from v_today)::integer,
        extract(month from p.birth_date)::integer,
        least(
          extract(day from p.birth_date)::integer,
          extract(day from (
            make_date(
              extract(year from v_today)::integer,
              extract(month from p.birth_date)::integer,
              1
            ) + interval '1 month - 1 day'
          ))::integer
        )
      ) as birthday_date
    from latest_participants p
  ), next_dates as (
    select
      b.*,
      case
        when b.birthday_date >= v_today then b.birthday_date
        else make_date(
          extract(year from v_today)::integer + 1,
          extract(month from b.birth_date)::integer,
          least(
            extract(day from b.birth_date)::integer,
            extract(day from (
              make_date(
                extract(year from v_today)::integer + 1,
                extract(month from b.birth_date)::integer,
                1
              ) + interval '1 month - 1 day'
            ))::integer
          )
        )
      end as calculated_next_birthday
    from birthday_this_year b
  )
  select
    n.id,
    n.participant_name,
    n.phone,
    n.birth_date,
    n.calculated_next_birthday,
    (n.calculated_next_birthday - v_today)::integer,
    extract(year from age(n.calculated_next_birthday, n.birth_date))::integer
  from next_dates n
  order by n.calculated_next_birthday, n.participant_name
  limit v_limit;
end;
$$;

revoke execute on function public.admin_upcoming_birthdays(integer) from public, anon;
grant execute on function public.admin_upcoming_birthdays(integer) to authenticated;
