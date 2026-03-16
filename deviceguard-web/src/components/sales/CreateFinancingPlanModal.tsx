"use client";

import { useState } from "react";
import { GenericModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { financingPlanService } from "@/services/financingPlan.service";
import { createFinancingPlanSchema } from "@/schemas/financingPlan.schema";
import { PaymentFrequency } from "@prisma/client";
import { PAYMENT_FREQUENCY_LABELS } from "@/constants/paymentFrequency.constant";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";

interface CreateFinancingPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateFinancingPlanModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateFinancingPlanModalProps) {
  const [name, setName] = useState("");
  const [installments, setInstallments] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(
    PaymentFrequency.MONTHLY
  );
  const [interestRate, setInterestRate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setName("");
    setInstallments("");
    setPaymentFrequency(PaymentFrequency.MONTHLY);
    setInterestRate("");
    setErrors({});
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const result = createFinancingPlanSchema.safeParse({
      name,
      installments: parseInt(installments),
      paymentFrequency,
      interestRate: parseFloat(interestRate),
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setLoading(true);
      await financingPlanService.create(result.data);
      clientSuccessHandler("Plan de financiamiento creado exitosamente");
      handleClose();
      onSuccess();
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GenericModal
      open={open}
      onOpenChange={handleClose}
      title="Nuevo Plan de Financiamiento"
      description="Crear un plan de financiamiento personalizado"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            className="bg-mahogany_red hover:bg-mahogany_red-600 text-white"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear Plan"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Plan</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: "" });
            }}
            placeholder="Ej: Plan 12 Meses"
            className={
              errors.name
                ? "border-destructive focus:border-destructive focus:ring-destructive"
                : ""
            }
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentFrequency">Frecuencia de Pago</Label>
          <select
            id="paymentFrequency"
            value={paymentFrequency}
            onChange={(e) =>
              setPaymentFrequency(e.target.value as PaymentFrequency)
            }
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
          >
            {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="installments">Número de Cuotas</Label>
          <Input
            id="installments"
            type="number"
            value={installments}
            onChange={(e) => {
              setInstallments(e.target.value);
              if (errors.installments)
                setErrors({ ...errors, installments: "" });
            }}
            placeholder="Ej: 12"
            className={
              errors.installments
                ? "border-destructive focus:border-destructive focus:ring-destructive"
                : ""
            }
          />
          {errors.installments && (
            <p className="text-xs text-destructive">{errors.installments}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="interestRate">Tasa de Interés (%)</Label>
          <Input
            id="interestRate"
            type="number"
            step="0.01"
            value={interestRate}
            onChange={(e) => {
              setInterestRate(e.target.value);
              if (errors.interestRate)
                setErrors({ ...errors, interestRate: "" });
            }}
            placeholder="Ej: 2.5"
            className={
              errors.interestRate
                ? "border-destructive focus:border-destructive focus:ring-destructive"
                : ""
            }
          />
          {errors.interestRate && (
            <p className="text-xs text-destructive">{errors.interestRate}</p>
          )}
        </div>
      </div>
    </GenericModal>
  );
}
