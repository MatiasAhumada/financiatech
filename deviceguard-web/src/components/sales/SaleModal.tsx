"use client";

import { useState, useEffect } from "react";
import { GenericModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { financingPlanService } from "@/services/financingPlan.service";
import { deviceService } from "@/services/device.service";
import { clientService } from "@/services/client.service";
import { IDevice, IClient, IFinancingPlan, ISale } from "@/types";
import { SALES_MESSAGES } from "@/constants/sales.constant";
import { PAYMENT_FREQUENCY_LABELS } from "@/constants/paymentFrequency.constant";
import { financingUtils } from "@/utils/financing.util";
import { salesUtils } from "@/utils/sales.util";
import { ShoppingCart01Icon } from "hugeicons-react";
import { CreateFinancingPlanModal } from "@/components/sales/CreateFinancingPlanModal";
import { CreateDeviceModal } from "@/components/sales/CreateDeviceModal";
import { CreateClientModal } from "@/components/sales/CreateClientModal";
import { StepIndicator } from "@/components/sales/StepIndicator";
import { DeviceSelectionStep } from "@/components/sales/DeviceSelectionStep";
import { FinancingPlanCard } from "@/components/sales/FinancingPlanCard";
import { BlockRulesInput } from "@/components/sales/BlockRulesInput";
import { ActivationCodeDisplay } from "@/components/sales/ActivationCodeDisplay";
import { useSaleForm } from "@/hooks/useSaleForm";

interface SaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: IDevice[];
  clients: IClient[];
  financingPlans: IFinancingPlan[];
  onSuccess: () => void;
  onPlansUpdate: (plans: IFinancingPlan[]) => void;
  initialSale?: ISale | null;
}

