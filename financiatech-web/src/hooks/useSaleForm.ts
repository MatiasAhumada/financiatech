import { useState, useEffect } from "react";
import { IFinancingPlan, ISale } from "@/types";
import { PaymentFrequency } from "@prisma/client";
import { saleService } from "@/services/sale.service";
import { BLOCK_RULES_BY_FREQUENCY } from "@/constants/blockRules.constant";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";
import { SALES_MESSAGES } from "@/constants/sales.constant";
import { salesUtils } from "@/utils/sales.util";

interface SelectedDeviceItem {
  deviceId: string;
  amount: number;
}

interface UseSaleFormProps {
  open: boolean;
  initialSale?: ISale | null;
  financingPlans: IFinancingPlan[];
  onSuccess: () => void;
  onClose: () => void;
}

export function useSaleForm({
  open,
  initialSale,
  financingPlans,
  onSuccess,
  onClose,
}: UseSaleFormProps) {
  const [step, setStep] = useState(1);
  const [selectedDevices, setSelectedDevices] = useState<SelectedDeviceItem[]>(
    []
  );
  const [selectedClient, setSelectedClient] = useState("");
  const [amount, setAmount] = useState("");
  const [initialPayment, setInitialPayment] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<IFinancingPlan | null>(null);
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(
    PaymentFrequency.MONTHLY
  );
  const blockRules = BLOCK_RULES_BY_FREQUENCY[paymentFrequency];
  const [firstWarningDay, setFirstWarningDay] = useState(
    blockRules.firstWarningDay.toString()
  );
  const [secondWarningDay, setSecondWarningDay] = useState(
    blockRules.secondWarningDay.toString()
  );
  const [blockDay, setBlockDay] = useState(blockRules.blockDay.toString());
  const [loading, setLoading] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [deviceCount, setDeviceCount] = useState(0);

  useEffect(() => {
    if (selectedPlan) {
      setPaymentFrequency(selectedPlan.paymentFrequency);
    }
  }, [selectedPlan]);

  useEffect(() => {
    const rules = BLOCK_RULES_BY_FREQUENCY[paymentFrequency];
    setFirstWarningDay(rules.firstWarningDay.toString());
    setSecondWarningDay(rules.secondWarningDay.toString());
    setBlockDay(rules.blockDay.toString());
  }, [paymentFrequency]);

  useEffect(() => {
    if (open && initialSale) {
      setSelectedDevices([
        {
          deviceId: initialSale.deviceId,
          amount: Number(initialSale.totalAmount),
        },
      ]);
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

  const resetForm = () => {
    setStep(1);
    setSelectedDevices([]);
    setSelectedClient("");
    setAmount("");
    setInitialPayment("");
    setSelectedPlan(null);
    const frequency = PaymentFrequency.MONTHLY;
    setPaymentFrequency(frequency);
    const rules = BLOCK_RULES_BY_FREQUENCY[frequency];
    setFirstWarningDay(rules.firstWarningDay.toString());
    setSecondWarningDay(rules.secondWarningDay.toString());
    setBlockDay(rules.blockDay.toString());
    setActivationCode("");
    setDeviceCount(0);
  };

  const handleClose = () => {
    const wasStep3 = step === 3 && activationCode;
    resetForm();
    onClose();
    if (wasStep3) {
      onSuccess();
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedDevices.length > 0 && selectedClient && amount) {
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
    if (
      selectedDevices.length === 0 ||
      !selectedClient ||
      !amount ||
      !selectedPlan
    )
      return;

    try {
      setLoading(true);
      setDeviceCount(selectedDevices.length);

      const saleData = {
        deviceIds: selectedDevices.map((d) => d.deviceId),
        amounts: selectedDevices.map((d) => d.amount),
        clientId: selectedClient,
        totalAmount: parseFloat(salesUtils.parseFormattedNumber(amount)),
        initialPayment: parseFloat(
          salesUtils.parseFormattedNumber(initialPayment)
        ),
        installments: selectedPlan.installments,
        paymentFrequency,
        financingPlanId: selectedPlan.id,
        firstWarningDay: parseInt(firstWarningDay),
        secondWarningDay: parseInt(secondWarningDay),
        blockDay: parseInt(blockDay),
      };

      if (initialSale) {
        await saleService.updateMultiple(initialSale.id, saleData);
        clientSuccessHandler(SALES_MESSAGES.SUCCESS.UPDATED);
        handleClose();
        onSuccess();
      } else {
        const result = await saleService.createMultiple(saleData);
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

  const canProceedStep1 =
    selectedDevices.length > 0 && selectedClient && amount;
  const canProceedStep2 =
    selectedPlan &&
    initialPayment &&
    firstWarningDay &&
    secondWarningDay &&
    blockDay &&
    !loading;

  const handleDevicesChange = (devices: SelectedDeviceItem[]) => {
    setSelectedDevices(devices);
    const total = devices.reduce((sum, d) => sum + d.amount, 0);
    setAmount(total.toString());
  };

  return {
    step,
    selectedDevices,
    setSelectedDevices: handleDevicesChange,
    selectedClient,
    setSelectedClient,
    amount,
    setAmount,
    initialPayment,
    setInitialPayment,
    selectedPlan,
    setSelectedPlan,
    paymentFrequency,
    setPaymentFrequency,
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
  };
}
