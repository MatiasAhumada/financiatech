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
import { StepIndicator } from "@/components/sales/StepIndicator";
import { MultiDeviceSelectionStep } from "@/components/sales/MultiDeviceSelectionStep";
import { FinancingPlanCard } from "@/components/sales/FinancingPlanCard";
import { BlockRulesInput } from "@/components/sales/BlockRulesInput";
import { MultiActivationStatus } from "@/components/sales/MultiActivationStatus";
import { ActivationSuccessView } from "@/components/sales/ActivationSuccessView";
import { useSaleForm } from "@/hooks/useSaleForm";
import { motion, AnimatePresence } from "framer-motion";
import { DeviceModal } from "@/components/entities/DeviceModal";
import { ClientModal } from "@/components/entities/ClientModal";

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
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "right"
  );
  const [linkingProgress, setLinkingProgress] = useState({
    linked: 0,
    total: 0,
  });
  const [allLinked, setAllLinked] = useState(false);
  const [linkedDevices, setLinkedDevices] = useState<
    Array<{ deviceId: string; deviceName: string }>
  >([]);

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
    selectedDevices,
    setSelectedDevices,
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
    deviceCount,
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

  useEffect(() => {
    if (step === 3 && deviceCount > 0) {
      setLinkingProgress({ linked: 0, total: deviceCount });
    }
  }, [step, deviceCount]);

  const handleNextWithDirection = () => {
    setSlideDirection("right");
    handleNext();
  };

  const handleBackWithDirection = () => {
    setSlideDirection("left");
    handleBack();
  };

  const amountValue = parseFloat(
    salesUtils.parseFormattedNumber(amount || "0")
  );
  const initialPaymentValue = parseFloat(
    salesUtils.parseFormattedNumber(initialPayment || "0")
  );
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

  const slideVariants = {
    enter: (direction: "left" | "right") => ({
      x: direction === "right" ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: "left" | "right") => ({
      x: direction === "right" ? -300 : 300,
      opacity: 0,
    }),
  };

  const deviceNames = selectedDevices
    .map((sd) => {
      const device = localDevices.find((d) => d.id === sd.deviceId);
      return device;
    })
    .filter((d): d is IDevice => d !== undefined);

  const handleAllLinked = () => {
    setAllLinked(true);
  };

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
          <Button onClick={handleNextWithDirection} disabled={!canProceedStep1}>
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
            onClick={handleBackWithDirection}
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
          <Button onClick={handleSubmit} disabled={!canProceedStep2}>
            {loading
              ? SALES_MESSAGES.BUTTONS.PROCESSING
              : SALES_MESSAGES.BUTTONS.REGISTER}
          </Button>
        </>
      );
    }

    if (step === 3 && !allLinked) {
      return (
        <Button
          variant="outline"
          onClick={handleClose}
          disabled
          className="border-carbon_black-600 text-silver-400 cursor-not-allowed"
        >
          Esperando vinculación...
        </Button>
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
        deviceProgress={
          step === 3 && deviceCount > 0
            ? { linked: linkingProgress.linked, total: linkingProgress.total }
            : undefined
        }
      />

      <AnimatePresence mode="wait" custom={slideDirection}>
        {step === 1 && (
          <motion.div
            key="step1"
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <MultiDeviceSelectionStep
              devices={localDevices}
              clients={localClients}
              selectedDevices={selectedDevices}
              selectedClient={selectedClient}
              onDevicesChange={setSelectedDevices}
              onClientChange={setSelectedClient}
              onCreateDevice={() => setIsCreateDeviceModalOpen(true)}
              onCreateClient={() => setIsCreateClientModalOpen(true)}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
          >
            <div className="space-y-4">
              <div className="border border-mahogany_red rounded-lg p-4 sm:p-6">
                <Label className="text-silver-400 text-xs uppercase">
                  {SALES_MESSAGES.LABELS.DEVICE_PRICE}
                </Label>
                <p className="text-3xl sm:text-5xl font-bold text-white mt-2">
                  {salesUtils.formatCurrency(amountValue)}
                </p>
                <p className="text-xs text-silver-400 italic mt-2">
                  {selectedDevices.length} dispositivo
                  {selectedDevices.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="border border-carbon_black-600 rounded-lg p-4 sm:p-6 bg-carbon_black">
                <Label className="text-silver-400 text-xs uppercase">
                  {SALES_MESSAGES.LABELS.INITIAL_PAYMENT}
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mahogany_red text-xl sm:text-2xl">
                    $
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={initialPayment}
                    onChange={(e) =>
                      setInitialPayment(
                        salesUtils.formatThousands(e.target.value)
                      )
                    }
                    placeholder={SALES_MESSAGES.PLACEHOLDERS.AMOUNT}
                    className="pl-10 text-2xl sm:text-3xl font-bold bg-onyx-600 border-carbon_black-700 text-white h-14 sm:h-16"
                  />
                </div>
              </div>

              <div className="border border-carbon_black-600 rounded-lg p-4 sm:p-6 bg-carbon_black">
                <Label className="text-silver-400 text-xs uppercase">
                  {SALES_MESSAGES.LABELS.FINANCED_AMOUNT}
                </Label>
                <p className="text-3xl sm:text-5xl font-bold text-white mt-2">
                  {salesUtils.formatCurrency(financedAmount)}
                </p>
                <p className="text-xs text-silver-400 mt-2">
                  Precio - Entrega inicial
                </p>
              </div>

              <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart01Icon
                      size={20}
                      className="text-mahogany_red"
                    />
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
              <div className="border border-carbon_black-600 rounded-lg p-4 sm:p-6 bg-carbon_black">
                <Label className="text-silver-400 text-xs uppercase">
                  {SALES_MESSAGES.LABELS.TOTAL_TO_PAY}
                </Label>
                <p className="text-3xl sm:text-5xl font-bold text-white mt-2">
                  {salesUtils.formatCurrency(
                    totalWithInterest + initialPaymentValue
                  )}
                </p>
                <p className="text-sm text-mahogany_red mt-1">
                  +{interestRate}% INTERÉS
                </p>
              </div>

              <div className="border border-carbon_black-600 rounded-lg p-4 sm:p-6 bg-carbon_black">
                <Label className="text-silver-400 text-xs uppercase">
                  {SALES_MESSAGES.LABELS.INSTALLMENT_PAYMENT}
                </Label>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-2">
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
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {allLinked ? (
              <ActivationSuccessView devices={linkedDevices} />
            ) : (
              <MultiActivationStatus
                activationCode={activationCode}
                devices={deviceNames}
                onAllLinked={() => {
                  setLinkedDevices(
                    deviceNames.map((d) => ({
                      deviceId: d.id,
                      deviceName: d.name,
                    }))
                  );
                  setAllLinked(true);
                }}
                onLinkingProgress={(linked, total) => {
                  setLinkingProgress({ linked, total });
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <CreateFinancingPlanModal
        open={isCreatePlanModalOpen}
        onOpenChange={setIsCreatePlanModalOpen}
        onSuccess={async () => {
          const plansData = await financingPlanService.getAll();
          onPlansUpdate(plansData);
        }}
      />

      <DeviceModal
        open={isCreateDeviceModalOpen}
        onOpenChange={setIsCreateDeviceModalOpen}
        onSuccess={handleDeviceCreated}
      />

      <ClientModal
        open={isCreateClientModalOpen}
        onOpenChange={setIsCreateClientModalOpen}
        onSuccess={handleClientCreated}
      />
    </GenericModal>
  );
}
