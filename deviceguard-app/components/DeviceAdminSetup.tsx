import React from 'react';
import { NativeModules, Pressable, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';

const { DeviceModule } = NativeModules;

export default function DeviceAdminSetup() {
  const activateDeviceAdmin = () => {
    // This will open Android's Device Admin activation screen
    const intent = {
      action: 'android.app.action.ADD_DEVICE_ADMIN',
      extra: {
        'android.app.extra.DEVICE_ADMIN': 'com.matias.deviceguard/.DeviceAdmin'
      }
    };
    
    Alert.alert(
      'Device Admin Required',
      'Go to Settings > Security > Device Admin and enable DeviceGuard Admin',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Device Admin Setup</Text>
      <Pressable 
        style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 8 }}
        onPress={activateDeviceAdmin}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>Activate Device Admin</Text>
      </Pressable>
    </View>
  );
}