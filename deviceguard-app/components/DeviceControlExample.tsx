import React from 'react';
import { NativeModules, Pressable } from 'react-native';
import { Text } from '@/components/Themed';

const { DeviceModule } = NativeModules;

export default function DeviceControlExample() {
  const handleLockDevice = () => {
    DeviceModule.lockDevice();
  };

  return (
    <Pressable onPress={handleLockDevice}>
      <Text>Lock Device</Text>
    </Pressable>
  );
}