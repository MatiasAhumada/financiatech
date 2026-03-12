import { NativeModules, Platform } from 'react-native';

const { LoggerModule } = NativeModules;

export const logger = {
  log: (tag: string, message: string) => {
    console.log(`[${tag}] ${message}`);
    if (Platform.OS === 'android' && LoggerModule) {
      LoggerModule.log(tag, message);
    }
  },
  
  info: (tag: string, message: string) => {
    console.info(`[${tag}] ${message}`);
    if (Platform.OS === 'android' && LoggerModule) {
      LoggerModule.info(tag, message);
    }
  },
  
  warn: (tag: string, message: string) => {
    console.warn(`[${tag}] ${message}`);
    if (Platform.OS === 'android' && LoggerModule) {
      LoggerModule.warn(tag, message);
    }
  },
  
  error: (tag: string, message: string) => {
    console.error(`[${tag}] ${message}`);
    if (Platform.OS === 'android' && LoggerModule) {
      LoggerModule.error(tag, message);
    }
  },
};
