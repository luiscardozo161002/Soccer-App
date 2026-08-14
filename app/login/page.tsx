"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useLogin } from "@/hooks/useAuth";
import { ApiError } from "@/lib/errors";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Ingresa tu usuario o correo"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
type LoginForm = z.infer<typeof loginSchema>;

function LoginFormCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        toast.success("Bienvenido");
        router.push(searchParams.get("next") || "/admin");
        router.refresh();
      },
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo iniciar sesión"),
    });
  });

  return (
    <Card className="w-full max-w-sm">
      <CardBody>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-muted">Portal de gestión de la liga.</p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
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
      </CardBody>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={null}>
        <LoginFormCard />
      </Suspense>
    </div>
  );
}
