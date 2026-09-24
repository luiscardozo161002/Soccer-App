"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useLogin } from "@/modules/auth/hooks/useAuth";
import { loginSchema, type LoginDto } from "@/modules/auth/auth.schema";
import { ApiError } from "@/lib/errors";
import { Field, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";

function safeNextPath(next: string | null) {
  if (!next) return "/admin";
  if (!next.startsWith("/") || next.startsWith("//")) return "/admin";
  return next;
}

function LoginFormCard() {
  const searchParams = useSearchParams();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        toast.success("Bienvenido");
        window.location.href = safeNextPath(searchParams.get("next"));
      },
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo iniciar sesión"),
    });
  });

  return (
    <AuthShell backLink={{ href: "/", label: "Volver al sitio público" }}>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-muted">Ingresa tus datos para continuar.</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <Field label="Usuario o correo" error={errors.username?.message}>
          <Input autoFocus {...register("username")} />
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <PasswordInput {...register("password")} />
        </Field>
        <Button type="submit" disabled={login.isPending} className="mt-2">
          {login.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <Link
        href="/forgot-password"
        className="mt-4 block text-center text-sm font-semibold text-primary hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </Link>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">Cargando acceso...</p>}>
      <LoginFormCard />
    </Suspense>
  );
}
