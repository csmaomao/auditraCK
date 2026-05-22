import { redirect } from 'next/navigation'

// Root route — redirect to dashboard (middleware handles auth check)
export default function RootPage() {
  redirect('/dashboard')
}
