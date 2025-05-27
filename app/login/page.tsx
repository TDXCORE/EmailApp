import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Login - Email Marketing App",
  description: "Inicia sesión en tu cuenta",
}

export default function LoginPage() {
  return <LoginForm />
}
