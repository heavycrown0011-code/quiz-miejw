import Link from 'next/link'
import MirjeLogo from '@/components/MirjeLogo'

export default function HomePage() {
  return (
    <main className="quiz-hub">
      <section className="quiz-hub-card">
        <MirjeLogo size={132} priority />
        <span className="welcome-badge">MIRJE</span>
        <h1>Que bom ter você aqui!</h1>
        <p>Escolha uma opção abaixo para começar. É rápido, personalizado e suas informações ficam protegidas.</p>

        <div className="quiz-choice-grid">
          <Link href="/quiz/quiz-biblico" className="quiz-choice quiz-choice-faith">
            <span className="quiz-choice-icon" aria-hidden="true">✦</span>
            <span className="quiz-choice-copy">
              <small>Desafio bíblico</small>
              <b>Iniciante na fé</b>
              <span>Teste seus conhecimentos e aprenda mais sobre a Palavra.</span>
            </span>
            <i aria-hidden="true">→</i>
          </Link>

          <Link href="/quiz/experiencia-no-culto" className="quiz-choice quiz-choice-visit">
            <span className="quiz-choice-icon" aria-hidden="true">♡</span>
            <span className="quiz-choice-copy">
              <small>Para quem nos visitou</small>
              <b>Conte sua experiência</b>
              <span>Compartilhe como foi o culto de hoje e como podemos acolher você.</span>
            </span>
            <i aria-hidden="true">→</i>
          </Link>
        </div>

        <p className="hub-privacy">Leva poucos minutos. Somente a equipe autorizada tem acesso às respostas.</p>
      </section>
      <p className="quiz-footer">Ministério Internacional Reconstruindo Jerusalém<a href="/admin">Área administrativa</a></p>
    </main>
  )
}
