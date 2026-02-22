import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { NativeModules } from 'react-native';
import 'react-native-reanimated';
import { TamaguiProvider, YStack, XStack, Button, Text, Theme } from 'tamagui';
import config from '../tamagui.config';

import { useColorScheme } from '@/components/useColorScheme';

const { DeviceModule } = NativeModules;

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [isLocked, setIsLocked] = useState(false);

  const enableStrictLock = () => {
    if (DeviceModule) {
      DeviceModule.startKioskMode();
      DeviceModule.setStatusBarDisabled(true);
    }
    setIsLocked(true);
  };

  const disableStrictLock = () => {
    if (DeviceModule) {
      DeviceModule.stopKioskMode();
      DeviceModule.setStatusBarDisabled(false);
    }
    setIsLocked(false);
  };

  const activateDeviceAdmin = () => {
    if (DeviceModule) {
      DeviceModule.enableDeviceAdmin()
        .then((result: string) => {
          console.log('Device admin activation:', result);
        })
        .catch((error: string) => {
          console.error('Device admin error:', error);
        });
    }
  };

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
    <TamaguiProvider config={config}>
      <Theme name={useColorScheme() === 'dark' ? 'dark' : 'light'}>
        <RootLayoutNav enableStrictLock={enableStrictLock} isLocked={isLocked} activateDeviceAdmin={activateDeviceAdmin} />
        {isLocked && (
          <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="$black1"
            justifyContent="center"
            alignItems="center"
            zIndex={9999}
          >
            <Text
              color="$red10"
              fontSize="$8"
              fontWeight="bold"
              textAlign="center"
              marginBottom="$8"
            >
              APP BLOQUEADA - CONTACTE AL ADMINISTRADOR
            </Text>
            <Button
              theme="red"
              size="$5"
              onPress={disableStrictLock}
            >
              UNLOCK
            </Button>
          </YStack>
        )}
      </Theme>
    </TamaguiProvider>
  );
}

function RootLayoutNav({ enableStrictLock, isLocked, activateDeviceAdmin }: { enableStrictLock: () => void; isLocked: boolean; activateDeviceAdmin: () => void }) {
  const colorScheme = useColorScheme();

  if (!isLocked) {
    return (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding="$6"
        backgroundColor="$background"
      >
        <Text
          fontSize="$9"
          fontWeight="bold"
          marginBottom="$10"
          color="$color"
        >
          DeviceGuard Dashboard
        </Text>
        <XStack gap="$4" flexDirection="column" width="80%">
          <Button
            theme="orange"
            size="$6"
            onPress={activateDeviceAdmin}
            pressStyle={{ scale: 0.95 }}
          >
            ACTIVATE DEVICE ADMIN
          </Button>
          <Button
            theme="blue"
            size="$6"
            onPress={enableStrictLock}
            pressStyle={{ scale: 0.95 }}
          >
            TEST LOCK
          </Button>
        </XStack>
      </YStack>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}


