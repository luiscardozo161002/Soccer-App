"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { useMe } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";

export default function NotFound() {
  const { data: me, isLoading } = useMe();
  const homeHref = me?.data ? "/admin" : "/";

  return (
    <AuthShell backLink={{ href: homeHref, label: me?.data ? "Volver al panel" : "Volver al sitio público" }}>
      <p className="text-6xl font-black tracking-tight text-primary">404</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">Página no encontrada</h1>
      <p className="mt-1 text-sm text-muted">La página que buscas no existe o fue movida.</p>

      {!isLoading && (
        <Link href={homeHref} className="mt-8 inline-block">
          <Button variant="primary">
            <Home size={16} />
            {me?.data ? "Volver al panel" : "Volver al inicio"}
          </Button>
        </Link>
      )}
    </AuthShell>
  );
}
