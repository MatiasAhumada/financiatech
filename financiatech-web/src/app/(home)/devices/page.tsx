"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GenericModal } from "@/components/common/GenericModal";
import { DeviceModal } from "@/components/entities/DeviceModal";
import {
  sendNotificationSchema,
  SendNotificationDto,
} from "@/schemas/notification.schema";
import { deviceService } from "@/services/device.service";
import { deviceControlService } from "@/services/deviceControl.service";
import { clientService } from "@/services/client.service";
import { notificationService } from "@/services/notification.service";
import { IDevice } from "@/types";
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
import { ManualNotificationModal } from "@/components/sales/ManualNotificationModal";

export default function DevicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<IDevice | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<IDevice | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [deviceToBlock, setDeviceToBlock] = useState<IDevice | null>(null);
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [deviceToSendNotification, setDeviceToSendNotification] =
    useState<IDevice | null>(null);
  const [isManualNotifModalOpen, setIsManualNotifModalOpen] = useState(false);
  const [deviceForManualNotif, setDeviceForManualNotif] =
    useState<IDevice | null>(null);
  const [notificationData, setNotificationData] = useState<SendNotificationDto>(
    {
      title: "",
      message: "",
      type: NotificationType.WARNING_1,
    }
  );
  const [notificationErrors, setNotificationErrors] = useState<
    Record<string, string>
  >({});

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
    setSelectedDevice(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleViewDevice = (device: IDevice) => {
    setSelectedDevice(device);
    setIsViewMode(true);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleEditDevice = (device: IDevice) => {
    setSelectedDevice(device);
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
      if (deviceToBlock.status === DeviceStatus.BLOCKED) {
        await deviceControlService.unlockDevice(deviceToBlock.id);
        clientSuccessHandler("Dispositivo desbloqueado exitosamente");
      } else {
        await deviceControlService.lockDevice(deviceToBlock.id);
        clientSuccessHandler("Dispositivo bloqueado exitosamente");
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
    setNotificationErrors({});
    setOpenMenuId(null);
    setIsNotificationModalOpen(true);
  };

  const handleManualNotification = (device: IDevice) => {
    setDeviceForManualNotif(device);
    setOpenMenuId(null);
    setIsManualNotifModalOpen(true);
  };

  const confirmSendNotification = async () => {
    if (!deviceToSendNotification) return;

    const result = sendNotificationSchema.safeParse(notificationData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });
      setNotificationErrors(fieldErrors);
      return;
    }

    try {
      await notificationService.send(deviceToSendNotification.id, result.data);
      clientSuccessHandler("Notificación enviada exitosamente");
      setIsNotificationModalOpen(false);
      setDeviceToSendNotification(null);
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
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
                      <p className="font-semibold text-sm text-white">
                        {device.name}
                      </p>
                      <p className="text-xs font-medium text-silver-400">
                        {device.type}
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
                <p className="text-sm font-medium text-white">
                  {device.model || "Sin modelo"}
                </p>
              ),
            },
            {
              key: "serialNumber",
              label: "SERIAL",
              render: (device: IDevice) => (
                <p className="text-xs font-medium text-silver-400">
                  {device.serialNumber || "Sin serial"}
                </p>
              ),
            },
            {
              key: "client",
              label: "CLIENTE",
              render: (device: IDevice) => (
                <p className="text-sm font-medium text-white">
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
                    color: "text-silver-400",
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
                          className="fixed w-48 bg-carbon_black border border-carbon_black-600 rounded-lg shadow-2xl z-50"
                          style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                          }}
                        >
                          <button
                            onClick={() => handleViewDevice(device)}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx/50 rounded-t-lg flex items-center gap-3 transition-colors"
                          >
                            <ViewIcon size={16} className="text-silver-400" />
                            Ver
                          </button>
                          <button
                            onClick={() => handleEditDevice(device)}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx/50 flex items-center gap-3 transition-colors"
                          >
                            <PencilEdit02Icon
                              size={16}
                              className="text-silver-400"
                            />
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleBlock(device)}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx/50 flex items-center gap-3 transition-colors"
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
                                onClick={() => handleManualNotification(device)}
                                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx/50 flex items-center gap-3 transition-colors"
                              >
                                <Notification03Icon
                                  size={16}
                                  className="text-silver-400"
                                />
                                Notificaciones
                              </button>
                            )}
                          <button
                            onClick={() => handleDeleteDevice(device)}
                            className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-onyx/50 rounded-b-lg flex items-center gap-3 transition-colors"
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
          searchPlaceholder="Buscar por nombre, serial o IMEI..."
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
                className="gap-2 bg-mahogany_red hover:bg-mahogany_red/90 flex-1 sm:flex-none text-sm"
                onClick={handleOpenModal}
              >
                <span className="text-lg text-white">+</span>
                <span className="text-white">Nuevo Dispositivo</span>
              </Button>
            </>
          }
        />

        <DeviceModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          device={selectedDevice}
          viewMode={isViewMode}
          onSuccess={() => {
            loadDevices();
          }}
        />

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
              <Button variant="destructive" onClick={confirmDelete}>
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
          {deviceToBlock?.status === DeviceStatus.BLOCKED ? (
            <p className="text-sm text-silver-400">
              El dispositivo se desbloqueará y podrá ser utilizado normalmente.
            </p>
          ) : (
            <div className="bg-destructive/10 border border-destructive rounded p-3">
              <p className="text-sm text-destructive">
                El dispositivo se bloqueará completamente. El cliente no podrá
                usar el dispositivo hasta que pague o desbloquees manualmente.
              </p>
            </div>
          )}
        </GenericModal>

        <GenericModal
          open={isNotificationModalOpen}
          onOpenChange={setIsNotificationModalOpen}
          title="Enviar Notificación Push"
          description={`Enviando a: ${deviceToSendNotification?.name}`}
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setIsNotificationModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-mahogany_red hover:bg-mahogany_red/90 text-white"
                onClick={confirmSendNotification}
              >
                Enviar
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
                onChange={(e) => {
                  setNotificationData({
                    ...notificationData,
                    title: e.target.value,
                  });
                  if (notificationErrors.title) {
                    const newErrors = { ...notificationErrors };
                    delete newErrors.title;
                    setNotificationErrors(newErrors);
                  }
                }}
                placeholder="Título de la notificación"
                className={
                  notificationErrors.title
                    ? "border-destructive focus:border-destructive focus:ring-destructive"
                    : ""
                }
              />
              {notificationErrors.title && (
                <p className="text-xs text-destructive">
                  {notificationErrors.title}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-message">Mensaje</Label>
              <Input
                id="notification-message"
                value={notificationData.message}
                onChange={(e) => {
                  setNotificationData({
                    ...notificationData,
                    message: e.target.value,
                  });
                  if (notificationErrors.message) {
                    const newErrors = { ...notificationErrors };
                    delete newErrors.message;
                    setNotificationErrors(newErrors);
                  }
                }}
                placeholder="Mensaje de la notificación"
                className={
                  notificationErrors.message
                    ? "border-destructive focus:border-destructive focus:ring-destructive"
                    : ""
                }
              />
              {notificationErrors.message && (
                <p className="text-xs text-destructive">
                  {notificationErrors.message}
                </p>
              )}
            </div>
          </div>
        </GenericModal>

        {deviceForManualNotif && (
          <ManualNotificationModal
            open={isManualNotifModalOpen}
            onOpenChange={setIsManualNotifModalOpen}
            device={deviceForManualNotif}
            onSuccess={() => {
              loadDevices();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
