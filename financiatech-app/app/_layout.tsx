import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { TamaguiProvider } from "tamagui";
import config from "../tamagui.config";
import { useColorScheme, NativeModules, Platform } from "react-native";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import * as Linking from "expo-linking";


export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <RootLayoutNav />
    </TamaguiProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  usePushNotifications();

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const checkUnlockIntent = async () => {
      try {
        const { DeviceModule } = NativeModules;
        const intentData = await DeviceModule.getInitialIntent();
        
        if (intentData && intentData.unlocked) {
          console.log("[UNLOCK] Device unlocked, navigating to linking-success");
          setTimeout(() => {
            router.replace("/linking-success");
          }, 500);
        } else if (intentData && intentData.navigate_to === "device-blocked") {
          console.log("[BLOCK] Device blocked, navigating to device-blocked");
          setTimeout(() => {
            router.replace("/device-blocked");
          }, 500);
        }
      } catch (error) {
        console.error("[INTENT] Error checking intent:", error);
      }
    };

    checkUnlockIntent();
  }, [router]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="provisioning" options={{ headerShown: false }} />
        <Stack.Screen name="linking" options={{ headerShown: false }} />
        <Stack.Screen name="linking-success" options={{ headerShown: false }} />
        <Stack.Screen name="linking-error" options={{ headerShown: false }} />
        <Stack.Screen name="device-blocked" options={{ headerShown: false }} />
        <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
