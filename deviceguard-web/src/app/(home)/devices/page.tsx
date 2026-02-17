"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GenericModal } from "@/components/common/GenericModal";
import {
  createDeviceSchema,
  DEVICE_TYPE_LABELS,
} from "@/schemas/device.schema";
import { deviceService } from "@/services/device.service";
import { clientService } from "@/services/client.service";
import { IDevice, IDeviceFormValues } from "@/types";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";
import {
  Download01Icon,
  MoreVerticalIcon,
  ViewIcon,
  PencilEdit02Icon,
  Delete02Icon,
} from "hugeicons-react";
import { useDebounce } from "@/hooks/useDebounce";
import { DeviceStatus, DeviceType } from "@prisma/client";
import { createPortal } from "react-dom";
import { getCenteredMenuPosition } from "@/utils/menu.util";

export default function DevicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<IDeviceFormValues>({
    name: "",
    type: DeviceType.SMARTPHONE,
    model: "",
    serialNumber: "",
    status: DeviceStatus.ACTIVE,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedDevice, setSelectedDevice] = useState<IDevice | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<IDevice | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    loadDevices(debouncedSearch || undefined);
  }, [debouncedSearch]);

  useEffect(() => {
    if (isModalOpen || isDeleteModalOpen) {
      setOpenMenuId(null);
    }
  }, [isModalOpen, isDeleteModalOpen]);

  const loadDevices = async (search?: string) => {
    try {
      setLoading(true);
      const data = await deviceService.getAll(search);
      setDevices(data);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      name: "",
      type: DeviceType.SMARTPHONE,
      model: "",
      serialNumber: "",
      status: DeviceStatus.ACTIVE,
    });
    setErrors({});
    setSelectedDevice(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleViewDevice = (device: IDevice) => {
    setSelectedDevice(device);
    setFormData({
      name: device.name,
      type: device.type,
      model: device.model || "",
      serialNumber: device.serialNumber || "",
      status: device.status,
    });
    setIsViewMode(true);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleEditDevice = (device: IDevice) => {
    setSelectedDevice(device);
    setFormData({
      name: device.name,
      type: device.type,
      model: device.model || "",
      serialNumber: device.serialNumber || "",
      status: device.status,
    });
    setIsViewMode(false);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleDeleteDevice = (device: IDevice) => {
    setDeviceToDelete(device);
    setOpenMenuId(null);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deviceToDelete) return;

    try {
      await deviceService.delete(deviceToDelete.id);
      clientSuccessHandler("Dispositivo eliminado exitosamente");
      await loadDevices();
      setIsDeleteModalOpen(false);
      setDeviceToDelete(null);
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  const handleCloseModal = () => {
    setFormData({
      name: "",
      type: DeviceType.SMARTPHONE,
      model: "",
      serialNumber: "",
      status: DeviceStatus.ACTIVE,
    });
    setErrors({});
    setSelectedDevice(null);
    setIsViewMode(false);
    setIsModalOpen(false);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleSubmit = async () => {
    const result = createDeviceSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      if (selectedDevice) {
        await deviceService.update(selectedDevice.id, result.data);
        clientSuccessHandler("Dispositivo actualizado exitosamente");
      } else {
        await deviceService.create(result.data);
        clientSuccessHandler("Dispositivo creado exitosamente");
      }
      await loadDevices();
      handleCloseModal();
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 bg-onyx min-h-screen space-y-6">
        <DataTable
          title="GESTIÓN DE DISPOSITIVOS"
          subtitle="Administración de dispositivos y su estado"
          onRowClick={(device: IDevice) => {
            if (window.innerWidth < 640) {
              setMenuPosition(getCenteredMenuPosition());
              setOpenMenuId(device.id);
            }
          }}
          columns={[
            {
              key: "device",
              label: "DISPOSITIVO",
              render: (device: IDevice) => {
                const initials = device.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("");

                return (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border rounded-lg flex items-center justify-center font-semibold bg-onyx-600 border-mahogany_red text-mahogany_red">
                      {initials.toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{device.name}</p>
                      <p className="text-sm text-silver-400">
                        {DEVICE_TYPE_LABELS[device.type]}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              key: "model",
              label: "MODELO",
              render: (device: IDevice) => (
                <p className="text-sm text-white">
                  {device.model || "Sin modelo"}
                </p>
              ),
            },
            {
              key: "serialNumber",
              label: "SERIAL",
              render: (device: IDevice) => (
                <p className="text-sm text-silver-400">
                  {device.serialNumber || "Sin serial"}
                </p>
              ),
            },
            {
              key: "client",
              label: "CLIENTE",
              render: (device: IDevice) => (
                <p className="text-sm text-white">
                  {device.client?.name || "Sin asignar"}
                </p>
              ),
            },
            {
              key: "status",
              label: "ESTADO",
              render: (device: IDevice) => {
                const statusConfig: Record<
                  DeviceStatus,
                  { color: string; label: string }
                > = {
                  [DeviceStatus.ACTIVE]: {
                    color: "text-green-500",
                    label: "Activo",
                  },
                  [DeviceStatus.INACTIVE]: {
                    color: "text-silver-400",
                    label: "Inactivo",
                  },
                  [DeviceStatus.MAINTENANCE]: {
                    color: "text-yellow-500",
                    label: "Mantenimiento",
                  },
                  [DeviceStatus.BLOCKED]: {
                    color: "text-strawberry_red",
                    label: "Bloqueado",
                  },
                };
                const config = statusConfig[device.status];
                return (
                  <p className={`text-sm font-medium ${config.color}`}>
                    {config.label}
                  </p>
                );
              },
            },
            {
              key: "actions",
              label: "ACCIONES",
              render: (device: IDevice) => (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuPosition({
                        top: rect.bottom + 4,
                        left: rect.right - 200,
                      });
                      setOpenMenuId(
                        openMenuId === device.id ? null : device.id
                      );
                    }}
                    className="p-2 hover:bg-mahogany_red/20 rounded-lg transition-colors border border-transparent hover:border-mahogany_red hidden sm:block"
                  >
                    <MoreVerticalIcon size={20} className="text-silver-400" />
                  </button>
                  {openMenuId === device.id &&
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
                            onClick={() => handleViewDevice(device)}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx-600 rounded-t-lg flex items-center gap-3 transition-colors"
                          >
                            <ViewIcon size={16} className="text-silver-400" />
                            Ver
                          </button>
                          <button
                            onClick={() => handleEditDevice(device)}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx-600 flex items-center gap-3 transition-colors"
                          >
                            <PencilEdit02Icon
                              size={16}
                              className="text-silver-400"
                            />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteDevice(device)}
                            className="w-full text-left px-4 py-2.5 text-sm text-strawberry_red hover:bg-onyx-600 rounded-b-lg flex items-center gap-3 transition-colors"
                          >
                            <Delete02Icon
                              size={16}
                              className="text-strawberry_red"
                            />
                            Eliminar
                          </button>
                        </div>
                      </>,
                      document.body
                    )}
                </div>
              ),
            },
          ]}
          data={devices}
          keyExtractor={(device: IDevice) => device.id}
          emptyMessage="No hay dispositivos registrados"
          loading={loading}
          searchPlaceholder="Buscar..."
          onSearch={handleSearch}
          totalLabel={`MOSTRANDO ${devices.length} DISPOSITIVOS`}
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
                <span className="text-white">Nuevo Dispositivo</span>
              </Button>
            </>
          }
        />

        <GenericModal
          open={isModalOpen}
          onOpenChange={handleCloseModal}
          title={
            selectedDevice
              ? isViewMode
                ? "Ver Dispositivo"
                : "Editar Dispositivo"
              : "Nuevo Dispositivo"
          }
          description={
            selectedDevice
              ? isViewMode
                ? "Información del dispositivo"
                : "Actualizar información del dispositivo"
              : "Crear un nuevo dispositivo en el sistema"
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
                  {selectedDevice ? "Actualizar" : "Crear Dispositivo"}
                </Button>
              )}
            </>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="Ingrese el nombre del dispositivo"
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
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    type: e.target.value as DeviceType,
                  });
                  if (errors.type) setErrors({ ...errors, type: "" });
                }}
                disabled={isViewMode}
                className={`w-full px-3 py-2 rounded-md border bg-background text-sm ${
                  errors.type
                    ? "border-mahogany_red focus:border-mahogany_red focus:ring-mahogany_red"
                    : ""
                }`}
              >
                {Object.entries(DEVICE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-xs text-mahogany_red">{errors.type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo (Opcional)</Label>
              <Input
                id="model"
                value={formData.model || ""}
                onChange={(e) => {
                  setFormData({ ...formData, model: e.target.value });
                }}
                placeholder="Ej: MacBook Pro 2023"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Número de Serie (Opcional)</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber || ""}
                onChange={(e) => {
                  setFormData({ ...formData, serialNumber: e.target.value });
                }}
                placeholder="Ej: ABC123XYZ"
                disabled={isViewMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    status: e.target.value as DeviceStatus,
                  });
                }}
                disabled={isViewMode}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm"
              >
                <option value={DeviceStatus.ACTIVE}>Activo</option>
                <option value={DeviceStatus.INACTIVE}>Inactivo</option>
                <option value={DeviceStatus.MAINTENANCE}>Mantenimiento</option>
                <option value={DeviceStatus.BLOCKED}>Bloqueado</option>
              </select>
            </div>
          </div>
        </GenericModal>

        <GenericModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          title="Eliminar Dispositivo"
          description={`¿Estás seguro de que deseas eliminar ${deviceToDelete?.name}? Esta acción no se puede deshacer.`}
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
            Se eliminarán todos los datos asociados al dispositivo.
          </p>
        </GenericModal>
      </div>
    </DashboardLayout>
  );
}