export function SaleModal({
  open,
  onOpenChange,
  devices,
  clients,
  financingPlans,
  onSuccess,
  onPlansUpdate,
  initialSale,
}: SaleModalProps) {
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [isCreateDeviceModalOpen, setIsCreateDeviceModalOpen] = useState(false);
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
  const [localDevices, setLocalDevices] = useState<IDevice[]>(devices);
  const [localClients, setLocalClients] = useState<IClient[]>(clients);

  useEffect(() => {
    setLocalDevices(devices);
    setLocalClients(clients);
  }, [devices, clients]);

  const handleDeviceCreated = async () => {
    const updatedDevices = await deviceService.getAll();
    setLocalDevices(updatedDevices);
  };

  const handleClientCreated = async () => {
    const updatedClients = await clientService.getAll();
    setLocalClients(updatedClients);
  };

  const {
    step,
    selectedDevice,
    setSelectedDevice,
    selectedClient,
    setSelectedClient,
    amount,
    setAmount,
    initialPayment,
    setInitialPayment,
    selectedPlan,
    setSelectedPlan,
    firstWarningDay,
    setFirstWarningDay,
    secondWarningDay,
    setSecondWarningDay,
    blockDay,
    setBlockDay,
    loading,
    activationCode,
    handleClose,
    handleNext,
    handleBack,
    handleSubmit,
    canProceedStep1,
    canProceedStep2,
  } = useSaleForm({
    open,
    initialSale,
    financingPlans,
    onSuccess,
    onClose: () => onOpenChange(false),
  });

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

  const renderFooter = () => {
    if (step === 1) {
      return (
        <>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-carbon_black-600 text-white hover:bg-carbon_black-700"
          >
            {SALES_MESSAGES.BUTTONS.CANCEL}
          </Button>
          <Button
            className="bg-mahogany_red hover:bg-mahogany_red-600 text-white"
            onClick={handleNext}
            disabled={!canProceedStep1}
          >
            {SALES_MESSAGES.BUTTONS.NEXT}
          </Button>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-carbon_black-600 text-white hover:bg-carbon_black-700"
          >
            {SALES_MESSAGES.BUTTONS.BACK}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-carbon_black-600 text-white hover:bg-carbon_black-700"
          >
            {SALES_MESSAGES.BUTTONS.CANCEL}
          </Button>
          <Button
            className="bg-mahogany_red hover:bg-mahogany_red-600 text-white"
            onClick={handleSubmit}
            disabled={!canProceedStep2}
          >
            {loading
              ? SALES_MESSAGES.BUTTONS.PROCESSING
              : SALES_MESSAGES.BUTTONS.REGISTER}
          </Button>
        </>
      );
    }

    return (
      <Button
        variant="outline"
        onClick={handleClose}
        className="border-carbon_black-600 text-white hover:bg-carbon_black-700"
      >
        {SALES_MESSAGES.BUTTONS.CLOSE}
      </Button>
    );
  };

  return (
    <GenericModal
      open={open}
      onOpenChange={handleClose}
      title="REGISTRO DE VENTA"
      description="Configuración de financiamiento rápido"
      size="4xl"
      variant="dark"
      footer={renderFooter()}
    >
      <StepIndicator
        currentStep={step}
        steps={[
          SALES_MESSAGES.STEPS.DEVICE,
          SALES_MESSAGES.STEPS.FINANCING,
          SALES_MESSAGES.STEPS.LINKING,
        ]}
      />

      {step === 1 && (
        <DeviceSelectionStep
          devices={localDevices}
          clients={localClients}
          selectedDevice={selectedDevice}
          selectedClient={selectedClient}
          amount={amount}
          onDeviceChange={setSelectedDevice}
          onClientChange={setSelectedClient}
          onAmountChange={setAmount}
          onCreateDevice={() => setIsCreateDeviceModalOpen(true)}
          onCreateClient={() => setIsCreateClientModalOpen(true)}
        />
      )}

      {step === 2 && (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="border border-mahogany_red rounded-lg p-6">
              <Label className="text-silver-400 text-xs uppercase">
                {SALES_MESSAGES.LABELS.DEVICE_PRICE}
              </Label>
              <p className="text-5xl font-bold text-white mt-2">
                {salesUtils.formatCurrency(amountValue)}
              </p>
              <p className="text-xs text-silver-400 italic mt-2">
                {localDevices.find((d) => d.id === selectedDevice)?.name || ""}
              </p>
            </div>

            <div className="border border-carbon_black-600 rounded-lg p-6 bg-carbon_black">
              <Label className="text-silver-400 text-xs uppercase">
                {SALES_MESSAGES.LABELS.INITIAL_PAYMENT}
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mahogany_red text-2xl">
                  $
                </span>
                <Input
                  type="number"
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                  placeholder={SALES_MESSAGES.PLACEHOLDERS.AMOUNT}
                  className="pl-10 text-3xl font-bold bg-onyx-600 border-carbon_black-700 text-white h-16"
                />
              </div>
            </div>

            <div className="border border-carbon_black-600 rounded-lg p-6 bg-carbon_black">
              <Label className="text-silver-400 text-xs uppercase">
                {SALES_MESSAGES.LABELS.FINANCED_AMOUNT}
              </Label>
              <p className="text-5xl font-bold text-white mt-2">
                {salesUtils.formatCurrency(financedAmount)}
              </p>
              <p className="text-xs text-silver-400 mt-2">
                Precio - Entrega inicial
              </p>
            </div>

            <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart01Icon size={20} className="text-mahogany_red" />
                  <Label className="text-white uppercase">
                    {SALES_MESSAGES.LABELS.FINANCING_PLAN}
                  </Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatePlanModalOpen(true)}
                  className="text-xs border-mahogany_red text-mahogany_red hover:bg-mahogany_red/10"
                >
                  {SALES_MESSAGES.BUTTONS.CREATE_PLAN}
                </Button>
              </div>

              {financingPlans.map((plan) => (
                <FinancingPlanCard
                  key={plan.id}
                  plan={plan}
                  financedAmount={financedAmount}
                  isSelected={selectedPlan?.id === plan.id}
                  onSelect={() => setSelectedPlan(plan)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-carbon_black-600 rounded-lg p-6 bg-carbon_black">
              <Label className="text-silver-400 text-xs uppercase">
                {SALES_MESSAGES.LABELS.TOTAL_TO_PAY}
              </Label>
              <p className="text-5xl font-bold text-white mt-2">
                {salesUtils.formatCurrency(
                  totalWithInterest + initialPaymentValue
                )}
              </p>
              <p className="text-sm text-mahogany_red mt-1">
                +{interestRate}% INTERÉS
              </p>
            </div>

            <div className="border border-carbon_black-600 rounded-lg p-6 bg-carbon_black">
              <Label className="text-silver-400 text-xs uppercase">
                {SALES_MESSAGES.LABELS.INSTALLMENT_PAYMENT}
              </Label>
              <p className="text-3xl font-bold text-white mt-2">
                {salesUtils.formatCurrency(monthlyPayment)}
              </p>
              <p className="text-xs text-silver-400 mt-1">
                {selectedPlan?.installments || 0} cuotas{" "}
                {selectedPlan &&
                  PAYMENT_FREQUENCY_LABELS[
                    selectedPlan.paymentFrequency
                  ].toLowerCase()}
              </p>
            </div>

            <BlockRulesInput
              firstWarningDay={firstWarningDay}
              secondWarningDay={secondWarningDay}
              blockDay={blockDay}
              onFirstWarningChange={setFirstWarningDay}
              onSecondWarningChange={setSecondWarningDay}
              onBlockDayChange={setBlockDay}
            />
          </div>
        </div>
      )}

      {step === 3 && <ActivationCodeDisplay activationCode={activationCode} />}

      <CreateFinancingPlanModal
        open={isCreatePlanModalOpen}
        onOpenChange={setIsCreatePlanModalOpen}
        onSuccess={async () => {
          const plansData = await financingPlanService.getAll();
          onPlansUpdate(plansData);
        }}
      />

      <CreateDeviceModal
        open={isCreateDeviceModalOpen}
        onOpenChange={setIsCreateDeviceModalOpen}
        onSuccess={handleDeviceCreated}
      />

      <CreateClientModal
        open={isCreateClientModalOpen}
        onOpenChange={setIsCreateClientModalOpen}
        onSuccess={handleClientCreated}
      />
    </GenericModal>
  );
}
