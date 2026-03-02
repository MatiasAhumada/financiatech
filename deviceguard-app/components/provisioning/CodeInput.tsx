import { XStack, YStack, Text, styled } from 'tamagui';

const CodeBox = styled(YStack, {
  width: 44,
  height: 52,
  borderWidth: 2,
  borderColor: '#DC2626',
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'transparent',
});

import React, { useRef } from 'react';
import { TextInput, TouchableWithoutFeedback } from 'react-native';

interface CodeInputProps {
  codeString: string;
  onChangeText: (text: string) => void;
  code: string[];
}

export function CodeInput({ codeString, onChangeText, code }: CodeInputProps) {
  const inputRef = useRef<TextInput>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <YStack>
        <TextInput
          ref={inputRef}
          value={codeString}
          onChangeText={onChangeText}
          keyboardType="visible-password"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          autoFocus={true}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            zIndex: 10,
            opacity: 1,
            color: 'transparent',
            backgroundColor: 'transparent',
          }}
          caretHidden={true}
        />
        <XStack gap="$4" marginTop="$6" marginStart="$3" pointerEvents="none">
          {code.map((digit, index) => (
            <CodeBox key={index}>
              <Text fontSize={28} fontWeight="bold" color="white">
                {digit}
              </Text>
            </CodeBox>
          ))}
        </XStack>
      </YStack>
    </TouchableWithoutFeedback>
  );
}
