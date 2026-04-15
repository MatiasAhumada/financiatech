import { YStack } from 'tamagui';
import { Image } from 'react-native';

export function BrandLogo({ size = 80 }: { size?: number }) {
  return (
    <YStack
      width={size}
      height={size}
      justifyContent="center"
      alignItems="center"
    >
      <Image
        source={require('../../assets/images/icon.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </YStack>
  );
}
