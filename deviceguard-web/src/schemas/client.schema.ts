import { z } from "zod";
import { PhoneType } from "@prisma/client";

export const createClientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phones: z
    .array(
      z.object({
        number: z.string().min(1, "El número es requerido"),
        type: z.nativeEnum(PhoneType),
        referencia: z.string().optional().or(z.literal("")),
      })
    )
    .optional(),
  addresses: z
    .array(
      z.object({
        street: z.string().min(1, "La calle es requerida"),
        city: z.string().min(1, "La ciudad es requerida"),
        state: z
          .string()
          .min(1, "El estado es requerido")
          .optional()
          .or(z.literal("")),
        zipCode: z
          .string()
          .min(1, "El código postal es requerido")
          .optional()
          .or(z.literal("")),
        country: z
          .string()
          .min(1, "El país es requerido")
          .optional()
          .or(z.literal("")),
        nota: z.string().optional().or(z.literal("")),
      })
    )
    .optional(),
});

export type CreateClientDto = z.infer<typeof createClientSchema>;
