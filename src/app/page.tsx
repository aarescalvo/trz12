import { redirect } from 'next/navigation'

// ============================================================
// ROOT PAGE — Redirige al dashboard
// La autenticación se maneja en (app)/layout.tsx
// ============================================================

export default function RootPage() {
  redirect('/dashboard')
}
