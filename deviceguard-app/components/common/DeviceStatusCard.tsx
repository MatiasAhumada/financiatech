/**
 * Componente: DeviceStatusCard
 *
 * Muestra el estado actual del dispositivo (Device Owner, Device Admin, etc.)
 * Reutilizable en diferentes pantallas
 */

import React, { useState, useEffect } from "react";
import { Card, Text, XStack, YStack, Button, Spinner } from "tamagui";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Platform } from "react-native";
import { useKioskMode, DeviceStatus } from "@/src/hooks/useKioskMode";

interface DeviceStatusCardProps {
  onStatusChange?: (status: DeviceStatus | null) => void;
  showDetails?: boolean;
}

export function DeviceStatusCard({ onStatusChange, showDetails = true }: DeviceStatusCardProps) {
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const kioskControl = useKioskMode(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    if (Platform.OS !== "android") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const deviceStatus = await kioskControl.getDeviceStatus();
      setStatus(deviceStatus);
      onStatusChange?.(deviceStatus);
    } catch (err) {
      console.error("Error checking device status:", err);
      setError("Error al verificar estado");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card padding="$3" marginBottom="$3">
        <XStack gap="$2" alignItems="center" justifyContent="center">
          <Spinner size="small" />
          <Text fontSize="$3">Verificando permisos...</Text>
        </XStack>
      </Card>
    );
  }

  if (Platform.OS !== "android") {
    return (
      <Card backgroundColor="$gray5" padding="$3" marginBottom="$3">
        <XStack gap="$2" alignItems="center">
          <FontAwesome name="info-circle" size={20} color="$orange9" />
          <Text fontSize="$3">Solo disponible en Android</Text>
        </XStack>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (status?.isDeviceOwner) return "$green";
    if (status?.isDeviceAdmin) return "$orange";
    return "$red";
  };

  const getStatusIcon = () => {
    if (status?.isDeviceOwner) return "shield";
    if (status?.isDeviceAdmin) return "check-circle";
    return "exclamation-circle";
  };

  const getStatusLabel = () => {
    if (status?.isDeviceOwner) return "Device Owner";
    if (status?.isDeviceAdmin) return "Device Admin";
    return "Sin Permisos";
  };

  const getStatusDescription = () => {
    if (status?.isDeviceOwner) {
      return "Bloqueo completo y control total del dispositivo disponible";
    }
    if (status?.isDeviceAdmin) {
      return "Bloqueo básico disponible";
    }
    return "Se requieren permisos de administrador";
  };

  return (
    <Card backgroundColor={getStatusColor() + "1"} borderColor={getStatusColor()} padding="$3" marginBottom="$3">
      {/* Encabezado con icono y estado */}
      <XStack gap="$3" alignItems="center" marginBottom="$2">
        <FontAwesome name={getStatusIcon()} size={24} color={getStatusColor()} />
        <YStack flex={1}>
          <Text fontSize="$4" fontWeight="bold">
            {getStatusLabel()}
          </Text>
          <Text fontSize="$2" color="$gray" opacity={0.7}>
            {getStatusDescription()}
          </Text>
        </YStack>
      </XStack>

      {/* Detalles (opcional) */}
      {showDetails && (
        <YStack gap="$2" marginTop="$3" paddingTop="$3" borderTopColor="$gray" borderTopWidth={1}>
          <XStack justifyContent="space-between">
            <Text fontSize="$2" color="$gray">
              Device Owner:
            </Text>
            <Text fontSize="$2" fontWeight="bold">
              {status?.isDeviceOwner ? "✅ Sí" : "❌ No"}
            </Text>
          </XStack>
          <XStack justifyContent="space-between">
            <Text fontSize="$2" color="$gray">
              Device Admin:
            </Text>
            <Text fontSize="$2" fontWeight="bold">
              {status?.isDeviceAdmin ? "✅ Sí" : "❌ No"}
            </Text>
          </XStack>
          <XStack justifyContent="space-between">
            <Text fontSize="$2" color="$gray">
              Android SDK:
            </Text>
            <Text fontSize="$2" fontWeight="bold">
              {status?.sdkVersion}
            </Text>
          </XStack>
        </YStack>
      )}

      {/* Error message */}
      {error && (
        <Text fontSize="$2" color="$red" marginTop="$2">
          {error}
        </Text>
      )}

      {/* Botón de recarga */}
      <Button size="$2" variant="outlined" marginTop="$3" onPress={checkStatus}>
        Recargar Estado
      </Button>
    </Card>
  );
}
