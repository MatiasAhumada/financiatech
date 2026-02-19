"use client";

import { useState, useEffect } from "react";
import { GenericModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saleService } from "@/services/sale.service";
import { financingPlanService } from "@/services/financingPlan.service";
import { IDevice, IClient, IFinancingPlan, ISale } from "@/types";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";
import { ShoppingCart01Icon } from "hugeicons-react";
import { financingUtils } from "@/utils/financing.util";

import { CreateFinancingPlanModal } from "@/components/sales/CreateFinancingPlanModal";

interface SaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: IDevice[];
  clients: IClient[];
  financingPlans: IFinancingPlan[];
  onSuccess: () => void;
  initialSale?: ISale | null;
}

export function SaleModal({
  open,
  onOpenChange,
  devices,
  clients,
  financingPlans,
  onSuccess,
  initialSale,
}: SaleModalProps) {
  const [step, setStep] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [amount, setAmount] = useState("");
  const [initialPayment, setInitialPayment] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<IFinancingPlan | null>(null);
  const [firstWarningDay, setFirstWarningDay] = useState("3");
  const [secondWarningDay, setSecondWarningDay] = useState("5");
  const [blockDay, setBlockDay] = useState("7");
  const [loading, setLoading] = useState(false);
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [activationCode, setActivationCode] = useState("");

  useEffect(() => {
    if (open && initialSale) {
      setSelectedDevice(initialSale.deviceId);
      setSelectedClient(initialSale.clientId);
      setAmount(initialSale.totalAmount.toString());
      setInitialPayment(initialSale.initialPayment.toString());

      const plan = financingPlans.find(
        (p) => p.installments === initialSale.installments
      );
      
      if (plan) setSelectedPlan(plan);

      setStep(1);
    }
  }, [open, initialSale, financingPlans]);

  const activeDevices = devices;

  const handleClose = () => {
    setStep(1);
    setSelectedDevice("");
    setSelectedClient("");
    setAmount("");
    setInitialPayment("");
    setSelectedPlan(null);
    setFirstWarningDay("3");
    setSecondWarningDay("5");
    setBlockDay("7");
    setActivationCode("");
    onOpenChange(false);
  };

  const handleNext = () => {
    if (step === 1 && selectedDevice && selectedClient && amount) {
      setStep(2);
    } else if (
      step === 2 &&
      selectedPlan &&
      initialPayment &&
      firstWarningDay &&
      secondWarningDay &&
      blockDay
    ) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedDevice || !selectedClient || !amount || !selectedPlan) return;

    try {
      setLoading(true);
      
      if (initialSale) {
        await saleService.update(initialSale.id, {
          deviceId: selectedDevice,
          clientId: selectedClient,
          totalAmount: parseFloat(amount),
          initialPayment: parseFloat(initialPayment),
          installments: selectedPlan.installments,
          financingPlanId: selectedPlan.id,
          firstWarningDay: parseInt(firstWarningDay),
          secondWarningDay: parseInt(secondWarningDay),
          blockDay: parseInt(blockDay),
        });
        clientSuccessHandler("Venta actualizada exitosamente");
        handleClose();
        onSuccess();
      } else {
        const result = await saleService.create({
          deviceId: selectedDevice,
          clientId: selectedClient,
          totalAmount: parseFloat(amount),
          initialPayment: parseFloat(initialPayment),
          installments: selectedPlan.installments,
          financingPlanId: selectedPlan.id,
          firstWarningDay: parseInt(firstWarningDay),
          secondWarningDay: parseInt(secondWarningDay),
          blockDay: parseInt(blockDay),
        });
        setActivationCode(result.activationCode);
        clientSuccessHandler("Venta registrada exitosamente");
        setStep(3);
      }
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  const amountValue = parseFloat(amount || "0");
  const initialPaymentValue = parseFloat(initialPayment || "0");
  const financedAmount = financingUtils.calculateFinancedAmount(
    amountValue,
    initialPaymentValue
  );
  const interestRate = selectedPlan ? Number(selectedPlan.interestRate) : 0;
  const totalWithInterest = financingUtils.calculateTotalWithInterest(
    financedAmount,
    interestRate
  );
  const monthlyPayment = selectedPlan
    ? financingUtils.calculateMonthlyPayment(
        totalWithInterest,
        selectedPlan.installments
      )
    : 0;

  return (
    <GenericModal
      open={open}
      onOpenChange={handleClose}
      title="REGISTRO DE VENTA"
      description="Configuración de financiamiento rápido"
      size="4xl"
      variant="dark"
      footer={
        step === 1 ? (
          <>
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-carbon_black-600 text-white hover:bg-carbon_black-700"
            >
              CANCELAR
            </Button>
            <Button
              className="bg-mahogany_red hover:bg-mahogany_red-600 text-white"
              onClick={handleNext}
              disabled={!selectedDevice || !selectedClient || !amount}
            >
              SIGUIENTE PASO
            </Button>
          </>
        ) : step === 2 ? (
          <>
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-carbon_black-600 text-white hover:bg-carbon_black-700"
            >
              ATRÁS
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-carbon_black-600 text-white hover:bg-carbon_black-700"
            >
              CANCELAR
            </Button>
            <Button
              className="bg-mahogany_red hover:bg-mahogany_red-600 text-white"
              onClick={handleSubmit}
              disabled={
                !selectedPlan ||
                !initialPayment ||
                !firstWarningDay ||
                !secondWarningDay ||
                !blockDay ||
                loading
              }
            >
              {loading ? "PROCESANDO..." : "REGISTRAR VENTA"}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-carbon_black-600 text-white hover:bg-carbon_black-700"
            >
              CERRAR
            </Button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                1
              </div>
              <p className="text-xs text-mahogany_red mt-2 uppercase">
                DISPOSITIVO
              </p>
            </div>
            <div className="w-24 h-0.5 bg-carbon_black-600" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-carbon_black-600 flex items-center justify-center text-silver-400 font-bold">
                2
              </div>
              <p className="text-xs text-silver-400 mt-2 uppercase">
                FINANCIACIÓN
              </p>
            </div>
            <div className="w-24 h-0.5 bg-carbon_black-600" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-carbon_black-600 flex items-center justify-center text-silver-400 font-bold">
                3
              </div>
              <p className="text-xs text-silver-400 mt-2 uppercase">
                VINCULACIÓN
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device" className="text-white">
              DISPOSITIVO
            </Label>
            <select
              id="device"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-carbon_black-600 bg-carbon_black text-white text-sm"
            >
              <option value="">Seleccione un dispositivo...</option>
              {activeDevices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} - {device.model || "Sin modelo"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client" className="text-white">
              CLIENTE
            </Label>
            <select
              id="client"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-carbon_black-600 bg-carbon_black text-white text-sm"
            >
              <option value="">Seleccione un cliente...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white">
              VALOR DEL EQUIPO
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mahogany_red text-lg">
                $
              </span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8 text-lg bg-carbon_black border-carbon_black-600 text-white"
              />
            </div>
          </div>
        </div>
      ) : step === 2 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                1
              </div>
              <p className="text-xs text-white mt-2 uppercase">DISPOSITIVO</p>
            </div>
            <div className="w-24 h-0.5 bg-mahogany_red" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                2
              </div>
              <p className="text-xs text-mahogany_red mt-2 uppercase">
                FINANCIACIÓN
              </p>
            </div>
            <div className="w-24 h-0.5 bg-carbon_black-600" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-carbon_black-600 flex items-center justify-center text-silver-400 font-bold">
                3
              </div>
              <p className="text-xs text-silver-400 mt-2 uppercase">
                VINCULACIÓN
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border border-mahogany_red rounded-lg p-6">
                <Label className="text-silver-400 text-xs uppercase">
                  PRECIO DISPOSITIVO
                </Label>
                <p className="text-5xl font-bold text-white mt-2">
                  $ {amountValue.toFixed(2)}
                </p>
                <p className="text-xs text-silver-400 italic mt-2">
                  {devices.find((d) => d.id === selectedDevice)?.name || ""}
                </p>
              </div>
              <div className="border border-carbon_black-600 rounded-lg p-6 bg-carbon_black">
                <Label className="text-silver-400 text-xs uppercase">
                  ENTREGA INICIAL
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mahogany_red text-2xl">
                    $
                  </span>
                  <Input
                    type="number"
                    value={initialPayment}
                    onChange={(e) => setInitialPayment(e.target.value)}
                    placeholder="0.00"
                    className="pl-10 text-3xl font-bold bg-onyx-600 border-carbon_black-700 text-white h-16"
                  />
                </div>
              </div>

              <div className="border border-carbon_black-600 rounded-lg p-6 bg-carbon_black">
                <Label className="text-silver-400 text-xs uppercase">
                  MONTO A FINANCIAR
                </Label>
                <p className="text-5xl font-bold text-white mt-2">
                  $ {financedAmount.toFixed(2)}
                </p>
                <p className="text-xs text-silver-400 mt-2">
                  Precio - Entrega inicial
                </p>
              </div>

              <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart01Icon
                      size={20}
                      className="text-mahogany_red"
                    />
                    <Label className="text-white uppercase">
                      PLAN DE FINANCIAMIENTO
                    </Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatePlanModalOpen(true)}
                    className="text-xs border-mahogany_red text-mahogany_red hover:bg-mahogany_red/10"
                  >
                    + Crear Plan
                  </Button>
                </div>

                {financingPlans.map((plan) => {
                  const planTotal =
                    financedAmount * (1 + Number(plan.interestRate) / 100);
                  const planMonthly = planTotal / plan.installments;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full p-4 border rounded-lg mb-2 text-left transition-colors ${
                        selectedPlan?.id === plan.id
                          ? "border-mahogany_red bg-mahogany_red/10"
                          : "border-carbon_black-600 hover:border-mahogany_red/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium text-lg">
                            {plan.installments} Meses
                            {plan.installments === 12 && " (Recomendado)"}
                          </p>
                          <p className="text-sm text-silver-400">
                            Interés: {Number(plan.interestRate)}% total
                          </p>
                        </div>
                        <p className="text-mahogany_red font-bold text-xl">
                          ${planMonthly.toFixed(2)}/mes
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-carbon_black-600 rounded-lg p-6 bg-carbon_black">
                <Label className="text-silver-400 text-xs uppercase">
                  TOTAL A PAGAR
                </Label>
                <p className="text-5xl font-bold text-white mt-2">
                  ${(totalWithInterest + initialPaymentValue).toFixed(2)}
                </p>
                <p className="text-sm text-mahogany_red mt-1">
                  +{interestRate}% INTERÉS
                </p>
              </div>

              <div className="border border-carbon_black-600 rounded-lg p-6 bg-carbon_black">
                <Label className="text-silver-400 text-xs uppercase">
                  CUOTA MENSUAL
                </Label>
                <p className="text-3xl font-bold text-white mt-2">
                  ${monthlyPayment.toFixed(2)}
                </p>
                <p className="text-xs text-silver-400 mt-1">
                  {selectedPlan?.installments || 0} cuotas
                </p>
              </div>

              <div className="border border-mahogany_red/50 rounded-lg p-4 bg-mahogany_red/5">
                <div className="flex items-start gap-2">
                  <ShoppingCart01Icon
                    size={20}
                    className="text-mahogany_red mt-1"
                  />
                  <div>
                    <p className="text-sm text-white">
                      El dispositivo quedará bloqueado automáticamente vía{" "}
                      <span className="text-mahogany_red font-bold">
                        DeviceGuard MDM
                      </span>{" "}
                      en caso de mora superior a 72 horas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black">
                <Label className="text-white uppercase mb-3 block">
                  REGLAS DE BLOQUEO
                </Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-silver-400 text-xs">
                      1RA NOTIFICACIÓN (DÍA DEL MES)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={firstWarningDay}
                      onChange={(e) => setFirstWarningDay(e.target.value)}
                      className="mt-1 bg-onyx-600 border-carbon_black-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-silver-400 text-xs">
                      2DA NOTIFICACIÓN (DÍA DEL MES)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={secondWarningDay}
                      onChange={(e) => setSecondWarningDay(e.target.value)}
                      className="mt-1 bg-onyx-600 border-carbon_black-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-silver-400 text-xs">
                      BLOQUEO AUTOMÁTICO (DÍA DEL MES)
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={blockDay}
                      onChange={(e) => setBlockDay(e.target.value)}
                      className="mt-1 bg-onyx-600 border-carbon_black-700 text-white"
                    />
                  </div>
                  <p className="text-xs text-silver-400 italic">
                    Ejemplo: Si configuras día 10, 15 y 20, el sistema enviará
                    notificaciones los días 10 y 15 de cada mes, y bloqueará el
                    dispositivo el día 20.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <p className="text-xs text-white mt-2 uppercase">DISPOSITIVO</p>
            </div>
            <div className="w-24 h-0.5 bg-mahogany_red" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <p className="text-xs text-white mt-2 uppercase">FINANCIACIÓN</p>
            </div>
            <div className="w-24 h-0.5 bg-mahogany_red" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                3
              </div>
              <p className="text-xs text-mahogany_red mt-2 uppercase">
                VINCULACIÓN
              </p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart01Icon size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">
              ¡Venta Registrada Exitosamente!
            </h3>
            <p className="text-silver-400">
              Ahora debe vincular el dispositivo con la aplicación móvil
            </p>
          </div>

          <div className="border border-mahogany_red rounded-lg p-6 bg-mahogany_red/5">
            <Label className="text-white text-sm uppercase mb-2 block">
              CÓDIGO DE ACTIVACIÓN
            </Label>
            <div className="bg-carbon_black rounded-lg p-6 text-center">
              <p className="text-5xl font-bold text-mahogany_red tracking-widest">
                {activationCode}
              </p>
            </div>
            <p className="text-xs text-silver-400 mt-4 text-center">
              El cliente debe ingresar este código en la aplicación móvil
              DeviceGuard para vincular el dispositivo
            </p>
          </div>

          <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black space-y-3">
            <h4 className="text-white font-medium">
              Instrucciones para el cliente:
            </h4>
            <ol className="text-sm text-silver-400 space-y-2 list-decimal list-inside">
              <li>Descargar la app DeviceGuard desde Play Store o App Store</li>
              <li>Abrir la aplicación e ingresar el código de activación</li>
              <li>
                Seguir las instrucciones en pantalla para completar la
                vinculación
              </li>
              <li>Una vez vinculado, el dispositivo quedará bajo monitoreo</li>
            </ol>
          </div>

          <div className="border border-warning/50 rounded-lg p-4 bg-warning/5">
            <div className="flex items-start gap-2">
              <ShoppingCart01Icon size={20} className="text-warning mt-1" />
              <div>
                <p className="text-sm text-white font-medium">Importante:</p>
                <p className="text-sm text-silver-400 mt-1">
                  La venta se completará automáticamente cuando el cliente
                  vincule el dispositivo. El sistema comenzará a monitorear los
                  pagos según el plan configurado.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <CreateFinancingPlanModal
        open={isCreatePlanModalOpen}
        onOpenChange={setIsCreatePlanModalOpen}
        onSuccess={async () => {
          const plansData = await financingPlanService.getAll();
          financingPlans.splice(0, financingPlans.length, ...plansData);
        }}
      />
    </GenericModal>
  );
}
