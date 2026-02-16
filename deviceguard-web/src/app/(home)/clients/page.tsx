"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GenericModal } from "@/components/common/GenericModal";
import { createClientSchema } from "@/schemas/client.schema";
import { clientService } from "@/services/client.service";
import {
  IClient,
  IClientFormValues,
  PrismaPhone,
  PrismaAddress,
} from "@/types";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";
import {
  UserMultiple02Icon,
  Download01Icon,
  MoreVerticalIcon,
  ViewIcon,
  PencilEdit02Icon,
  Delete02Icon,
  CheckmarkCircle02Icon,
} from "hugeicons-react";
import { useDebounce } from "@/hooks/useDebounce";
import { PhoneType } from "@prisma/client";
import { createPortal } from "react-dom";
import { getCenteredMenuPosition } from "@/utils/menu.util";

export default function ClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<IClientFormValues>({
    name: "",
    email: "",
    phones: [],
    addresses: [],
  });
  const [errors, setErrors] = useState<any>({});
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<IClient | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    loadClients(debouncedSearch || undefined);
  }, [debouncedSearch]);

  useEffect(() => {
    if (isModalOpen || isDeleteModalOpen) {
      setOpenMenuId(null);
    }
  }, [isModalOpen, isDeleteModalOpen]);

  const loadClients = async (search?: string) => {
    try {
      setLoading(true);
      const data = await clientService.getAll(search);
      setClients(data);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({ name: "", email: "", phones: [], addresses: [] });
    setErrors({});
    setSelectedClient(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleViewClient = (client: IClient) => {
    setSelectedClient(client);
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
    setIsViewMode(true);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: IClient) => {
    setSelectedClient(client);
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
    setIsViewMode(false);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleDeleteClient = (client: IClient) => {
    setClientToDelete(client);
    setOpenMenuId(null);
    setIsDeleteModalOpen(true);
  };

  const handleRestoreClient = async (client: IClient) => {
    setOpenMenuId(null);
    try {
      await clientService.restore(client.id);
      clientSuccessHandler("Cliente restaurado exitosamente");
      await loadClients();
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await clientService.delete(clientToDelete.id);
      clientSuccessHandler("Cliente eliminado exitosamente");
      await loadClients();
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  const handleCloseModal = () => {
    setFormData({ name: "", email: "", phones: [], addresses: [] });
    setErrors({});
    setSelectedClient(null);
    setIsViewMode(false);
    setIsModalOpen(false);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleAddPhone = () => {
    setFormData({
      ...formData,
      phones: [
        ...(formData.phones || []),
        { number: "", type: PhoneType.MOBILE, referencia: "" },
      ],
    });
  };

  const handleRemovePhone = (index: number) => {
    const newPhones = [...(formData.phones || [])];
    newPhones.splice(index, 1);
    setFormData({ ...formData, phones: newPhones });
  };

  const handleAddAddress = () => {
    setFormData({
      ...formData,
      addresses: [
        ...(formData.addresses || []),
        { street: "", city: "", state: "", zipCode: "", country: "", nota: "" },
      ],
    });
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
      if (selectedClient) {
        await clientService.update(selectedClient.id, result.data);
        clientSuccessHandler("Cliente actualizado exitosamente");
      } else {
        await clientService.create(result.data);
        clientSuccessHandler("Cliente creado exitosamente");
      }
      await loadClients();
      handleCloseModal();
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 bg-onyx min-h-screen space-y-6">
        <DataTable
          title="GESTIÓN DE CLIENTES"
          subtitle="Administración de clientes y sus datos de contacto"
          onRowClick={(client: IClient) => {
            if (window.innerWidth < 640) {
              setMenuPosition(getCenteredMenuPosition());
              setOpenMenuId(client.id);
            }
          }}
          columns={[
            {
              key: "client",
              label: "CLIENTE",
              render: (client: IClient) => {
                const initials = client.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 border rounded-lg flex items-center justify-center font-semibold ${
                        client.deletedAt
                          ? "bg-onyx-600 border-silver-400 text-silver-400 opacity-50"
                          : "bg-onyx-600 border-mahogany_red text-mahogany_red"
                      }`}
                    >
                      {initials}
                    </div>
                    <div>
                      <p
                        className={`font-medium ${client.deletedAt ? "text-silver-400" : "text-white"}`}
                      >
                        {client.name}
                      </p>
                      <p className="text-sm text-silver-400">
                        {client.email || "Sin email"}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              key: "phones",
              label: "TELÉFONOS",
              render: (client: IClient) => {
                const phoneCount = client.phones?.length || 0;
                return (
                  <div>
                    <p className="font-medium text-white">{phoneCount}</p>
                    <p className="text-sm text-silver-400">teléfonos</p>
                  </div>
                );
              },
            },
            {
              key: "devices",
              label: "DISPOSITIVOS",
              render: (client: IClient) => {
                const deviceCount = client.devices?.length || 0;
                return (
                  <div>
                    <p className="font-medium text-white">{deviceCount}</p>
                    <p className="text-sm text-silver-400">dispositivos</p>
                  </div>
                );
              },
            },
            {
              key: "createdAt",
              label: "CREACIÓN",
              render: (client: IClient) => (
                <p className="text-sm text-silver-400">
                  {new Date(client.createdAt).toLocaleDateString()}
                </p>
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              render: (client: IClient) => (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuPosition({
                        top: rect.bottom + 4,
                        left: rect.right - 200,
                      });
                      setOpenMenuId(
                        openMenuId === client.id ? null : client.id
                      );
                    }}
                    className="p-2 hover:bg-mahogany_red/20 rounded-lg transition-colors border border-transparent hover:border-mahogany_red hidden sm:block"
                  >
                    <MoreVerticalIcon size={20} className="text-silver-400" />
                  </button>
                  {openMenuId === client.id &&
                    createPortal(
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div
                          className="fixed w-48 bg-carbon_black border border-carbon_black-600 rounded-lg shadow-2xl z-50"
                          style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                          }}
                        >
                          <button
                            onClick={() => handleViewClient(client)}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx-600 rounded-t-lg flex items-center gap-3 transition-colors"
                          >
                            <ViewIcon size={16} className="text-silver-400" />
                            Ver
                          </button>
                          {!client.deletedAt && (
                            <>
                              <button
                                onClick={() => handleEditClient(client)}
                                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx-600 flex items-center gap-3 transition-colors"
                              >
                                <PencilEdit02Icon
                                  size={16}
                                  className="text-silver-400"
                                />
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client)}
                                className="w-full text-left px-4 py-2.5 text-sm text-strawberry_red hover:bg-onyx-600 rounded-b-lg flex items-center gap-3 transition-colors"
                              >
                                <Delete02Icon
                                  size={16}
                                  className="text-strawberry_red"
                                />
                                Eliminar
                              </button>
                            </>
                          )}
                          {client.deletedAt && (
                            <button
                              onClick={() => handleRestoreClient(client)}
                              className="w-full text-left px-4 py-2.5 text-sm text-green-500 hover:bg-onyx-600 rounded-b-lg flex items-center gap-3 transition-colors"
                            >
                              <CheckmarkCircle02Icon
                                size={16}
                                className="text-green-500"
                              />
                              Activar
                            </button>
                          )}
                        </div>
                      </>,
                      document.body
                    )}
                </div>
              ),
            },
          ]}
          data={clients}
          keyExtractor={(client: IClient) => client.id}
          emptyMessage="No hay clientes registrados"
          loading={loading}
          searchPlaceholder="Buscar..."
          onSearch={handleSearch}
          totalLabel={`MOSTRANDO ${clients.length} CLIENTES`}
          actions={
            <>
              <Button
                variant="outline"
                className="gap-2 border-silver-400 text-white hover:bg-carbon_black flex-1 sm:flex-none text-sm"
              >
                <Download01Icon size={16} />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              <Button
                className="gap-2 bg-mahogany_red hover:bg-mahogany_red-600 flex-1 sm:flex-none text-sm"
                onClick={handleOpenModal}
              >
                <span className="text-lg text-white">+</span>
                <span className="text-white">Nuevo Cliente</span>
              </Button>
            </>
          }
        />

        <GenericModal
          open={isModalOpen}
          onOpenChange={handleCloseModal}
          title={
            selectedClient
              ? isViewMode
                ? "Ver Cliente"
                : "Editar Cliente"
              : "Nuevo Cliente"
          }
          description={
            selectedClient
              ? isViewMode
                ? "Información del cliente"
                : "Actualizar información del cliente"
              : "Crear un nuevo cliente en el sistema"
          }
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={handleCloseModal}>
                {isViewMode ? "Cerrar" : "Cancelar"}
              </Button>
              {!isViewMode && (
                <Button
                  className="bg-mahogany_red hover:bg-mahogany_red-600 text-amber-50"
                  onClick={handleSubmit}
                >
                  {selectedClient ? "Actualizar" : "Crear Cliente"}
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
                    ? "border-mahogany_red focus:border-mahogany_red focus:ring-mahogany_red"
                    : ""
                }
              />
              {errors.name && (
                <p className="text-xs text-mahogany_red">{errors.name}</p>
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
                    ? "border-mahogany_red focus:border-mahogany_red focus:ring-mahogany_red"
                    : ""
                }
              />
              {errors.email && (
                <p className="text-xs text-mahogany_red">{errors.email}</p>
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
                          className={`flex-1 ${errors[`phones.${index}.number`] ? "border-mahogany_red" : ""}`}
                        />
                        <select
                          value={phone.type}
                          onChange={(e) => {
                            const newPhones = [...(formData.phones || [])];
                            newPhones[index].type = e.target.value as PhoneType;
                            setFormData({ ...formData, phones: newPhones });
                          }}
                          disabled={isViewMode}
                          className="px-3 py-2 rounded-md border bg-background text-sm"
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
                        <p className="text-xs text-mahogany_red">
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
                            className={`flex-1 ${errors[`addresses.${index}.street`] ? "border-mahogany_red" : ""}`}
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
                        {errors[`addresses.${index}.street`] && (
                          <p className="text-xs text-mahogany_red">
                            {errors[`addresses.${index}.street`]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
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
                          className={
                            errors[`addresses.${index}.city`]
                              ? "border-mahogany_red"
                              : ""
                          }
                        />
                        {errors[`addresses.${index}.city`] && (
                          <p className="text-xs text-mahogany_red">
                            {errors[`addresses.${index}.city`]}
                          </p>
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
                        />
                      </div>
                      <Input
                        value={address.country || ""}
                        onChange={(e) => {
                          const newAddresses = [...(formData.addresses || [])];
                          newAddresses[index].country = e.target.value;
                          setFormData({ ...formData, addresses: newAddresses });
                        }}
                        placeholder="País"
                        disabled={isViewMode}
                      />
                      <Input
                        value={address.nota || ""}
                        onChange={(e) => {
                          const newAddresses = [...(formData.addresses || [])];
                          newAddresses[index].nota = e.target.value;
                          setFormData({ ...formData, addresses: newAddresses });
                        }}
                        placeholder="Nota (opcional)"
                        disabled={isViewMode}
                        className="text-sm"
                      />
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

        <GenericModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          title="Eliminar Cliente"
          description={`¿Estás seguro de que deseas eliminar a ${clientToDelete?.name}? Esta acción no se puede deshacer.`}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-strawberry_red hover:bg-strawberry_red/90 text-white"
                onClick={confirmDelete}
              >
                Eliminar
              </Button>
            </>
          }
        >
          <p className="text-sm text-silver-400">
            Se eliminarán todos los datos asociados incluyendo teléfonos y
            direcciones.
          </p>
        </GenericModal>
      </div>
    </DashboardLayout>
  );
}
