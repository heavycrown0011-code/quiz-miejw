'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Entry = { code: string; name: string }

const colors = ['#0d3378', '#c99a37', '#123f8e', '#e0b85e', '#071a3d', '#2d5aa4']

export default function RaffleWheel({ entries }: { entries: Entry[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const angleRef = useRef(0)
  const frameRef = useRef<number | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<Entry | null>(null)

  const draw = useCallback((rotation: number) => {
    const canvas = canvasRef.current
    if (!canvas || !entries.length) return
    const size = 680
    const ratio = window.devicePixelRatio || 1
    if (canvas.width !== size * ratio || canvas.height !== size * ratio) {
      canvas.width = size * ratio
      canvas.height = size * ratio
    }
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    const context = canvas.getContext('2d')
    if (!context) return
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, size, size)
    const center = size / 2
    const radius = center - 18
    const arc = (Math.PI * 2) / entries.length

    entries.forEach((entry, index) => {
      const start = -Math.PI / 2 + rotation + index * arc
      context.beginPath()
      context.moveTo(center, center)
      context.arc(center, center, radius, start, start + arc)
      context.closePath()
      context.fillStyle = colors[index % colors.length]
      context.fill()
      context.strokeStyle = '#ffffff55'
      context.lineWidth = entries.length > 80 ? .5 : 1.5
      context.stroke()

      if (entries.length <= 120) {
        context.save()
        context.translate(center, center)
        context.rotate(start + arc / 2)
        context.textAlign = 'right'
        context.textBaseline = 'middle'
        context.fillStyle = '#fff'
        context.font = `800 ${entries.length > 50 ? 8 : entries.length > 24 ? 11 : 14}px Inter, sans-serif`
        const label = entries.length > 45 ? entry.code : `${entry.name} · ${entry.code}`
        context.fillText(label, radius - 18, 0, radius * .68)
        context.restore()
      }
    })

    context.beginPath()
    context.arc(center, center, entries.length > 40 ? 78 : 92, 0, Math.PI * 2)
    context.fillStyle = '#fff'
    context.fill()
    context.lineWidth = 8
    context.strokeStyle = '#c99a37'
    context.stroke()
    context.fillStyle = '#071a3d'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = '900 27px Inter, sans-serif'
    context.fillText('MIRJE', center, center - 8)
    context.font = '800 11px Inter, sans-serif'
    context.fillStyle = '#c99a37'
    context.fillText(`${entries.length} PARTICIPANTES`, center, center + 20)
  }, [entries])

  useEffect(() => {
    draw(angleRef.current)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [draw])

  function randomIndex() {
    const values = new Uint32Array(1)
    const range = 2 ** 32
    const limit = Math.floor(range / entries.length) * entries.length
    do crypto.getRandomValues(values)
    while (values[0] >= limit)
    return values[0] % entries.length
  }

  function spin() {
    if (spinning || !entries.length) return
    setWinner(null)
    setSpinning(true)
    const selectedIndex = randomIndex()
    const arc = (Math.PI * 2) / entries.length
    const startAngle = angleRef.current
    const normalizedStart = ((startAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    const targetNormalized = (Math.PI * 2 - (selectedIndex + .5) * arc) % (Math.PI * 2)
    const extra = ((targetNormalized - normalizedStart + Math.PI * 2) % (Math.PI * 2)) + Math.PI * 2 * 8
    const targetAngle = startAngle + extra
    const startedAt = performance.now()
    const duration = 7200

    function animate(now: number) {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      angleRef.current = startAngle + (targetAngle - startAngle) * eased
      draw(angleRef.current)
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
      else {
        angleRef.current = targetAngle
        setSpinning(false)
        setWinner(entries[selectedIndex])
      }
    }

    frameRef.current = requestAnimationFrame(animate)
  }

  if (!entries.length) return <main className="raffle-empty"><h1>Nenhum participante disponível</h1><p>Os nomes aparecerão aqui depois que responderem ao quiz.</p></main>

  return <main className="raffle-stage">
    <section className="raffle-show">
      <div className="raffle-title"><span>Sorteio oficial MIRJE</span><h1>Quem será o vencedor?</h1><p>Cada nome aparece apenas uma vez.</p></div>
      <div className="wheel-wrap"><div className="wheel-pointer" aria-hidden="true" /><canvas ref={canvasRef} aria-label={`Roleta com ${entries.length} participantes`} /></div>
      <button className="raffle-spin" type="button" disabled={spinning} onClick={spin}>{spinning ? 'Sorteando...' : winner ? 'Sortear novamente' : 'Girar a roleta'}</button>
    </section>
    <aside className="raffle-roster"><div><span>Participantes</span><b>{entries.length} nomes únicos</b></div><ol>{entries.map(entry => <li key={entry.code}><span>{entry.name}</span><b>{entry.code}</b></li>)}</ol></aside>
    {winner && <div className="winner-overlay" role="status" aria-live="polite"><div className="winner-card"><span>Temos um vencedor!</span><b className="winner-code">{winner.code}</b><h2>{winner.name}</h2><p>Parabéns! Este é o nome sorteado pela roleta MIRJE.</p><button type="button" onClick={() => setWinner(null)}>Fechar resultado</button></div></div>}
  </main>
}
