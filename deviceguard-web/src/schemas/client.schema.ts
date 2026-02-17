import { z } from "zod";
import { PhoneType } from "@prisma/client";

export const createClientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.preprocess(
    (val) => (val === undefined || val === "" ? null : val),
    z.string().email("Email inválido").nullable()
  ),
  phones: z
    .array(
      z.object({
        number: z.string().min(1, "El número es requerido"),
        type: z.nativeEnum(PhoneType),
        referencia: z.string().optional(),
      })
    )
    .optional(),
  addresses: z
    .array(
      z.object({
        street: z.string().min(1, "La calle es requerida"),
        city: z.string().min(1, "La ciudad es requerida"),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        nota: z.string().optional(),
      })
    )
    .optional(),
});

export type CreateClientDto = z.infer<typeof createClientSchema>;
