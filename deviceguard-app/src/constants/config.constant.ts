import { logger } from '../utils/logger.util';

export const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  logger.error('CONFIG', 'EXPO_PUBLIC_API_URL is not defined!');
} else {
  logger.info('CONFIG', `API_URL configured: ${API_URL}`);
}
