import LoginForm from "@/components/forms/LoginForm"
import Image from "next/image"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-dark)] p-4 relative overflow-hidden">
      {/* Círculos decorativos de fondo con colores de la bandera de Colombia */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#FCD116] rounded-full mix-blend-screen filter blur-[100px] opacity-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#003893] rounded-full mix-blend-screen filter blur-[100px] opacity-15"></div>
      <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-[#CE1126] rounded-full mix-blend-screen filter blur-[100px] opacity-10"></div>

      <div className="glass-panel border-stitch-colombia relative z-10 w-full max-w-md rounded-2xl p-8 shadow-2xl">
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
          <h1 className="font-heading text-4xl uppercase tracking-[0.15em] text-white text-center mb-2 flex items-baseline justify-center gap-1 select-none">
            <span className="font-light italic text-zinc-400 lowercase font-serif text-3xl">el</span>
            <span className="font-bold text-white">Parche</span>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-center text-xs font-bold tracking-[0.2em] font-sans">
            HECHO CON AMOR <span className="text-[var(--color-logo-cyan)] mx-1">•</span> COLOMBIA
          </p>
        </div>

        <LoginForm />
        
        <div className="mt-8 text-center text-[10px] text-[var(--color-text-muted)] tracking-wider font-sans uppercase">
          &copy; {new Date().getFullYear()} El Parche Sistema POS. Todos los derechos reservados.
        </div>
      </div>
    </main>
  )
}
