import Image from 'next/image'

type MirjeLogoProps = {
  size?: number
  className?: string
  priority?: boolean
}

export default function MirjeLogo({
  size = 104,
  className,
  priority = false,
}: MirjeLogoProps) {
  return (
    <Image
      src="/logo-mirje.jpg"
      width={size}
      height={size}
      className={className}
      alt="MIRJE — Ministério Internacional Reconstruindo Jerusalém"
      priority={priority}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        objectPosition: '50% 52%',
        borderRadius: '50%',
        background: '#000',
        display: 'block',
      }}
    />
  )
}
