import { login } from './actions'
import MirjeLogo from '@/components/MirjeLogo'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const message = error === 'forbidden'
    ? 'Esta conta não possui permissão de administrador.'
    : error
      ? 'Senha inválida.'
      : null

  return (
    <div className="login">
      <form action={login} className="card stack">
        <div className="login-brand"><MirjeLogo size={92} priority /><div className="brand">MIRJE<small>Painel administrativo</small></div></div>
        <h1>Entrar</h1>
        <p className="muted">Digite a senha para acessar os dados do quiz.</p>
        {message && <div className="error">{message}</div>}
        <label>Senha<input className="input" type="password" name="password" required autoComplete="current-password" /></label>
        <button className="btn" type="submit">Acessar painel</button>
      </form>
    </div>
  )
}
