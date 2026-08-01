update public.quizzes
set show_score = false,
    updated_at = now()
where slug = 'quiz-biblico';
