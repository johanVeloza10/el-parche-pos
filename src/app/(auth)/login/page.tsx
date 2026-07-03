import LoginForm from "@/components/forms/LoginForm"
import Image from "next/image"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-dark)] p-4 relative overflow-hidden">
      {/* Círculos decorativos de fondo con colores de la marca */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--color-primary)] rounded-full mix-blend-multiply filter blur-[100px] opacity-30"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[var(--color-secondary)] rounded-full mix-blend-multiply filter blur-[100px] opacity-30"></div>
      <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-[var(--color-accent)] rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>

      <div className="glass-panel relative z-10 w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden border-4 border-[var(--color-surface)] shadow-lg">
            <Image
              src="/brand/logo-original.jpeg"
              alt="El Parche Diseño Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-center text-white mb-2">el Parche</h1>
          <p className="text-[var(--color-text-secondary)] text-center text-sm font-medium tracking-wider">
            HECHO CON AMOR <span className="text-[var(--color-secondary)] mx-1">•</span> COLOMBIA
          </p>
        </div>

        <LoginForm />
        
        <div className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
          &copy; {new Date().getFullYear()} El Parche Sistema POS. Todos los derechos reservados.
        </div>
      </div>
    </main>
  )
}
