export const SALES_MESSAGES = {
  SUCCESS: {
    CREATED: "Venta registrada exitosamente",
    UPDATED: "Venta actualizada exitosamente",
    DELETED: "Venta eliminada exitosamente",
  },
  LABELS: {
    DEVICE_PRICE: "PRECIO DISPOSITIVO",
    INITIAL_PAYMENT: "ENTREGA INICIAL",
    FINANCED_AMOUNT: "MONTO A FINANCIAR",
    TOTAL_TO_PAY: "TOTAL A PAGAR",
    INSTALLMENT_PAYMENT: "CUOTA",
    PAYMENT_FREQUENCY: "FRECUENCIA DE PAGO",
    FINANCING_PLAN: "PLAN DE FINANCIAMIENTO",
    BLOCK_RULES: "REGLAS DE BLOQUEO",
    FIRST_WARNING: "1RA NOTIFICACIÓN (DÍA DEL MES)",
    SECOND_WARNING: "2DA NOTIFICACIÓN (DÍA DEL MES)",
    AUTO_BLOCK: "BLOQUEO AUTOMÁTICO (DÍA DEL MES)",
    ACTIVATION_CODE: "CÓDIGO DE ACTIVACIÓN",
  },
  PLACEHOLDERS: {
    SELECT_DEVICE: "Seleccione un dispositivo...",
    SELECT_CLIENT: "Seleccione un cliente...",
    AMOUNT: "0.00",
  },
  BUTTONS: {
    CANCEL: "CANCELAR",
    BACK: "ATRÁS",
    NEXT: "SIGUIENTE PASO",
    REGISTER: "REGISTRAR VENTA",
    PROCESSING: "PROCESANDO...",
    CLOSE: "CERRAR",
    CREATE_PLAN: "+ Crear Plan",
  },
  STEPS: {
    DEVICE: "DISPOSITIVO",
    FINANCING: "FINANCIACIÓN",
    LINKING: "VINCULACIÓN",
  },
  INFO: {
    AUTO_BLOCK_WARNING:
      "El dispositivo quedará bloqueado automáticamente vía DeviceGuard MDM en caso de mora superior a 72 horas.",
    BLOCK_RULES_EXAMPLE:
      "Ejemplo: Si configuras día 10, 15 y 20, el sistema enviará notificaciones los días 10 y 15 de cada mes, y bloqueará el dispositivo el día 20.",
    SUCCESS_TITLE: "¡Venta Registrada Exitosamente!",
    SUCCESS_SUBTITLE: "Ahora debe vincular el dispositivo con la aplicación móvil",
    ACTIVATION_INSTRUCTIONS:
      "El cliente debe ingresar este código en la aplicación móvil DeviceGuard para vincular el dispositivo",
    CLIENT_INSTRUCTIONS_TITLE: "Instrucciones para el cliente:",
    IMPORTANT_TITLE: "Importante:",
    IMPORTANT_MESSAGE:
      "La venta se completará automáticamente cuando el cliente vincule el dispositivo. El sistema comenzará a monitorear los pagos según el plan configurado.",
  },
  CLIENT_INSTRUCTIONS: [
    "Descargar la app DeviceGuard desde Play Store o App Store",
    "Abrir la aplicación e ingresar el código de activación",
    "Seguir las instrucciones en pantalla para completar la vinculación",
    "Una vez vinculado, el dispositivo quedará bajo monitoreo",
  ],
  DELETE: {
    TITLE: "Eliminar Venta",
    DESCRIPTION:
      "¿Estás seguro de que deseas eliminar esta venta? Esta acción no se puede deshacer.",
    WARNING:
      "Se eliminarán todos los datos asociados incluyendo plan de pagos, cuotas y reglas de bloqueo.",
  },
} as const;

export const SALES_TABLE = {
  TITLE: "TABLA DE REGISTRO DE VENTAS",
  SUBTITLE: "Registro histórico de transacciones y activaciones de licencias",
  COLUMNS: {
    CLIENT_DEVICE: "CLIENTE / ID DISPOSITIVO",
    TOTAL_AMOUNT: "MONTO TOTAL",
    MONTHLY_PAYMENT: "CUOTA MENSUAL",
    SALE_DATE: "FECHA VENTA",
    STATUS: "ESTADO",
    ACTIONS: "ACCIONES",
  },
  STATUS: {
    PENDING: "PENDIENTE VINCULACIÓN",
    ACTIVE: "ACTIVO",
  },
  ACTIONS: {
    EDIT: "Editar",
    DELETE: "Eliminar",
  },
  EMPTY: "No hay ventas registradas",
  SEARCH_PLACEHOLDER: "Buscar venta por cliente o ID de dispositivo...",
  EXPORT_CSV: "Exportar CSV",
  NEW_SALE: "Nueva Venta",
  INSTALLMENTS_TITLE: "Cuotas del Plan de Financiamiento",
} as const;

export const SALES_STATS = {
  TODAY_SALES: "VENTAS HOY",
  NEW_DEVICES: "DISPOSITIVOS NUEVOS",
  PENDING_PAYMENTS: "PENDIENTES DE PAGO",
  AVG_TICKET: "TICKET PROMEDIO",
  REQUIRES_ATTENTION: "Requieren atención",
  LAST_30_DAYS: "Últimos 30 días",
} as const;

export const SALES_DEFAULTS = {
  FIRST_WARNING_DAY: 3,
  SECOND_WARNING_DAY: 5,
  BLOCK_DAY: 7,
  RECOMMENDED_INSTALLMENTS: 12,
} as const;
