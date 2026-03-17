"use client";

import { useState, useEffect } from "react";
import { GenericModal } from "@/components/common/GenericModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientService } from "@/services/client.service";
import { createClientSchema } from "@/schemas/client.schema";
import { IClient, IClientFormValues, PrismaPhone, PrismaAddress } from "@/types";
import { PhoneType } from "@prisma/client";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: IClient | null;
  viewMode?: boolean;
  onSuccess: () => void;
}

export function ClientModal({
  open,
  onOpenChange,
  client,
  viewMode = false,
  onSuccess,
}: ClientModalProps) {
  const [formData, setFormData] = useState<IClientFormValues>({
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
  const [isViewMode, setIsViewMode] = useState(viewMode);

  useEffect(() => {
    if (client && open) {
      setFormData({
        name: client.name,
        email: client.email || "",
        phones: client.phones.map((p: PrismaPhone) => ({
          number: p.number,
          type: p.type,
          referencia: p.referencia || "",
        })),
        addresses: client.addresses.map((a: PrismaAddress) => ({
          street: a.street,
          city: a.city,
          state: a.state || "",
          zipCode: a.zipCode || "",
          country: a.country || "",
          nota: a.nota || "",
        })),
      });
      setIsViewMode(viewMode);
    } else if (open) {
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
      setIsViewMode(false);
    }
    setErrors({});
  }, [client, viewMode, open]);

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

  const handleAddPhone = () => {
    const newPhones = [...(formData.phones || [])];
    newPhones.push({ number: "", type: PhoneType.MOBILE, referencia: "" });
    setFormData({ ...formData, phones: newPhones });
  };

  const handleRemovePhone = (index: number) => {
    const newPhones = [...(formData.phones || [])];
    newPhones.splice(index, 1);
    setFormData({ ...formData, phones: newPhones });
  };

  const handleAddAddress = () => {
    const newAddresses = [...(formData.addresses || [])];
    newAddresses.push({
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      nota: "",
    });
    setFormData({ ...formData, addresses: newAddresses });
  };

  const handleRemoveAddress = (index: number) => {
    const newAddresses = [...(formData.addresses || [])];
    newAddresses.splice(index, 1);
    setFormData({ ...formData, addresses: newAddresses });
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
      if (client) {
        await clientService.update(client.id, result.data);
        clientSuccessHandler("Cliente actualizado exitosamente");
      } else {
        await clientService.create(result.data);
        clientSuccessHandler("Cliente creado exitosamente");
      }
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
      title={
        client
          ? isViewMode
            ? "Ver Cliente"
            : "Editar Cliente"
          : "Nuevo Cliente"
      }
      description={
        client
          ? isViewMode
            ? "Información del cliente"
            : "Actualizar información del cliente"
          : "Crear un nuevo cliente en el sistema"
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            {isViewMode ? "Cerrar" : "Cancelar"}
          </Button>
          {!isViewMode && (
            <Button onClick={handleSubmit}>
              {client ? "Actualizar" : "Crear Cliente"}
            </Button>
          )}
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
            disabled={isViewMode}
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
            disabled={isViewMode}
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
          <div className="flex items-center justify-between">
            <Label>Teléfonos</Label>
            {!isViewMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPhone}
                className="text-xs"
              >
                + Agregar
              </Button>
            )}
          </div>
          {formData.phones && formData.phones.length > 0
            ? formData.phones.map((phone, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex gap-2">
                    <Input
                      value={phone.number}
                      onChange={(e) => {
                        const newPhones = [...(formData.phones || [])];
                        newPhones[index].number = e.target.value;
                        setFormData({ ...formData, phones: newPhones });
                        if (errors[`phones.${index}.number`]) {
                          const newErrors = { ...errors };
                          delete newErrors[`phones.${index}.number`];
                          setErrors(newErrors);
                        }
                      }}
                      placeholder="Número *"
                      disabled={isViewMode}
                      className={`flex-1 ${errors[`phones.${index}.number`] ? "border-destructive" : ""}`}
                    />
                    <select
                      value={phone.type}
                      onChange={(e) => {
                        const newPhones = [...(formData.phones || [])];
                        newPhones[index].type = e.target.value as PhoneType;
                        setFormData({ ...formData, phones: newPhones });
                      }}
                      disabled={isViewMode}
                      className="px-3 py-2 rounded-md border border-carbon_black-600 bg-carbon_black text-white text-sm"
                    >
                      <option value={PhoneType.MOBILE}>Móvil</option>
                      <option value={PhoneType.HOME}>Casa</option>
                      <option value={PhoneType.WORK}>Trabajo</option>
                    </select>
                    {!isViewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePhone(index)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                  <Input
                    value={phone.referencia || ""}
                    onChange={(e) => {
                      const newPhones = [...(formData.phones || [])];
                      newPhones[index].referencia = e.target.value;
                      setFormData({ ...formData, phones: newPhones });
                    }}
                    placeholder="Referencia (opcional)"
                    disabled={isViewMode}
                    className="text-sm"
                  />
                  {errors[`phones.${index}.number`] && (
                    <p className="text-xs text-destructive">
                      {errors[`phones.${index}.number`]}
                    </p>
                  )}
                </div>
              ))
            : isViewMode && (
                <p className="text-sm text-silver-400">
                  No hay teléfonos registrados
                </p>
              )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Direcciones</Label>
            {!isViewMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAddress}
                className="text-xs"
              >
                + Agregar
              </Button>
            )}
          </div>
          {formData.addresses && formData.addresses.length > 0
            ? formData.addresses.map((address, index) => (
                <div
                  key={index}
                  className="space-y-2 p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        value={address.street}
                        onChange={(e) => {
                          const newAddresses = [
                            ...(formData.addresses || []),
                          ];
                          newAddresses[index].street = e.target.value;
                          setFormData({
                            ...formData,
                            addresses: newAddresses,
                          });
                          if (errors[`addresses.${index}.street`]) {
                            const newErrors = { ...errors };
                            delete newErrors[`addresses.${index}.street`];
                            setErrors(newErrors);
                          }
                        }}
                        placeholder="Calle *"
                        disabled={isViewMode}
                        className={`flex-1 ${errors[`addresses.${index}.street`] ? "border-destructive" : ""}`}
                      />
                      <Input
                        value={address.city}
                        onChange={(e) => {
                          const newAddresses = [
                            ...(formData.addresses || []),
                          ];
                          newAddresses[index].city = e.target.value;
                          setFormData({
                            ...formData,
                            addresses: newAddresses,
                          });
                          if (errors[`addresses.${index}.city`]) {
                            const newErrors = { ...errors };
                            delete newErrors[`addresses.${index}.city`];
                            setErrors(newErrors);
                          }
                        }}
                        placeholder="Ciudad *"
                        disabled={isViewMode}
                        className={`flex-1 ${errors[`addresses.${index}.city`] ? "border-destructive" : ""}`}
                      />
                      {!isViewMode && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAddress(index)}
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={address.state || ""}
                        onChange={(e) => {
                          const newAddresses = [
                            ...(formData.addresses || []),
                          ];
                          newAddresses[index].state = e.target.value;
                          setFormData({
                            ...formData,
                            addresses: newAddresses,
                          });
                        }}
                        placeholder="Estado"
                        disabled={isViewMode}
                        className="text-sm"
                      />
                      <Input
                        value={address.zipCode || ""}
                        onChange={(e) => {
                          const newAddresses = [
                            ...(formData.addresses || []),
                          ];
                          newAddresses[index].zipCode = e.target.value;
                          setFormData({
                            ...formData,
                            addresses: newAddresses,
                          });
                        }}
                        placeholder="Código Postal"
                        disabled={isViewMode}
                        className="text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={address.country || ""}
                        onChange={(e) => {
                          const newAddresses = [
                            ...(formData.addresses || []),
                          ];
                          newAddresses[index].country = e.target.value;
                          setFormData({
                            ...formData,
                            addresses: newAddresses,
                          });
                        }}
                        placeholder="País"
                        disabled={isViewMode}
                        className="text-sm"
                      />
                      <Input
                        value={address.nota || ""}
                        onChange={(e) => {
                          const newAddresses = [
                            ...(formData.addresses || []),
                          ];
                          newAddresses[index].nota = e.target.value;
                          setFormData({
                            ...formData,
                            addresses: newAddresses,
                          });
                        }}
                        placeholder="Nota (opcional)"
                        disabled={isViewMode}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))
            : isViewMode && (
                <p className="text-sm text-silver-400">
                  No hay direcciones registradas
                </p>
              )}
        </div>
      </div>
    </GenericModal>
  );
}
