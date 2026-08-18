"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExternalLink } from "lucide-react";
import { useForgotPassword } from "@/hooks/useAuth";
import { ApiError } from "@/lib/errors";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";

const schema = z.object({
  identifier: z.string().trim().min(1, "Ingresa tu usuario o correo"),
});
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [resetUrl, setResetUrl] = useState<string | null | undefined>(undefined);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    forgotPassword.mutate(values, {
      onSuccess: (res) => setResetUrl(res.data.resetUrl),
    });
  });

  return (
    <AuthShell backLink={{ href: "/login", label: "Volver a iniciar sesión" }}>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Recuperar contraseña</h1>
      <p className="mt-1 text-sm text-muted">Ingresa tu usuario o correo y te damos un enlace para restablecerla.</p>

      {resetUrl === undefined ? (
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <Field label="Usuario o correo" error={errors.identifier?.message}>
            <Input autoFocus {...register("identifier")} />
          </Field>
          <Button type="submit" disabled={forgotPassword.isPending} className="mt-2">
            {forgotPassword.isPending ? "Enviando..." : "Enviar enlace"}
          </Button>
          {forgotPassword.isError && (
            <p className="text-xs text-red-500">
              {forgotPassword.error instanceof ApiError
                ? forgotPassword.error.message
                : "No se pudo procesar la solicitud"}
            </p>
          )}
        </form>
      ) : resetUrl ? (
        <div className="mt-8 flex flex-col gap-3 rounded-xl border border-border bg-primary-light/30 p-4 text-sm">
          <p className="text-ink">
            Como todavía no hay un correo configurado para enviarlo automáticamente, aquí está tu enlace de
            restablecimiento (válido 30 minutos):
          </p>
          <Link
            href={resetUrl}
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline break-all"
          >
            {resetUrl} <ExternalLink size={13} className="shrink-0" />
          </Link>
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-border bg-primary-light/30 p-4 text-sm text-ink">
          Si esa cuenta existe, te enviamos un enlace de restablecimiento a su correo. Revisa tu bandeja de
          entrada (y spam).
        </p>
      )}
    </AuthShell>
  );
}
