import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { NativeModules, StyleSheet, Pressable } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { Text, View } from '@/components/Themed';

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
    <>
      <RootLayoutNav enableStrictLock={enableStrictLock} isLocked={isLocked} activateDeviceAdmin={activateDeviceAdmin} />
      {isLocked && (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedText}>APP BLOQUEADA - CONTACTE AL ADMINISTRADOR</Text>
          <Pressable style={styles.unlockButton} onPress={disableStrictLock}>
            <Text style={styles.unlockText}>UNLOCK</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

function RootLayoutNav({ enableStrictLock, isLocked, activateDeviceAdmin }: { enableStrictLock: () => void; isLocked: boolean; activateDeviceAdmin: () => void }) {
  const colorScheme = useColorScheme();

  if (!isLocked) {
    return (
      <View style={styles.dashboard}>
        <Text style={styles.dashboardTitle}>DeviceGuard Dashboard</Text>
        <Pressable style={styles.adminButton} onPress={activateDeviceAdmin}>
          <Text style={styles.adminButtonText}>ACTIVATE DEVICE ADMIN</Text>
        </Pressable>
        <Pressable style={styles.lockButton} onPress={enableStrictLock}>
          <Text style={styles.lockButtonText}>TEST LOCK</Text>
        </Pressable>
      </View>
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

const styles = StyleSheet.create({
  dashboard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  adminButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  adminButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
  },
  lockButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  lockedText: {
    color: 'red',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  unlockButton: {
    backgroundColor: 'red',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  unlockText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
