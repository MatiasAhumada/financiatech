import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const API_URL = process.env.EXPO_PUBLIC_API_URL 
  // || 'https://financiatech.net';

  if (!process.env.EXPO_PUBLIC_API_URL) {
    console.warn(
      "⚠️  EXPO_PUBLIC_API_URL no está definida, usando URL por defecto: " + API_URL
    );
  }

  return {
    ...config,
    name: "financiatech-app",
    slug: "financiatech-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "financiatechapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.financiatech.kiosk",
      googleServicesFile: "./GoogleService-Info.plist",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.financiatech.kiosk",
      googleServicesFile: "./google-services.json",
      permissions: ["android.permission.POST_NOTIFICATIONS"],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.ico",
    },
    extra: {
      API_URL,
    },
    plugins: [
      "expo-router",
      [
        "@react-native-firebase/app",
        {
          android: {
            googleServicesFile: "./google-services.json",
          },
          ios: {
            googleServicesFile: "./GoogleService-Info.plist",
          },
        },
      ],
      "expo-dev-client",
    ],
    experiments: {
      typedRoutes: true,
    },
  };
};
