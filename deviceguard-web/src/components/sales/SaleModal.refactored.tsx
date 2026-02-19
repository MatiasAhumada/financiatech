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
import { SALES_MESSAGES, SALES_DEFAULTS } from "@/constants/sales.constant";
import { salesUtils } from "@/utils/sales.util";
import { ShoppingCart01Icon } from "hugeicons-react";
import { CreateFinancingPlanModal } from "@/components/sales/CreateFinancingPlanModal";
import { financingUtils } from "@/utils/financing.util";

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
  const [firstWarningDay, setFirstWarningDay] = useState(
    SALES_DEFAULTS.FIRST_WARNING_DAY.toString()
  );
  const [secondWarningDay, setSecondWarningDay] = useState(
    SALES_DEFAULTS.SECOND_WARNING_DAY.toString()
  );
  const [blockDay, setBlockDay] = useState(SALES_DEFAULTS.BLOCK_DAY.toString());
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

  const handleClose = () => {
    setStep(1);
    setSelectedDevice("");
    setSelectedClient("");
    setAmount("");
    setInitialPayment("");
    setSelectedPlan(null);
    setFirstWarningDay(SALES_DEFAULTS.FIRST_WARNING_DAY.toString());
    setSecondWarningDay(SALES_DEFAULTS.SECOND_WARNING_DAY.toString());
    setBlockDay(SALES_DEFAULTS.BLOCK_DAY.toString());
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
        clientSuccessHandler(SALES_MESSAGES.SUCCESS.UPDATED);
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
        clientSuccessHandler(SALES_MESSAGES.SUCCESS.CREATED);
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
              {SALES_MESSAGES.BUTTONS.CANCEL}
            </Button>
            <Button
              className="bg-mahogany_red hover:bg-mahogany_red-600 text-white"
              onClick={handleNext}
              disabled={!selectedDevice || !selectedClient || !amount}
            >
              {SALES_MESSAGES.BUTTONS.NEXT}
            </Button>
          </>
        ) : step === 2 ? (
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
              disabled={
                !selectedPlan ||
                !initialPayment ||
                !firstWarningDay ||
                !secondWarningDay ||
                !blockDay ||
                loading
              }
            >
              {loading ? SALES_MESSAGES.BUTTONS.PROCESSING : SALES_MESSAGES.BUTTONS.REGISTER}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-carbon_black-600 text-white hover:bg-carbon_black-700"
            >
              {SALES_MESSAGES.BUTTONS.CLOSE}
            </Button>
          </>
        )
      }
    >
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                1
              </div>
              <p className="text-xs text-mahogany_red mt-2 uppercase">
                {SALES_MESSAGES.STEPS.DEVICE}
              </p>
            </div>
            <div className="w-24 h-0.5 bg-carbon_black-600" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-carbon_black-600 flex items-center justify-center text-silver-400 font-bold">
                2
              </div>
              <p className="text-xs text-silver-400 mt-2 uppercase">
                {SALES_MESSAGES.STEPS.FINANCING}
              </p>
            </div>
            <div className="w-24 h-0.5 bg-carbon_black-600" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-carbon_black-600 flex items-center justify-center text-silver-400 font-bold">
                3
              </div>
              <p className="text-xs text-silver-400 mt-2 uppercase">
                {SALES_MESSAGES.STEPS.LINKING}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device" className="text-white">
              {SALES_MESSAGES.STEPS.DEVICE}
            </Label>
            <select
              id="device"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-carbon_black-600 bg-carbon_black text-white text-sm"
            >
              <option value="">{SALES_MESSAGES.PLACEHOLDERS.SELECT_DEVICE}</option>
              {devices.map((device) => (
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
              <option value="">{SALES_MESSAGES.PLACEHOLDERS.SELECT_CLIENT}</option>
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
                placeholder={SALES_MESSAGES.PLACEHOLDERS.AMOUNT}
                className="pl-8 text-lg bg-carbon_black border-carbon_black-600 text-white"
              />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                1
              </div>
              <p className="text-xs text-white mt-2 uppercase">{SALES_MESSAGES.STEPS.DEVICE}</p>
            </div>
            <div className="w-24 h-0.5 bg-mahogany_red" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                2
              </div>
              <p className="text-xs text-mahogany_red mt-2 uppercase">
                {SALES_MESSAGES.STEPS.FINANCING}
              </p>
            </div>
            <div className="w-24 h-0.5 bg-carbon_black-600" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-carbon_black-600 flex items-center justify-center text-silver-400 font-bold">
                3
              </div>
              <p className="text-xs text-silver-400 mt-2 uppercase">
                {SALES_MESSAGES.STEPS.LINKING}
              </p>
            </div>
          </div>

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
                  {devices.find((d) => d.id === selectedDevice)?.name || ""}
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
                            {plan.installments === SALES_DEFAULTS.RECOMMENDED_INSTALLMENTS && " (Recomendado)"}
                          </p>
                          <p className="text-sm text-silver-400">
                            Interés: {Number(plan.interestRate)}% total
                          </p>
                        </div>
                        <p className="text-mahogany_red font-bold text-xl">
                          {salesUtils.formatCurrency(planMonthly)}/mes
                        </p>
                      </div>
                    </button>
                  );
                })}</div>
            </div>

            <div className="space-y-4">
              <div className="border border-carbon_black-600 rounded-lg p-6 bg-carbon_black">
                <Label className="text-silver-400 text-xs uppercase">
                  {SALES_MESSAGES.LABELS.TOTAL_TO_PAY}
                </Label>
                <p className="text-5xl font-bold text-white mt-2">
                  {salesUtils.formatCurrency(totalWithInterest + initialPaymentValue)}
                </p>
                <p className="text-sm text-mahogany_red mt-1">
                  +{interestRate}% INTERÉS
                </p>
              </div>

              <div className="border border-carbon_black-600 rounded-lg p-6 bg-carbon_black">
                <Label className="text-silver-400 text-xs uppercase">
                  {SALES_MESSAGES.LABELS.MONTHLY_PAYMENT}
                </Label>
                <p className="text-3xl font-bold text-white mt-2">
                  {salesUtils.formatCurrency(monthlyPayment)}
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
                      {SALES_MESSAGES.INFO.AUTO_BLOCK_WARNING}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black">
                <Label className="text-white uppercase mb-3 block">
                  {SALES_MESSAGES.LABELS.BLOCK_RULES}
                </Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-silver-400 text-xs">
                      {SALES_MESSAGES.LABELS.FIRST_WARNING}
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
                      {SALES_MESSAGES.LABELS.SECOND_WARNING}
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
                      {SALES_MESSAGES.LABELS.AUTO_BLOCK}
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
                    {SALES_MESSAGES.INFO.BLOCK_RULES_EXAMPLE}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <p className="text-xs text-white mt-2 uppercase">{SALES_MESSAGES.STEPS.DEVICE}</p>
            </div>
            <div className="w-24 h-0.5 bg-mahogany_red" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <p className="text-xs text-white mt-2 uppercase">{SALES_MESSAGES.STEPS.FINANCING}</p>
            </div>
            <div className="w-24 h-0.5 bg-mahogany_red" />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-mahogany_red flex items-center justify-center text-white font-bold">
                3
              </div>
              <p className="text-xs text-mahogany_red mt-2 uppercase">
                {SALES_MESSAGES.STEPS.LINKING}
              </p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart01Icon size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white">
              {SALES_MESSAGES.INFO.SUCCESS_TITLE}
            </h3>
            <p className="text-silver-400">
              {SALES_MESSAGES.INFO.SUCCESS_SUBTITLE}
            </p>
          </div>

          <div className="border border-mahogany_red rounded-lg p-6 bg-mahogany_red/5">
            <Label className="text-white text-sm uppercase mb-2 block">
              {SALES_MESSAGES.LABELS.ACTIVATION_CODE}
            </Label>
            <div className="bg-carbon_black rounded-lg p-6 text-center">
              <p className="text-5xl font-bold text-mahogany_red tracking-widest">
                {activationCode}
              </p>
            </div>
            <p className="text-xs text-silver-400 mt-4 text-center">
              {SALES_MESSAGES.INFO.ACTIVATION_INSTRUCTIONS}
            </p>
          </div>

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

          <div className="border border-warning/50 rounded-lg p-4 bg-warning/5">
            <div className="flex items-start gap-2">
              <ShoppingCart01Icon size={20} className="text-warning mt-1" />
              <div>
                <p className="text-sm text-white font-medium">{SALES_MESSAGES.INFO.IMPORTANT_TITLE}</p>
                <p className="text-sm text-silver-400 mt-1">
                  {SALES_MESSAGES.INFO.IMPORTANT_MESSAGE}
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
