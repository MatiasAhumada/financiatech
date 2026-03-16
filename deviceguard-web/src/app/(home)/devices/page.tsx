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
import {
  sendNotificationSchema,
  SendNotificationDto,
} from "@/schemas/notification.schema";
import { deviceService } from "@/services/device.service";
import { deviceControlService } from "@/services/deviceControl.service";
import { clientService } from "@/services/client.service";
import { notificationService } from "@/services/notification.service";
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
  Notification03Icon,
} from "hugeicons-react";
import { useDebounce } from "@/hooks/useDebounce";
import { DeviceStatus, DeviceType, NotificationType } from "@prisma/client";
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
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [deviceToBlock, setDeviceToBlock] = useState<IDevice | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [deviceToSendNotification, setDeviceToSendNotification] =
    useState<IDevice | null>(null);
  const [notificationData, setNotificationData] = useState<SendNotificationDto>(
    {
      title: "",
      message: "",
      type: NotificationType.WARNING_1,
    }
  );

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    loadDevices(debouncedSearch || undefined);
  }, [debouncedSearch]);

  useEffect(() => {
    if (
      isModalOpen ||
      isDeleteModalOpen ||
      isBlockModalOpen ||
      isNotificationModalOpen
    ) {
      setOpenMenuId(null);
    }
  }, [
    isModalOpen,
    isDeleteModalOpen,
    isBlockModalOpen,
    isNotificationModalOpen,
  ]);

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

  const handleToggleBlock = (device: IDevice) => {
    setDeviceToBlock(device);
    setOpenMenuId(null);
    setIsBlockModalOpen(true);
  };

  const confirmToggleBlock = async () => {
    if (!deviceToBlock) return;

    try {
      const willBlock = deviceToBlock.status !== DeviceStatus.BLOCKED;

      // Usar FCM para bloqueo/desbloqueo en dispositivos sincronizados
      if (deviceToBlock.sync) {
        if (willBlock) {
          await deviceControlService.lockDevice(deviceToBlock.id);
          clientSuccessHandler(
            `📱 ${deviceToBlock.name} ha sido bloqueado. Notificación enviada al dispositivo.`
          );
        } else {
          await deviceControlService.unlockDevice(deviceToBlock.id);
          clientSuccessHandler(
            `📱 ${deviceToBlock.name} ha sido desbloqueado. Notificación enviada al dispositivo.`
          );
        }
      } else {
        // Para dispositivos no sincronizados, solo actualizar estado localmente
        const newStatus = willBlock
          ? DeviceStatus.BLOCKED
          : DeviceStatus.ACTIVE;
        await deviceService.update(deviceToBlock.id, {
          name: deviceToBlock.name,
          type: deviceToBlock.type,
          model: deviceToBlock.model || "",
          serialNumber: deviceToBlock.serialNumber || "",
          status: newStatus,
        });
        clientSuccessHandler(
          `Dispositivo ${willBlock ? "bloqueado" : "desbloqueado"} exitosamente`
        );
      }

      await loadDevices();
      setIsBlockModalOpen(false);
      setDeviceToBlock(null);
    } catch (error) {
      clientErrorHandler(error);
    }
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

  const handleSendNotification = (device: IDevice) => {
    setDeviceToSendNotification(device);
    setNotificationData({
      title: "",
      message: "",
      type: NotificationType.WARNING_1,
    });
    setOpenMenuId(null);
    setIsNotificationModalOpen(true);
  };

  const confirmSendNotification = async () => {
    if (!deviceToSendNotification) return;

    try {
      await notificationService.send(deviceToSendNotification.id, {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
      });
      clientSuccessHandler("Notificación enviada exitosamente");
      setIsNotificationModalOpen(false);
      setDeviceToSendNotification(null);
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Error al enviar notificación";
      clientErrorHandler({ message: errorMessage });
    }
  };

  const handleCloseNotificationModal = () => {
    setDeviceToSendNotification(null);
    setNotificationData({
      title: "",
      message: "",
      type: NotificationType.WARNING_1,
    });
    setIsNotificationModalOpen(false);
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
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
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
                    <div className="w-10 h-10 border rounded-lg flex items-center justify-center font-semibold bg-onyx border-mahogany_red text-mahogany_red">
                      {initials.toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-base text-onyx">
                        {device.name}
                      </p>
                      <p className="text-sm font-medium text-onyx">
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
                <p className="text-base font-medium text-onyx">
                  {device.model || "Sin modelo"}
                </p>
              ),
            },
            {
              key: "serialNumber",
              label: "SERIAL",
              render: (device: IDevice) => (
                <p className="text-sm font-medium text-silver-500">
                  {device.serialNumber || "Sin serial"}
                </p>
              ),
            },
            {
              key: "client",
              label: "CLIENTE",
              render: (device: IDevice) => (
                <p className="text-base font-medium text-onyx">
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
                  [DeviceStatus.SOLD_PENDING]: {
                    color: "text-yellow-500",
                    label: "Vendido (Pendiente)",
                  },
                  [DeviceStatus.SOLD_SYNCED]: {
                    color: "text-success",
                    label: "Vendido (Sincronizado)",
                  },
                  [DeviceStatus.INACTIVE]: {
                    color: "text-onyx",
                    label: "Inactivo",
                  },
                  [DeviceStatus.MAINTENANCE]: {
                    color: "text-warning font-medium",
                    label: "Mantenimiento",
                  },
                  [DeviceStatus.BLOCKED]: {
                    color: "text-destructive font-medium",
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
                          className="fixed w-48 bg-white_smoke border border-carbon_black-200 rounded-lg shadow-2xl z-50"
                          style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                          }}
                        >
                          <button
                            onClick={() => handleViewDevice(device)}
                            className="w-full text-left px-4 py-2.5 text-sm text-onyx hover:bg-carbon_black-100 rounded-t-lg flex items-center gap-3 transition-colors"
                          >
                            <ViewIcon size={16} className="text-silver-500" />
                            Ver
                          </button>
                          <button
                            onClick={() => handleEditDevice(device)}
                            className="w-full text-left px-4 py-2.5 text-sm text-onyx hover:bg-carbon_black-100 flex items-center gap-3 transition-colors"
                          >
                            <PencilEdit02Icon
                              size={16}
                              className="text-silver-500"
                            />
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleBlock(device)}
                            className="w-full text-left px-4 py-2.5 text-sm text-onyx hover:bg-carbon_black-100 flex items-center gap-3 transition-colors"
                          >
                            {device.status === DeviceStatus.BLOCKED ? (
                              <span>Desbloquear</span>
                            ) : (
                              <span>Bloquear</span>
                            )}
                          </button>
                          {device.status === DeviceStatus.SOLD_SYNCED &&
                            device.sync && (
                              <button
                                onClick={() => handleSendNotification(device)}
                                className="w-full text-left px-4 py-2.5 text-sm text-onyx hover:bg-carbon_black-100 flex items-center gap-3 transition-colors"
                              >
                                <Notification03Icon
                                  size={16}
                                  className="text-silver-500"
                                />
                                Notificaciones
                              </button>
                            )}
                          <button
                            onClick={() => handleDeleteDevice(device)}
                            className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-carbon_black-100 rounded-b-lg flex items-center gap-3 transition-colors"
                          >
                            <Delete02Icon
                              size={16}
                              className="text-destructive"
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
                onClick={handleOpenModal}
                className="gap-2 bg-mahogany_red hover:bg-mahogany_red-600 flex-1 sm:flex-none text-sm"
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
                    ? "border-destructive focus:border-destructive focus:ring-destructive"
                    : ""
                }
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
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
                    ? "border-destructive focus:border-destructive focus:ring-destructive"
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
                <p className="text-xs text-destructive">{errors.type}</p>
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
                className="bg-destructive hover:bg-destructive/90 text-white"
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

        <GenericModal
          open={isBlockModalOpen}
          onOpenChange={setIsBlockModalOpen}
          title={
            deviceToBlock?.status === DeviceStatus.BLOCKED
              ? "Desbloquear Dispositivo"
              : "Bloquear Dispositivo"
          }
          description={
            deviceToBlock?.status === DeviceStatus.BLOCKED
              ? `¿Desbloquear ${deviceToBlock?.name}?`
              : `¿Estás seguro de que deseas bloquear ${deviceToBlock?.name} para pruebas?`
          }
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setIsBlockModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className={
                  deviceToBlock?.status === DeviceStatus.BLOCKED
                    ? "bg-success hover:bg-success-dark text-white"
                    : "bg-destructive hover:bg-destructive/90 text-white"
                }
                onClick={confirmToggleBlock}
              >
                {deviceToBlock?.status === DeviceStatus.BLOCKED
                  ? "Desbloquear"
                  : "Bloquear"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-silver-400">
            {deviceToBlock?.status === DeviceStatus.BLOCKED
              ? "El dispositivo volverá a estar disponible para el usuario."
              : "El dispositivo no podrá ser utilizado hasta que se desbloquee."}
          </p>
        </GenericModal>

        <GenericModal
          open={isNotificationModalOpen}
          onOpenChange={handleCloseNotificationModal}
          title="Enviar Notificación"
          description={`Enviar notificación push a ${deviceToSendNotification?.name}`}
          footer={
            <>
              <Button variant="outline" onClick={handleCloseNotificationModal}>
                Cancelar
              </Button>
              <Button
                className="bg-mahogany_red hover:bg-mahogany_red-600 text-white"
                onClick={confirmSendNotification}
              >
                Enviar Notificación
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-title">Título</Label>
              <Input
                id="notification-title"
                value={notificationData.title}
                onChange={(e) =>
                  setNotificationData({
                    ...notificationData,
                    title: e.target.value,
                  })
                }
                placeholder="Ej: Recordatorio de pago"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-message">Mensaje</Label>
              <Input
                id="notification-message"
                value={notificationData.message}
                onChange={(e) =>
                  setNotificationData({
                    ...notificationData,
                    message: e.target.value,
                  })
                }
                placeholder="Ej: Tienes una cuota próxima a vencer"
              />
            </div>
            <p className="text-xs text-silver-400">
              Esta notificación aparecerá en el dispositivo móvil
              inmediatamente.
            </p>
          </div>
        </GenericModal>
      </div>
    </DashboardLayout>
  );
}
