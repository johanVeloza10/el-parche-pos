"use client"

import { useActionState } from "react"
import { authenticate } from "@/app/(auth)/login/actions"
import { LogIn, AlertCircle } from "lucide-react"

export default function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  )

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label
            className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]"
            htmlFor="email"
          >
            Correo Electrónico
          </label>
          <input
            className="peer block w-full rounded-xl border border-[var(--color-surface-elevated)] bg-[var(--color-surface)] py-3 px-4 text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors text-white"
            id="email"
            type="email"
            name="email"
            placeholder="admin@elparche.co"
            required
            defaultValue="admin@elparche.co"
          />
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]"
            htmlFor="password"
          >
            Contraseña
          </label>
          <input
            className="peer block w-full rounded-xl border border-[var(--color-surface-elevated)] bg-[var(--color-surface)] py-3 px-4 text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors text-white"
            id="password"
            type="password"
            name="password"
            placeholder="••••••••"
            required
            minLength={6}
            defaultValue="admin123"
          />
        </div>
      </div>

      <button
        className="flex w-full min-h-[48px] items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:bg-[var(--color-primary-dark)] disabled:opacity-50 shadow-lg shadow-[rgba(196,30,58,0.3)]"
        aria-disabled={isPending}
        disabled={isPending}
      >
        {isPending ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Iniciando sesión...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Iniciar sesión <LogIn className="w-4 h-4" />
          </span>
        )}
      </button>

      {errorMessage && (
        <div
          className="flex h-8 items-end space-x-1"
          aria-live="polite"
          aria-atomic="true"
        >
          <AlertCircle className="h-5 w-5 text-[var(--color-danger)]" />
          <p className="text-sm text-[var(--color-danger)]">{errorMessage}</p>
        </div>
      )}
    </form>
  )
}
