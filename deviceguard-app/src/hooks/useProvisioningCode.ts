import { useState } from 'react';

const CODE_LENGTH = 6;

export function useProvisioningCode() {
  const [code, setCode] = useState<string>('');

  const setFullCode = (text: string) => {
    // Only alphanumeric uppercase
    const cleanText = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, CODE_LENGTH);
    setCode(cleanText);
  };

  const reset = () => {
    setCode('');
  };

  const getFullCode = () => code;

  const isComplete = () => code.length === CODE_LENGTH;

  // For compatibility with the UI component
  const codeArray = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] || '');

  return {
    code: codeArray,
    codeString: code,
    setCodeString: setFullCode,
    reset,
    getFullCode,
    isComplete,
  };
}
