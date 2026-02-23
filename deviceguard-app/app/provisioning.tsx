import { useState } from "react";
import { YStack, Text, Button } from "tamagui";
import { ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { ProvisioningHeader } from "@/components/provisioning/ProvisioningHeader";
import { CodeInput } from "@/components/provisioning/CodeInput";
import { NumericKeyboard } from "@/components/provisioning/NumericKeyboard";
import { AlphanumericKeyboard } from "@/components/provisioning/AlphanumericKeyboard";
import { useProvisioningCode } from "@/src/hooks/useProvisioningCode";
import { provisioningService } from "@/src/services/provisioning.service";
import { validateProvisioningCode } from "@/src/utils/validation.util";

const { height } = Dimensions.get("window");

export default function ProvisioningScreen() {
  const router = useRouter();
  const { code, handleInput, handleDelete, getFullCode, isComplete } = useProvisioningCode();
  const [showLetters, setShowLetters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    // const fullCode = getFullCode();

    // if (!validateProvisioningCode(fullCode)) {
    //   return;
    // }

    setIsLoading(true);

    try {
      router.push("/linking");
    } catch (error) {
      setIsLoading(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="#000000">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} paddingHorizontal="$4" paddingTop={height * 0.08} gap="$6">
          <ProvisioningHeader />

          <CodeInput code={code} />

          <Button
            backgroundColor="#DC2626"
            borderRadius={10}
            width="100%"
            marginTop="$8"
            alignSelf="center"
            onPress={handleVerify}
            disabled={!isComplete() || isLoading}
            opacity={!isComplete() || isLoading ? 0.5 : 1}
            pressStyle={{ opacity: 0.8 }}
          >
            <Text color="white" fontSize={18} fontWeight="800">
              {isLoading ? "Verificando..." : "Verificar y Vincular"}
            </Text>
          </Button>

          {showLetters ? (
            <AlphanumericKeyboard onInput={handleInput} onDelete={handleDelete} onToggleNumbers={() => setShowLetters(false)} />
          ) : (
            <NumericKeyboard onInput={handleInput} onDelete={handleDelete} onToggleLetters={() => setShowLetters(true)} />
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
