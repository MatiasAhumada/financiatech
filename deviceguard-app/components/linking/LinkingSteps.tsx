import { useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { YStack, Text } from "tamagui";

const STEPS = [
  "Verificando integridad del sistema",
  "Desbloqueando bootloader",
  "Estableciendo túnel seguro",
  "Validando certificados",
  "Configurando políticas de dispositivo",
  "Sincronizando con servidor",
  "Aplicando restricciones de seguridad",
  "Finalizando vinculación",
];

const STEP_INTERVAL_MS = 500;


export function LinkingSteps() {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, STEP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [currentStep]);

  const visibleSteps = STEPS.slice(0, currentStep + 1);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ maxHeight: 200, width: "100%" }}
      contentContainerStyle={{ paddingHorizontal: 8 }}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <YStack gap="$2" alignItems="center" marginTop="$2" width="100%" maxWidth={320}>
        {visibleSteps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <Animated.View
              key={index}
              entering={FadeInDown.duration(350).springify().damping(14)}
            >
              <Text
                fontSize={12}
                color={isCurrent ? "#10B981" : "#6B7280"}
                textAlign="center"
                letterSpacing={1}
              >
                {isCompleted ? "✓ " : "▸ "}
                {step.toUpperCase()}
              </Text>
            </Animated.View>
          );
        })}
      </YStack>
    </ScrollView>
  );
}
