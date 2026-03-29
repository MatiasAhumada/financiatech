"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { ClientModal } from "@/components/entities/ClientModal";
import { GenericModal } from "@/components/common/GenericModal";
import { clientService } from "@/services/client.service";
import { IClient } from "@/types";
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
import { createPortal } from "react-dom";
import { getCenteredMenuPosition } from "@/utils/menu.util";
import { salesUtils } from "@/utils/sales.util";

export default function ClientsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<IClient | null>(null);
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

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
    setSelectedClient(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleViewClient = (client: IClient) => {
    setSelectedClient(client);
    setIsViewMode(true);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: IClient) => {
    setSelectedClient(client);
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

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
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
                        className={`font-semibold text-sm ${client.deletedAt ? "text-silver-400" : "text-white"}`}
                      >
                        {client.name}
                      </p>
                      <p className="text-xs font-medium text-silver-400">
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
                    <p className="font-semibold text-sm text-white">
                      {phoneCount}
                    </p>
                    <p className="text-xs font-medium text-silver-400">
                      teléfonos
                    </p>
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
                    <p className="font-semibold text-sm text-white">
                      {deviceCount}
                    </p>
                    <p className="text-xs font-medium text-silver-400">
                      dispositivos
                    </p>
                  </div>
                );
              },
            },
            {
              key: "createdAt",
              label: "CREACIÓN",
              render: (client: IClient) => (
                <p className="text-xs font-medium text-silver-400">
                  {salesUtils.formatDate(client.createdAt)}
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
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx/50 rounded-t-lg flex items-center gap-3 transition-colors"
                          >
                            <ViewIcon size={16} className="text-silver-400" />
                            Ver
                          </button>
                          {!client.deletedAt && (
                            <>
                              <button
                                onClick={() => handleEditClient(client)}
                                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx/50 flex items-center gap-3 transition-colors"
                              >
                                <PencilEdit02Icon
                                  size={16}
                                  className="text-silver-400"
                                />
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteClient(client)}
                                className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-onyx/50 rounded-b-lg flex items-center gap-3 transition-colors"
                              >
                                <Delete02Icon
                                  size={16}
                                  className="text-destructive"
                                />
                                Eliminar
                              </button>
                            </>
                          )}
                          {client.deletedAt && (
                            <button
                              onClick={() => handleRestoreClient(client)}
                              className="w-full text-left px-4 py-2.5 text-sm text-success hover:bg-onyx/50 rounded-b-lg flex items-center gap-3 transition-colors"
                            >
                              <CheckmarkCircle02Icon
                                size={16}
                                className="text-success"
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
                className="gap-2 bg-mahogany_red hover:bg-mahogany_red/90 flex-1 sm:flex-none text-sm"
                onClick={handleOpenModal}
              >
                <span className="text-lg text-white">+</span>
                <span className="text-white">Nuevo Cliente</span>
              </Button>
            </>
          }
        />

        <ClientModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          client={selectedClient}
          viewMode={isViewMode}
          onSuccess={() => {
            loadClients();
          }}
        />

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
              <Button variant="destructive" onClick={confirmDelete}>
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
