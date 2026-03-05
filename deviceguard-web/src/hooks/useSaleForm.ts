import { useState, useEffect } from "react";
import { IFinancingPlan, ISale } from "@/types";
import { PaymentFrequency } from "@prisma/client";
import { saleService } from "@/services/sale.service";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";
import { SALES_MESSAGES, SALES_DEFAULTS } from "@/constants/sales.constant";

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
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [amount, setAmount] = useState("");
  const [initialPayment, setInitialPayment] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<IFinancingPlan | null>(null);
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(
    PaymentFrequency.MONTHLY
  );
  const [firstWarningDay, setFirstWarningDay] = useState(
    SALES_DEFAULTS.FIRST_WARNING_DAY.toString()
  );
  const [secondWarningDay, setSecondWarningDay] = useState(
    SALES_DEFAULTS.SECOND_WARNING_DAY.toString()
  );
  const [blockDay, setBlockDay] = useState(SALES_DEFAULTS.BLOCK_DAY.toString());
  const [loading, setLoading] = useState(false);
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

  const resetForm = () => {
    setStep(1);
    setSelectedDevice("");
    setSelectedClient("");
    setAmount("");
    setInitialPayment("");
    setSelectedPlan(null);
    setPaymentFrequency(PaymentFrequency.MONTHLY);
    setFirstWarningDay(SALES_DEFAULTS.FIRST_WARNING_DAY.toString());
    setSecondWarningDay(SALES_DEFAULTS.SECOND_WARNING_DAY.toString());
    setBlockDay(SALES_DEFAULTS.BLOCK_DAY.toString());
    setActivationCode("");
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

      const saleData = {
        deviceId: selectedDevice,
        clientId: selectedClient,
        totalAmount: parseFloat(amount),
        initialPayment: parseFloat(initialPayment),
        installments: selectedPlan.installments,
        paymentFrequency,
        financingPlanId: selectedPlan.id,
        firstWarningDay: parseInt(firstWarningDay),
        secondWarningDay: parseInt(secondWarningDay),
        blockDay: parseInt(blockDay),
      };

      if (initialSale) {
        await saleService.update(initialSale.id, saleData);
        clientSuccessHandler(SALES_MESSAGES.SUCCESS.UPDATED);
        handleClose();
        onSuccess();
      } else {
        const result = await saleService.create(saleData);
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

  const canProceedStep1 = selectedDevice && selectedClient && amount;
  const canProceedStep2 =
    selectedPlan &&
    initialPayment &&
    firstWarningDay &&
    secondWarningDay &&
    blockDay &&
    !loading;

  return {
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
    handleClose,
    handleNext,
    handleBack,
    handleSubmit,
    canProceedStep1,
    canProceedStep2,
  };
}
