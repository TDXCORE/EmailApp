import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <h2 className="text-4xl font-bold">404 - Página no encontrada</h2>
      <p className="text-muted-foreground">
        Lo sentimos, la página que buscas no existe.
      </p>
      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  )
}
