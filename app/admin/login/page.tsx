import { login } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const message = error === 'forbidden'
    ? 'Esta conta não possui permissão de administrador.'
    : error
      ? 'E-mail ou senha inválidos.'
      : null

  return (
    <div className="login">
      <form action={login} className="card stack">
        <div className="brand">MIRJE<small>Painel administrativo</small></div>
        <h1>Entrar</h1>
        <p className="muted">Acesso restrito à equipe autorizada.</p>
        {message && <div className="error">{message}</div>}
        <label>E-mail<input className="input" type="email" name="email" required autoComplete="email" /></label>
        <label>Senha<input className="input" type="password" name="password" required autoComplete="current-password" /></label>
        <button className="btn" type="submit">Acessar painel</button>
      </form>
    </div>
  )
}
