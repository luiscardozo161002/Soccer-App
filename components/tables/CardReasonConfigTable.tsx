"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Check, X, Pencil, Power, PowerOff } from "lucide-react";
import {
  useCardReasonConfigs,
  useCreateCardReasonConfig,
  useUpdateCardReasonConfig,
  type CardReasonConfig,
} from "@/hooks/useCardReasonConfigs";
import type { CardType } from "@/hooks/useCards";
import { ApiError } from "@/lib/errors";
import { onlyDecimal } from "@/lib/utils/forms";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Pagination, DEFAULT_PAGE_SIZE, type PageSize } from "@/components/ui/pagination";
import { ActionsMenu } from "@/components/ui/actions-menu";

function ConfigRow({ config }: { config: CardReasonConfig }) {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(config.amount);
  const updateConfig = useUpdateCardReasonConfig();

  const save = () => {
    updateConfig.mutate(
      { id: config.id, amount: Number(amount) },
      {
        onSuccess: () => {
          toast.success("Precio actualizado");
          setIsEditing(false);
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el precio"),
      }
    );
  };

  const toggleActive = () => {
    updateConfig.mutate(
      { id: config.id, active: !config.active },
      {
        onSuccess: () => toast.success(config.active ? "Motivo desactivado" : "Motivo activado"),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el motivo"),
      }
    );
  };

  return (
    <tr>
      <Td>
        <Badge tone={config.cardType}>{config.cardType === "yellow" ? "Amarilla" : "Roja"}</Badge>
      </Td>
      <Td className="text-sm text-ink">{config.reason}</Td>
      <Td className="text-center">
        {isEditing ? (
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface pr-1 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(onlyDecimal(e.target.value))}
              className="w-16 bg-transparent px-2 py-1 text-center text-sm text-ink outline-none"
            />
            <button
              type="button"
              aria-label="Guardar precio"
              onClick={save}
              className="rounded p-0.5 text-primary hover:bg-primary-light"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              aria-label="Cancelar"
              onClick={() => {
                setAmount(config.amount);
                setIsEditing(false);
              }}
              className="rounded p-0.5 text-muted hover:bg-primary-light hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <span className="font-semibold text-ink">${config.amount}</span>
        )}
      </Td>
      <Td>
        <Badge tone={config.active ? "active" : "inactive"}>{config.active ? "Activo" : "Inactivo"}</Badge>
      </Td>
      <Td className="text-right">
        {!isEditing && (
          <div className="flex justify-end">
            <ActionsMenu
              label={`Acciones para ${config.reason}`}
              items={[
                { label: "Editar precio", icon: <Pencil size={15} />, onClick: () => setIsEditing(true) },
                config.active
                  ? { label: "Desactivar", icon: <PowerOff size={15} />, onClick: toggleActive }
                  : { label: "Activar", icon: <Power size={15} />, onClick: toggleActive },
              ]}
            />
          </div>
        )}
      </Td>
    </tr>
  );
}

export function CardReasonConfigTable() {
  const [cardTypeFilter, setCardTypeFilter] = useState<CardType | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const { data, isLoading, isError } = useCardReasonConfigs({
    cardType: cardTypeFilter || undefined,
    page,
    pageSize,
  });
  const configs = data?.data ?? [];
  const createConfig = useCreateCardReasonConfig();

  const [showCreate, setShowCreate] = useState(false);
  const [cardType, setCardType] = useState<CardType>("yellow");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");

  const submit = () => {
    if (!reason.trim()) {
      toast.error("Escribe el motivo");
      return;
    }
    createConfig.mutate(
      { cardType, reason: reason.trim(), amount: Number(amount) || 0, active: true },
      {
        onSuccess: () => {
          toast.success("Motivo agregado");
          setReason("");
          setAmount("");
          setShowCreate(false);
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo agregar el motivo"),
      }
    );
  };

  return (
    <>
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="w-48">
              <Field label="Tipo de tarjeta">
                <Select
                  value={cardTypeFilter}
                  onChange={(e) => {
                    setCardTypeFilter(e.target.value as CardType | "");
                    setPage(1);
                  }}
                >
                  <option value="">Todas</option>
                  <option value="yellow">Amarilla</option>
                  <option value="red">Roja</option>
                </Select>
              </Field>
            </div>
            <Button type="button" variant="secondary" onClick={() => setShowCreate((v) => !v)}>
              <Plus size={16} />
              Nuevo motivo
            </Button>
          </div>
        </CardBody>
      </Card>

      {showCreate && (
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-40">
                <Field label="Tarjeta">
                  <Select value={cardType} onChange={(e) => setCardType(e.target.value as CardType)}>
                    <option value="yellow">Amarilla</option>
                    <option value="red">Roja</option>
                  </Select>
                </Field>
              </div>
              <div className="w-64">
                <Field label="Motivo">
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} />
                </Field>
              </div>
              <div className="w-32">
                <Field label="Monto">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(onlyDecimal(e.target.value))}
                    placeholder="$"
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                  />
                </Field>
              </div>
              <Button type="button" onClick={submit} disabled={createConfig.isPending}>
                {createConfig.isPending ? "Guardando..." : "Agregar"}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Configuración de tarjetas"
          description="Precio vigente por tipo de tarjeta y motivo. Cambiar un precio aquí solo afecta tarjetas nuevas — las ya registradas conservan el monto con el que se emitieron."
        />
        <Table>
          <Thead>
            <Th>Tarjeta</Th>
            <Th>Motivo</Th>
            <Th className="text-center">Precio</Th>
            <Th>Estatus</Th>
            <Th className="text-right">Acciones</Th>
          </Thead>
          <Tbody>
            {isLoading && <EmptyRow colSpan={5} message="Cargando..." />}
            {isError && <EmptyRow colSpan={5} message="No se pudo cargar el catálogo." />}
            {!isLoading && !isError && configs.length === 0 && (
              <EmptyRow colSpan={5} message="Todavía no hay motivos configurados." />
            )}
            {configs.map((config) => (
              <ConfigRow key={config.id} config={config} />
            ))}
          </Tbody>
        </Table>
        <Pagination
          meta={data?.meta}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </Card>
    </>
  );
}
