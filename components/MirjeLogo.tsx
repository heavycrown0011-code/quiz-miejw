type MirjeLogoProps = {
  size?: number
  className?: string
  priority?: boolean
}

export default function MirjeLogo({
  size = 104,
  className,
}: MirjeLogoProps) {
  return (
    <img
      src="/logo-mirje.jpg"
      width={size}
      height={size}
      className={className}
      alt="MIRJE — Ministério Internacional Reconstruindo Jerusalém"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: '50%',
        background: '#000',
        display: 'block',
      }}
    />
  )
}
