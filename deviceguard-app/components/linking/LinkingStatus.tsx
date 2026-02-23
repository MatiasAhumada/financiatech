import { useEffect, useState } from "react";
import { XStack, Text } from "tamagui";

export function LinkingStatus() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <XStack position="absolute" bottom={40} width="100%" justifyContent="space-between" paddingHorizontal="$6">
      <Text fontSize={11} color="#4B5563" letterSpacing={1}>
        VINCULANDO DISPOSITIVO{dots}
      </Text>
      <Text fontSize={11} color="#DC2626" fontWeight="600" letterSpacing={1}>
        EN PROGRESO
      </Text>
    </XStack>
  );
}
