do $$
declare
  v_quiz_id uuid;
  v_question_id uuid;
begin
  insert into public.quizzes (
    title, description, slug, status, require_identification,
    show_score, show_ranking, final_message, final_verse
  ) values (
    'Sua experiência no culto',
    'Queremos ouvir você. Conte em poucos minutos como foi o culto de hoje e como podemos acolher você ainda melhor.',
    'experiencia-no-culto', 'active', true, false, false,
    'Foi muito bom receber você! Sua opinião foi registrada e ajudará nossa equipe a tornar cada culto ainda mais acolhedor.',
    null
  )
  on conflict (slug) do update set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    require_identification = excluded.require_identification,
    show_score = excluded.show_score,
    show_ranking = excluded.show_ranking,
    final_message = excluded.final_message,
    final_verse = excluded.final_verse,
    updated_at = now()
  returning id into v_quiz_id;

  delete from public.questions where quiz_id = v_quiz_id;

  insert into public.questions (quiz_id, prompt, type, position, required)
  values (v_quiz_id, 'Como você se sentiu durante o culto de hoje?', 'single_choice', 1, true)
  returning id into v_question_id;
  insert into public.question_options (question_id, label, position) values
    (v_question_id, 'Muito bem', 1), (v_question_id, 'Bem', 2),
    (v_question_id, 'Mais ou menos', 3), (v_question_id, 'Não me senti à vontade', 4);

  insert into public.questions (quiz_id, prompt, type, position, required)
  values (v_quiz_id, 'Você se sentiu bem recebido pela equipe e pelas pessoas da igreja?', 'single_choice', 2, true)
  returning id into v_question_id;
  insert into public.question_options (question_id, label, position) values
    (v_question_id, 'Sim, muito bem recebido', 1), (v_question_id, 'Sim', 2),
    (v_question_id, 'Mais ou menos', 3), (v_question_id, 'Não', 4);

  insert into public.questions (quiz_id, prompt, type, position, required)
  values (v_quiz_id, 'O que você mais gostou no culto de hoje?', 'long_text', 3, false);

  insert into public.questions (quiz_id, prompt, type, position, required)
  values (v_quiz_id, 'Você gostaria de voltar em outro culto?', 'single_choice', 4, true)
  returning id into v_question_id;
  insert into public.question_options (question_id, label, position) values
    (v_question_id, 'Sim, com certeza', 1), (v_question_id, 'Talvez', 2),
    (v_question_id, 'Ainda não sei', 3), (v_question_id, 'Não', 4);

  insert into public.questions (quiz_id, prompt, type, position, required)
  values (v_quiz_id, 'Você já participou de um Encontro com Deus?', 'single_choice', 5, true)
  returning id into v_question_id;
  insert into public.question_options (question_id, label, position) values
    (v_question_id, 'Sim', 1), (v_question_id, 'Não', 2);

  insert into public.questions (quiz_id, prompt, type, position, required)
  values (v_quiz_id, 'Você gostaria de participar de um próximo Encontro com Deus?', 'single_choice', 6, true)
  returning id into v_question_id;
  insert into public.question_options (question_id, label, position) values
    (v_question_id, 'Sim', 1), (v_question_id, 'Quero saber mais', 2),
    (v_question_id, 'Talvez', 3), (v_question_id, 'Não neste momento', 4);

  insert into public.questions (quiz_id, prompt, type, position, required)
  values (v_quiz_id, 'Você pretende continuar frequentando nossa igreja?', 'single_choice', 7, true)
  returning id into v_question_id;
  insert into public.question_options (question_id, label, position) values
    (v_question_id, 'Sim', 1), (v_question_id, 'Talvez', 2),
    (v_question_id, 'Ainda estou conhecendo', 3), (v_question_id, 'Não', 4);

  insert into public.questions (quiz_id, prompt, type, position, required)
  values (v_quiz_id, 'Podemos entrar em contato para agradecer sua visita e enviar informações?', 'single_choice', 8, true)
  returning id into v_question_id;
  insert into public.question_options (question_id, label, position) values
    (v_question_id, 'Sim, autorizo o contato', 1), (v_question_id, 'Não desejo contato', 2);

  insert into public.questions (
    quiz_id, prompt, type, position, required, scale_min, scale_max
  ) values (
    v_quiz_id, 'De 0 a 10, qual nota você daria para o culto de hoje?',
    'scale', 9, true, 0, 10
  );
end;
$$;
