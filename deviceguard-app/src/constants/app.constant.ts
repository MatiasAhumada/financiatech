export const APP_CONFIG = {
  POLL_INTERVAL_ACTIVE_MS: 30000,
  POLL_INTERVAL_BLOCKED_MS: 300000,
  HTTP_TIMEOUT_MS: 5000,
  CACHE_MAX_AGE_MS: 3600000,
} as const;

export const NAVIGATION_ROUTES = {
  PROVISIONING: '/provisioning',
  LINKING: '/linking',
  LINKING_SUCCESS: '/linking-success',
  LINKING_ERROR: '/linking-error',
  DEVICE_BLOCKED: '/device-blocked',
  PAYMENT_METHODS: '/payment-methods',
} as const;

export const STORAGE_KEYS = {
  DEVICE_ID: 'deviceId',
  API_URL: 'apiUrl',
  IS_LINKED: 'isLinked',
  IS_LOCKED: 'isLocked',
  LOCKDOWN_ACTIVE: 'isFullLockdownActive',
  LAST_KNOWN_STATE: 'lastKnownState',
  LAST_SUCCESSFUL_POLL: 'lastSuccessfulPoll',
} as const;

export const FCM_MESSAGE_TYPES = {
  DEVICE_BLOCKED: 'DEVICE_BLOCKED',
  DEVICE_UNBLOCKED: 'DEVICE_UNBLOCKED',
} as const;
