drop function if exists public.admin_upcoming_birthdays(integer);

create table if not exists public.raffle_entries (
  id uuid primary key default gen_random_uuid(),
  participant_key text not null unique,
  participant_name text not null,
  phone text,
  raffle_code text not null unique check (raffle_code ~ '^[0-9]{3}$'),
  submission_id uuid references public.submissions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.raffle_entries enable row level security;
revoke all on table public.raffle_entries from public, anon, authenticated;
create index if not exists raffle_entries_submission_id_idx on public.raffle_entries(submission_id);

create or replace function private.assign_raffle_code(
  p_submission_id uuid,
  p_participant_name text,
  p_phone text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text := lower(regexp_replace(btrim(coalesce(p_participant_name, '')), '\s+', ' ', 'g'));
  v_code text;
  v_attempt integer;
begin
  if length(v_key) < 2 then
    raise exception 'Nome inválido para o sorteio.';
  end if;

  select r.raffle_code into v_code
  from public.raffle_entries r
  where r.participant_key = v_key;

  if v_code is not null then
    update public.raffle_entries
    set participant_name = btrim(p_participant_name),
        phone = coalesce(nullif(btrim(p_phone), ''), phone),
        submission_id = coalesce(p_submission_id, submission_id),
        updated_at = now()
    where participant_key = v_key;
    return v_code;
  end if;

  if (select count(*) from public.raffle_entries) >= 1000 then
    raise exception 'Todos os códigos de sorteio já foram utilizados.';
  end if;

  for v_attempt in 1..1200 loop
    v_code := lpad(floor(random() * 1000)::integer::text, 3, '0');
    begin
      insert into public.raffle_entries (
        participant_key, participant_name, phone, raffle_code, submission_id
      ) values (
        v_key, btrim(p_participant_name), nullif(btrim(p_phone), ''), v_code, p_submission_id
      );
      return v_code;
    exception when unique_violation then
      select r.raffle_code into v_code
      from public.raffle_entries r
      where r.participant_key = v_key;
      if v_code is not null then return v_code; end if;
    end;
  end loop;

  raise exception 'Não foi possível gerar um código de sorteio.';
end;
$$;

revoke execute on function private.assign_raffle_code(uuid, text, text) from public, anon, authenticated;

do $$
declare
  v_submission record;
begin
  for v_submission in
    select distinct on (lower(regexp_replace(btrim(s.participant_name), '\s+', ' ', 'g')))
      s.id, s.participant_name, s.phone
    from public.submissions s
    where length(btrim(coalesce(s.participant_name, ''))) >= 2
    order by lower(regexp_replace(btrim(s.participant_name), '\s+', ' ', 'g')), s.submitted_at asc
  loop
    perform private.assign_raffle_code(v_submission.id, v_submission.participant_name, v_submission.phone);
  end loop;
end;
$$;

create or replace function public.submit_quiz_public(
  p_quiz_slug text,
  p_participant jsonb,
  p_answers jsonb,
  p_fingerprint text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_consent boolean;
  v_birth_date date;
  v_raffle_code text;
begin
  begin
    v_consent := coalesce((p_participant->>'consent_given')::boolean, false);
    v_birth_date := nullif(trim(coalesce(p_participant->>'birth_date', '')), '')::date;
  exception when others then
    raise exception 'Dados pessoais inválidos.';
  end;

  if not v_consent then
    raise exception 'É necessário autorizar o uso interno dos dados para enviar o quiz.';
  end if;
  if v_birth_date is null or v_birth_date > current_date or v_birth_date < current_date - interval '120 years' then
    raise exception 'Informe uma data de nascimento válida.';
  end if;

  v_result := public.submit_quiz(p_quiz_slug, p_participant, p_answers, p_fingerprint);

  update public.submissions
  set consent_given = true,
      birth_date = v_birth_date
  where id = (v_result->>'submission_id')::uuid;

  v_raffle_code := private.assign_raffle_code(
    (v_result->>'submission_id')::uuid,
    p_participant->>'full_name',
    p_participant->>'phone'
  );

  return v_result || jsonb_build_object('raffle_code', v_raffle_code);
end;
$$;

create or replace function public.admin_list_submissions(
  p_search text default null,
  p_quiz_id uuid default null,
  p_date_from date default null,
  p_date_to date default null,
  p_page integer default 1,
  p_page_size integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_page integer := greatest(coalesce(p_page,1),1);
  v_size integer := least(greatest(coalesce(p_page_size,20),1),1000);
  v_offset integer := (v_page-1)*v_size;
  v_total bigint;
  v_rows jsonb;
  v_search text := nullif(btrim(coalesce(p_search,'')), '');
begin
  perform private.require_admin();
  select count(*) into v_total
  from public.submissions s
  join public.quizzes q on q.id=s.quiz_id
  where (p_quiz_id is null or s.quiz_id=p_quiz_id)
    and (p_date_from is null or s.submitted_at >= p_date_from::timestamptz)
    and (p_date_to is null or s.submitted_at < (p_date_to + 1)::timestamptz)
    and (v_search is null
      or s.participant_name ilike '%'||v_search||'%'
      or s.phone ilike '%'||v_search||'%'
      or exists (
        select 1 from public.raffle_entries search_r
        where search_r.participant_key = lower(regexp_replace(btrim(s.participant_name), '\s+', ' ', 'g'))
          and search_r.raffle_code ilike '%'||v_search||'%'
      ));

  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into v_rows
  from (
    select s.id, s.participant_name, s.phone, s.birth_date, s.cell_name, s.leader_name,
           s.score, s.max_score, s.correct_answers, s.total_scored_questions,
           s.prayer_request, s.wants_follow_up, s.consent_given, s.submitted_at,
           q.id as quiz_id, q.title as quiz_title, r.raffle_code
    from public.submissions s
    join public.quizzes q on q.id=s.quiz_id
    left join public.raffle_entries r
      on r.participant_key = lower(regexp_replace(btrim(s.participant_name), '\s+', ' ', 'g'))
    where (p_quiz_id is null or s.quiz_id=p_quiz_id)
      and (p_date_from is null or s.submitted_at >= p_date_from::timestamptz)
      and (p_date_to is null or s.submitted_at < (p_date_to + 1)::timestamptz)
      and (v_search is null or s.participant_name ilike '%'||v_search||'%' or s.phone ilike '%'||v_search||'%' or r.raffle_code ilike '%'||v_search||'%')
    order by s.submitted_at desc
    limit v_size offset v_offset
  ) x;
  return jsonb_build_object('rows', v_rows, 'total', v_total, 'page', v_page, 'page_size', v_size, 'total_pages', greatest(ceil(v_total::numeric/v_size)::integer,1));
end;
$$;

create or replace function public.admin_raffle_entries()
returns table (raffle_code text, participant_name text, phone text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();
  return query
  select r.raffle_code, r.participant_name, r.phone
  from public.raffle_entries r
  order by r.participant_name;
end;
$$;

revoke execute on function public.admin_raffle_entries() from public, anon;
grant execute on function public.admin_raffle_entries() to authenticated;

create or replace function public.admin_submission_detail(p_submission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission jsonb;
  v_answers jsonb;
begin
  perform private.require_admin();
  select to_jsonb(x) into v_submission
  from (
    select s.*, q.title as quiz_title, q.slug as quiz_slug, r.raffle_code
    from public.submissions s
    join public.quizzes q on q.id=s.quiz_id
    left join public.raffle_entries r
      on r.participant_key = lower(regexp_replace(btrim(s.participant_name), '\s+', ' ', 'g'))
    where s.id=p_submission_id
  ) x;
  if v_submission is null then raise exception 'not_found'; end if;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.position), '[]'::jsonb) into v_answers
  from (
    select qu.id as question_id, qu.prompt, qu.position, qu.points,
           a.text_answer, a.numeric_answer, a.awarded_points, a.is_correct,
           coalesce((select jsonb_agg(jsonb_build_object('id',qo.id,'label',qo.label,'is_correct',qo.is_correct) order by qo.position)
                     from public.question_options qo where qo.id = any(a.selected_option_ids)), '[]'::jsonb) as selected_options,
           coalesce((select jsonb_agg(jsonb_build_object('id',qo.id,'label',qo.label) order by qo.position)
                     from public.question_options qo where qo.question_id=qu.id and qo.is_correct), '[]'::jsonb) as correct_options
    from public.answers a
    join public.questions qu on qu.id=a.question_id
    where a.submission_id=p_submission_id
  ) x;
  return jsonb_build_object('submission', v_submission, 'answers', v_answers);
end;
$$;
