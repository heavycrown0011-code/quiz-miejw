'use client'

import { FormEvent, useState } from 'react'
import MirjeLogo from '@/components/MirjeLogo'
import RestartQuizButton from '@/components/RestartQuizButton'

type Option = { id: string; label: string; position: number }
type Question = {
  id: string
  prompt: string
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_text' | 'long_text' | 'scale'
  required: boolean
  scale_min: number | null
  scale_max: number | null
  options: Option[]
}
type Quiz = {
  title: string
  description: string | null
  slug: string
  show_score: boolean
  final_message: string | null
  final_verse: string | null
  settings: {
    require_age: boolean
    require_phone: boolean
    require_cell: boolean
    require_leader: boolean
    ask_visitor: boolean
    ask_follow_up: boolean
    ask_prayer_request: boolean
  }
  questions: Question[]
}

type Participant = {
  full_name: string
  birth_date: string
  phone: string
  cell_name: string
  leader_name: string
  is_visitor: boolean | null
  wants_follow_up: boolean | null
  prayer_request: string
  consent_given: boolean
}

const emptyParticipant: Participant = {
  full_name: '', birth_date: '', phone: '', cell_name: '', leader_name: '',
  is_visitor: null, wants_follow_up: null, prayer_request: '', consent_given: false,
}

