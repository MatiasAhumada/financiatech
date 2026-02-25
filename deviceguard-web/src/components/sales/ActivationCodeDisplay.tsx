"use client";

import { Label } from "@/components/ui/label";
import { ShoppingCart01Icon } from "hugeicons-react";
import { SALES_MESSAGES } from "@/constants/sales.constant";
import { useActivationPolling } from "@/hooks/useActivationPolling";
import { ActivationSuccessView } from "@/components/sales/ActivationSuccessView";

interface ActivationCodeDisplayProps {
  activationCode: string;
}

/**
 * Componente orquestador del paso 3 del SaleModal.
 *
 * SRP: consume useActivationPolling y decide qué vista renderizar.
 * No contiene lógica asincrónica ni de fetch — eso es responsabilidad del hook.
 *
 * Estados:
 *  - "waiting" → muestra el código con animación de espera (ActivationWaitingView inline)
 *  - "success" → muestra ActivationSuccessView con el nombre del dispositivo vinculado
 */
export function ActivationCodeDisplay({
  activationCode,
}: ActivationCodeDisplayProps) {
  const { status, deviceName } = useActivationPolling(activationCode);

  // Estado de éxito: el celular ya se vinculó
  if (status === "success") {
    return <ActivationSuccessView deviceName={deviceName} />;
  }

  // Estado de espera: mostrar el código con animación de "esperando vinculación"
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="relative w-20 h-20 mx-auto">
          {/* Anillo pulsante exterior indicando espera activa */}
          <span className="absolute inset-0 rounded-full bg-mahogany_red/30 animate-ping" />
          <div className="relative w-20 h-20 bg-mahogany_red/10 border-2 border-mahogany_red rounded-full flex items-center justify-center">
            <ShoppingCart01Icon size={36} className="text-mahogany_red" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white">
            {SALES_MESSAGES.INFO.SUCCESS_TITLE}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mahogany_red animate-pulse" />
            <p className="text-silver-400 text-sm">
              Esperando vinculación del dispositivo...
            </p>
          </div>
        </div>
      </div>

      {/* Código de activación con borde pulsante */}
      <div className="border border-mahogany_red rounded-lg p-6 bg-mahogany_red/5 relative overflow-hidden">
        {/* Línea de escaneo animada */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-mahogany_red to-transparent animate-pulse" />

        <Label className="text-white text-sm uppercase mb-2 block">
          {SALES_MESSAGES.LABELS.ACTIVATION_CODE}
        </Label>
        <div className="bg-carbon_black rounded-lg p-6 text-center ring-1 ring-mahogany_red/40">
          <p className="text-5xl font-bold text-mahogany_red tracking-widest font-mono">
            {activationCode}
          </p>
        </div>
        <p className="text-xs text-silver-400 mt-4 text-center">
          {SALES_MESSAGES.INFO.ACTIVATION_INSTRUCTIONS}
        </p>
      </div>

      {/* Instrucciones para el cliente */}
      <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black space-y-3">
        <h4 className="text-white font-medium">
          {SALES_MESSAGES.INFO.CLIENT_INSTRUCTIONS_TITLE}
        </h4>
        <ol className="text-sm text-silver-400 space-y-2 list-decimal list-inside">
          {SALES_MESSAGES.CLIENT_INSTRUCTIONS.map((instruction, i) => (
            <li key={i}>{instruction}</li>
          ))}
        </ol>
      </div>

      {/* Aviso importante */}
      <div className="border border-warning/50 rounded-lg p-4 bg-warning/5">
        <div className="flex items-start gap-2">
          <ShoppingCart01Icon size={20} className="text-warning mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm text-white font-medium">
              {SALES_MESSAGES.INFO.IMPORTANT_TITLE}
            </p>
            <p className="text-sm text-silver-400 mt-1">
              {SALES_MESSAGES.INFO.IMPORTANT_MESSAGE}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
