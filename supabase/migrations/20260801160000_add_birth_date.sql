alter table public.submissions
  add column if not exists birth_date date;

alter table public.submissions
  drop constraint if exists submissions_birth_date_check;

alter table public.submissions
  add constraint submissions_birth_date_check
  check (birth_date is null or (birth_date <= current_date and birth_date >= current_date - interval '120 years'));

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

  return v_result;
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
    and (v_search is null or s.participant_name ilike '%'||v_search||'%' or s.phone ilike '%'||v_search||'%');

  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into v_rows
  from (
    select s.id, s.participant_name, s.phone, s.birth_date, s.cell_name, s.leader_name,
           s.score, s.max_score, s.correct_answers, s.total_scored_questions,
           s.prayer_request, s.wants_follow_up, s.consent_given, s.submitted_at,
           q.id as quiz_id, q.title as quiz_title
    from public.submissions s
    join public.quizzes q on q.id=s.quiz_id
    where (p_quiz_id is null or s.quiz_id=p_quiz_id)
      and (p_date_from is null or s.submitted_at >= p_date_from::timestamptz)
      and (p_date_to is null or s.submitted_at < (p_date_to + 1)::timestamptz)
      and (v_search is null or s.participant_name ilike '%'||v_search||'%' or s.phone ilike '%'||v_search||'%')
    order by s.submitted_at desc
    limit v_size offset v_offset
  ) x;
  return jsonb_build_object('rows', v_rows, 'total', v_total, 'page', v_page, 'page_size', v_size, 'total_pages', greatest(ceil(v_total::numeric/v_size)::integer,1));
end;
$$;
