"use client";

import { useState } from "react";
import { GenericModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientService } from "@/services/client.service";
import { createClientSchema } from "@/schemas/client.schema";
import { PhoneType } from "@prisma/client";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";

interface CreateClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateClientModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateClientModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phones: [
      { number: "", type: PhoneType.MOBILE as PhoneType, referencia: "" },
    ],
    addresses: [
      { street: "", city: "", state: "", zipCode: "", country: "", nota: "" },
    ],
  });
  const [errors, setErrors] = useState<any>({});

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      phones: [
        { number: "", type: PhoneType.MOBILE as PhoneType, referencia: "" },
      ],
      addresses: [
        { street: "", city: "", state: "", zipCode: "", country: "", nota: "" },
      ],
    });
    setErrors({});
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const result = createClientSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: any = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await clientService.create(result.data);
      clientSuccessHandler("Cliente creado exitosamente");
      handleClose();
      onSuccess();
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  return (
    <GenericModal
      open={open}
      onOpenChange={handleClose}
      title="Nuevo Cliente"
      description="Crear un nuevo cliente en el sistema"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            className="bg-mahogany_red hover:bg-mahogany_red-600 text-amber-50"
            onClick={handleSubmit}
          >
            Crear Cliente
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre Completo</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            placeholder="Ingrese el nombre completo"
            className={
              errors.name
                ? "border-destructive focus:border-destructive focus:ring-destructive"
                : ""
            }
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email (Opcional)</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ""}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            placeholder="cliente@ejemplo.com"
            className={
              errors.email
                ? "border-destructive focus:border-destructive focus:ring-destructive"
                : ""
            }
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Teléfono</Label>
          <div className="flex gap-2">
            <Input
              value={formData.phones[0].number}
              onChange={(e) => {
                const newPhones = [...formData.phones];
                newPhones[0].number = e.target.value;
                setFormData({ ...formData, phones: newPhones });
                if (errors["phones.0.number"]) {
                  const newErrors = { ...errors };
                  delete newErrors["phones.0.number"];
                  setErrors(newErrors);
                }
              }}
              placeholder="Número"
              className={
                errors["phones.0.number"]
                  ? "flex-1 border-destructive focus:border-destructive focus:ring-destructive"
                  : "flex-1"
              }
            />
            <select
              value={formData.phones[0].type}
              onChange={(e) => {
                const newPhones = [...formData.phones];
                newPhones[0].type = e.target.value as PhoneType;
                setFormData({ ...formData, phones: newPhones });
              }}
              className="px-3 py-2 rounded-md border bg-background text-sm"
            >
              <option value={PhoneType.MOBILE}>Móvil</option>
              <option value={PhoneType.HOME}>Casa</option>
              <option value={PhoneType.WORK}>Trabajo</option>
            </select>
          </div>
          {errors["phones.0.number"] && (
            <p className="text-xs text-destructive">
              {errors["phones.0.number"]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Dirección</Label>
          <Input
            value={formData.addresses[0].street}
            onChange={(e) => {
              const newAddresses = [...formData.addresses];
              newAddresses[0].street = e.target.value;
              setFormData({ ...formData, addresses: newAddresses });
              if (errors["addresses.0.street"]) {
                const newErrors = { ...errors };
                delete newErrors["addresses.0.street"];
                setErrors(newErrors);
              }
            }}
            placeholder="Calle"
            className={
              errors["addresses.0.street"]
                ? "border-destructive focus:border-destructive focus:ring-destructive"
                : ""
            }
          />
          {errors["addresses.0.street"] && (
            <p className="text-xs text-destructive">
              {errors["addresses.0.street"]}
            </p>
          )}
          <Input
            value={formData.addresses[0].city}
            onChange={(e) => {
              const newAddresses = [...formData.addresses];
              newAddresses[0].city = e.target.value;
              setFormData({ ...formData, addresses: newAddresses });
              if (errors["addresses.0.city"]) {
                const newErrors = { ...errors };
                delete newErrors["addresses.0.city"];
                setErrors(newErrors);
              }
            }}
            placeholder="Ciudad"
            className={
              errors["addresses.0.city"]
                ? "border-destructive focus:border-destructive focus:ring-destructive"
                : ""
            }
          />
          {errors["addresses.0.city"] && (
            <p className="text-xs text-destructive">
              {errors["addresses.0.city"]}
            </p>
          )}
        </div>
      </div>
    </GenericModal>
  );
}