export default function QuizExperience({ quiz }: { quiz: Quiz }) {
  const [stage, setStage] = useState<'welcome' | 'identity' | 'questions' | 'done'>('welcome')
  const [participant, setParticipant] = useState(emptyParticipant)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { selected: string[]; text: string; numeric: number | null }>>({})
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const question = quiz.questions[questionIndex]
  const current = question ? answers[question.id] || { selected: [], text: '', numeric: null } : null
  const progress = quiz.questions.length ? ((questionIndex + 1) / quiz.questions.length) * 100 : 0

  function updateParticipant<K extends keyof Participant>(key: K, value: Participant[K]) {
    setParticipant(previous => ({ ...previous, [key]: value }))
  }

  function saveAnswer(value: { selected: string[]; text: string; numeric: number | null }) {
    if (!question) return
    setAnswers(previous => ({ ...previous, [question.id]: value }))
  }

  function validateIdentity(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (participant.full_name.trim().length < 3) return setError('Digite seu nome completo.')
    if (!participant.birth_date) return setError('Informe sua data de nascimento.')
    if (quiz.settings.require_phone && !participant.phone.trim()) return setError('Informe seu WhatsApp.')
    if (!participant.consent_given) return setError('Autorize o uso interno das informações para continuar.')
    setStage('questions')
  }

  function answerIsValid() {
    if (!question?.required || !current) return true
    if (['single_choice', 'multiple_choice', 'true_false'].includes(question.type)) return current.selected.length > 0
    if (question.type === 'scale') return current.numeric !== null
    return current.text.trim().length > 0
  }

  async function nextQuestion() {
    setError('')
    if (!answerIsValid()) return setError('Escolha ou escreva uma resposta para continuar.')
    if (questionIndex < quiz.questions.length - 1) return setQuestionIndex(value => value + 1)

    setSending(true)
    try {
      const payload = {
        quizSlug: quiz.slug,
        participant: {
          full_name: participant.full_name.trim(),
          birth_date: participant.birth_date,
          phone: participant.phone.trim() || null,
          cell_name: participant.cell_name.trim() || null,
          leader_name: participant.leader_name.trim() || null,
          is_visitor: participant.is_visitor,
          wants_follow_up: participant.wants_follow_up,
          prayer_request: participant.prayer_request.trim() || null,
          consent_given: true,
        },
        answers: quiz.questions.map(item => {
          const answer = answers[item.id] || { selected: [], text: '', numeric: null }
          return {
            question_id: item.id,
            selected_option_ids: answer.selected,
            text_answer: answer.text.trim() || null,
            numeric_answer: answer.numeric,
          }
        }),
        fingerprint: typeof navigator === 'undefined' ? null : `${navigator.language}|${screen.width}x${screen.height}`,
      }
      const response = await fetch('/api/quiz/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Não foi possível enviar o quiz.')
      setResult(data)
      setStage('done')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível enviar o quiz.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="quiz-page">
      <section className="quiz-card">
        <div className="quiz-logo"><MirjeLogo size={122} priority /></div>

        {stage === 'welcome' && <div className="quiz-center">
          <span className="eyebrow">MIRJE apresenta</span>
          <h1>{quiz.title}</h1>
          <p className="quiz-lead">{quiz.description}</p>
          <button className="quiz-primary" onClick={() => setStage('identity')}>Começar o desafio</button>
          <p className="privacy-note">Leva poucos minutos. Suas informações ficam disponíveis somente para a equipe autorizada.</p>
        </div>}

        {stage === 'identity' && <form className="quiz-form" onSubmit={validateIdentity}>
          <div><span className="eyebrow">Etapa do desafio</span><h1>Queremos conhecer você</h1><p className="quiz-lead">Responda seus dados pessoais e continue o quiz.</p></div>
          <label>Nome completo<input value={participant.full_name} onChange={e => updateParticipant('full_name', e.target.value)} required minLength={3} autoComplete="name" /></label>
          <div className="form-grid">
            <label>Data de nascimento<input type="date" value={participant.birth_date} onChange={e => updateParticipant('birth_date', e.target.value)} required max={new Date().toISOString().slice(0, 10)} autoComplete="bday" /></label>
            <label>WhatsApp<input type="tel" value={participant.phone} onChange={e => updateParticipant('phone', e.target.value)} required={quiz.settings.require_phone} autoComplete="tel" placeholder="(92) 99999-9999" /></label>
          </div>
          <div className="form-grid">
            <label>Célula ou igreja<input value={participant.cell_name} onChange={e => updateParticipant('cell_name', e.target.value)} required={quiz.settings.require_cell} /></label>
            <label>Nome do líder<input value={participant.leader_name} onChange={e => updateParticipant('leader_name', e.target.value)} required={quiz.settings.require_leader} /></label>
          </div>
          {quiz.settings.ask_visitor && <fieldset><legend>É sua primeira vez conosco?</legend><div className="choice-row"><button type="button" aria-pressed={participant.is_visitor === true} className={participant.is_visitor === true ? 'selected' : ''} onClick={() => updateParticipant('is_visitor', true)}>Sim</button><button type="button" aria-pressed={participant.is_visitor === false} className={participant.is_visitor === false ? 'selected' : ''} onClick={() => updateParticipant('is_visitor', false)}>Não</button></div></fieldset>}
          {quiz.settings.ask_follow_up && <fieldset><legend>Gostaria que nossa equipe entrasse em contato?</legend><div className="choice-row"><button type="button" aria-pressed={participant.wants_follow_up === true} className={participant.wants_follow_up === true ? 'selected' : ''} onClick={() => updateParticipant('wants_follow_up', true)}>Sim</button><button type="button" aria-pressed={participant.wants_follow_up === false} className={participant.wants_follow_up === false ? 'selected' : ''} onClick={() => updateParticipant('wants_follow_up', false)}>Não</button></div></fieldset>}
          {quiz.settings.ask_prayer_request && <label>Pedido de oração <span>(opcional)</span><textarea value={participant.prayer_request} onChange={e => updateParticipant('prayer_request', e.target.value)} rows={3} placeholder="Como podemos orar por você?" /></label>}
          <label className="consent"><input type="checkbox" checked={participant.consent_given} onChange={e => updateParticipant('consent_given', e.target.checked)} /> Autorizo o uso interno destas informações pela equipe da MIRJE.</label>
          {error && <div className="quiz-error">{error}</div>}
          <button className="quiz-primary" type="submit">Ir para as perguntas</button>
        </form>}

        {stage === 'questions' && question && current && <div className="question-stage">
          <div className="progress-copy"><span>Pergunta {questionIndex + 1} de {quiz.questions.length}</span><span>{Math.round(progress)}%</span></div>
          <div className="progress"><span style={{ width: `${progress}%` }} /></div>
          <h1>{question.prompt}</h1>
          {['single_choice', 'true_false'].includes(question.type) && <div className="option-list">{question.options.map(option => <button key={option.id} type="button" aria-pressed={current.selected.includes(option.id)} className={current.selected.includes(option.id) ? 'selected' : ''} onClick={() => saveAnswer({ ...current, selected: [option.id] })}><span>{option.label}</span><i aria-hidden="true" /></button>)}</div>}
          {question.type === 'multiple_choice' && <div className="option-list">{question.options.map(option => <button key={option.id} type="button" aria-pressed={current.selected.includes(option.id)} className={current.selected.includes(option.id) ? 'selected' : ''} onClick={() => saveAnswer({ ...current, selected: current.selected.includes(option.id) ? current.selected.filter(id => id !== option.id) : [...current.selected, option.id] })}><span>{option.label}</span><i aria-hidden="true" /></button>)}</div>}
          {['short_text', 'long_text'].includes(question.type) && <textarea className="answer-text" rows={question.type === 'long_text' ? 6 : 3} value={current.text} onChange={e => saveAnswer({ ...current, text: e.target.value })} placeholder="Escreva sua resposta" />}
          {question.type === 'scale' && <div className="scale-list">{Array.from({ length: (question.scale_max || 10) - (question.scale_min || 1) + 1 }, (_, index) => (question.scale_min || 1) + index).map(value => <button key={value} className={current.numeric === value ? 'selected' : ''} onClick={() => saveAnswer({ ...current, numeric: value })}>{value}</button>)}</div>}
          {error && <div className="quiz-error">{error}</div>}
          <div className="quiz-actions">{questionIndex > 0 && <button className="quiz-secondary" onClick={() => setQuestionIndex(value => value - 1)}>Voltar</button>}<button className="quiz-primary" onClick={nextQuestion} disabled={sending}>{sending ? 'Enviando...' : questionIndex === quiz.questions.length - 1 ? 'Finalizar desafio' : 'Próxima pergunta'}</button></div>
        </div>}

        {stage === 'done' && <div className="quiz-center success-screen">
          <div className="success-icon">✓</div><span className="eyebrow">Desafio concluído</span><h1>Parabéns, {participant.full_name.split(' ')[0]}!</h1>
          <p className="quiz-lead">{quiz.final_message || 'Sua participação foi registrada com sucesso.'}</p>
          {quiz.show_score && result && <div className="score-card"><span>Sua pontuação</span><b>{result.score ?? 0} de {result.max_score ?? 0}</b></div>}
          {quiz.final_verse && <blockquote>{quiz.final_verse}</blockquote>}
          <div className="contact-links" aria-label="Contatos da MIRJE">
            <a href="https://www.instagram.com/rede_c_n_a/" target="_blank" rel="noreferrer">
              <span>Instagram</span><b>Rede de Jovens</b><small>@rede_c_n_a</small>
            </a>
            <a href="https://www.instagram.com/central_mirje/" target="_blank" rel="noreferrer">
              <span>Instagram</span><b>Igreja Central</b><small>@central_mirje</small>
            </a>
            <a href="https://wa.me/5592991837971" target="_blank" rel="noreferrer">
              <span>WhatsApp</span><b>Fale com a MIRJE</b><small>(92) 99183-7971</small>
            </a>
          </div>
          <RestartQuizButton className="quiz-primary" />
        </div>}
      </section>
      <p className="quiz-footer">Ministério Internacional Reconstruindo Jerusalém</p>
    </main>
  )
}
