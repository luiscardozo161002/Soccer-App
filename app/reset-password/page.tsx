"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { useResetPassword } from "@/hooks/useAuth";
import { ApiError } from "@/lib/errors";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";

const schema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
type Form = z.infer<typeof schema>;

function ResetPasswordFormCard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const resetPassword = useResetPassword();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    resetPassword.mutate(
      { token, password: values.password },
      {
        onSuccess: () => setDone(true),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo restablecer la contraseña"),
      }
    );
  });

  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardBody>
          <p className="text-sm text-ink">
            Este enlace no es válido. Solicita uno nuevo desde{" "}
            <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
              recuperar contraseña
            </Link>
            .
          </p>
        </CardBody>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="text-primary" size={32} />
          <p className="text-sm text-ink">Tu contraseña se actualizó correctamente.</p>
          <Button onClick={() => router.push("/login")}>Iniciar sesión</Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardBody>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">Nueva contraseña</h1>
        <p className="mt-1 text-sm text-muted">Elige una nueva contraseña para tu cuenta.</p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <Field label="Nueva contraseña" error={errors.password?.message}>
            <PasswordInput autoFocus {...register("password")} />
          </Field>
          <Field label="Confirmar contraseña" error={errors.confirmPassword?.message}>
            <PasswordInput {...register("confirmPassword")} />
          </Field>
          <Button type="submit" disabled={resetPassword.isPending} className="mt-2">
            {resetPassword.isPending ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense fallback={null}>
        <ResetPasswordFormCard />
      </Suspense>
    </div>
  );
}
