'use client'

import { useRouter } from 'next/navigation'

type RestartQuizButtonProps = {
  className?: string
  quizPath?: string
}

export default function RestartQuizButton({
  className,
  quizPath = '/',
}: RestartQuizButtonProps) {
  const router = useRouter()

  function handleRestart() {
    sessionStorage.clear()

    const quizKeys = Object.keys(localStorage).filter((key) =>
      key.toLowerCase().includes('quiz') ||
      key.toLowerCase().includes('participant') ||
      key.toLowerCase().includes('submission') ||
      key.toLowerCase().includes('answer')
    )

    quizKeys.forEach((key) => localStorage.removeItem(key))

    router.replace(quizPath)
    router.refresh()
  }

  return (
    <div className="space-y-4 text-center">
      <div>
        <h2 className="text-xl font-semibold">Resposta salva com sucesso!</h2>
        <p className="mt-2 text-sm text-slate-600">
          Para outra pessoa responder o quiz neste mesmo celular, toque no botão abaixo.
        </p>
      </div>

      <button
        type="button"
        onClick={handleRestart}
        className={
          className ??
          'inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:w-auto'
        }
      >
        Responder o quiz para outra pessoa
      </button>
    </div>
  )
}
