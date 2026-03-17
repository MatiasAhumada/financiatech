"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GenericModal } from "@/components/common/GenericModal";
import { PasswordInput } from "@/components/common/PasswordInput";
import { createAdminSchema, CreateAdminDto } from "@/schemas/admin.schema";
import { adminService } from "@/services/admin.service";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";
import {
  SmartPhone01Icon,
  Building03Icon,
  UserMultiple02Icon,
  Download01Icon,
  MoreVerticalIcon,
  ViewIcon,
  PencilEdit02Icon,
  Delete02Icon,
} from "hugeicons-react";
import { useDebounce } from "@/hooks/useDebounce";
import { createPortal } from "react-dom";
import { salesUtils } from "@/utils/sales.util";

export function SuperAdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateAdminDto>({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateAdminDto, string>>
  >({});
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalStats, setTotalStats] = useState({
    admins: 0,
    devices: 0,
    clients: 0,
  });
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    loadAdmins();
    loadStats();
  }, []);

  useEffect(() => {
    loadAdmins(debouncedSearch || undefined);
  }, [debouncedSearch]);

  const loadStats = async () => {
    try {
      const stats = await adminService.getStats();
      setTotalStats(stats);
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  const loadAdmins = async (search?: string) => {
    try {
      setLoading(true);
      const data = await adminService.getAll(search);
      setAdmins(data);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({ name: "", email: "", password: "" });
    setErrors({});
    setSelectedAdmin(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleViewAdmin = (admin: any) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.user.name,
      email: admin.user.email,
      password: "",
    });
    setIsViewMode(true);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleEditAdmin = (admin: any) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.user.name,
      email: admin.user.email,
      password: "",
    });
    setIsViewMode(false);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleDeleteAdmin = async (adminId: string) => {
    setOpenMenuId(null);
    clientErrorHandler(new Error("Funcionalidad en desarrollo"));
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCloseModal = () => {
    setFormData({ name: "", email: "", password: "" });
    setErrors({});
    setSelectedAdmin(null);
    setIsViewMode(false);
    setIsModalOpen(false);
  };

  const handleSubmit = async () => {
    const result = createAdminSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CreateAdminDto, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof CreateAdminDto] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await adminService.create(result.data);
      clientSuccessHandler("Organización creada exitosamente");
      await loadAdmins();
      await loadStats();
      handleCloseModal();
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            title="TOTAL DISPOSITIVOS"
            value={salesUtils.formatNumber(totalStats.devices)}
            trend={
              totalStats.devices === 0
                ? { value: "Sin dispositivos", isPositive: false }
                : {
                    value: `${totalStats.admins} organizaciones`,
                    isPositive: true,
                  }
            }
            icon={SmartPhone01Icon}
            iconColor="bg-mahogany_red"
            animationDelay={0.05}
          />
          <StatCard
            title="ADMINS ACTIVOS"
            value={salesUtils.formatNumber(totalStats.admins)}
            trend={{
              value: `${totalStats.admins} organizaciones`,
              isPositive: true,
            }}
            icon={Building03Icon}
            iconColor="bg-mahogany_red"
            animationDelay={0.1}
          />
          <StatCard
            title="CLIENTES TOTALES"
            value={salesUtils.formatNumber(totalStats.clients)}
            trend={
              totalStats.clients === 0
                ? { value: "Sin clientes", isPositive: false }
                : {
                    value: `${totalStats.admins} organizaciones`,
                    isPositive: true,
                  }
            }
            icon={UserMultiple02Icon}
            iconColor="bg-mahogany_red"
            animationDelay={0.15}
          />
        </div>

        <DataTable
          title="GESTIÓN DE ORGANIZACIONES"
          subtitle="Control centralizado de clientes y suscripciones corporativas"
          columns={[
            {
              key: "admin",
              label: "EMPRESA / ADMIN",
              render: (admin: any) => {
                const initials = admin.user.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-onyx-600 border border-mahogany_red rounded-lg flex items-center justify-center font-semibold text-mahogany_red">
                      {initials}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">
                        {admin.user.name}
                      </p>
                      <p className="text-xs text-silver-400">
                        {admin.user.email}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              key: "devices",
              label: "DISPOSITIVOS",
              render: (admin: any) => {
                const deviceCount = admin.devices?.length || 0;
                return (
                  <div>
                    <p className="font-medium text-white">{salesUtils.formatNumber(deviceCount)}</p>
                    <p className="text-xs text-silver-400">dispositivos</p>
                  </div>
                );
              },
            },
            {
              key: "clients",
              label: "CLIENTES",
              render: (admin: any) => {
                const clientCount = admin.clients?.length || 0;
                return (
                  <div>
                    <p className="font-medium text-white">{salesUtils.formatNumber(clientCount)}</p>
                    <p className="text-xs text-silver-400">clientes</p>
                  </div>
                );
              },
            },
            {
              key: "createdAt",
              label: "CREACIÓN",
              render: (admin: any) => (
                <p className="text-xs text-silver-400">
                  {salesUtils.formatDate(admin.createdAt)}
                </p>
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              render: (admin: any) => (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuPosition({
                        top: rect.bottom + 4,
                        left: rect.right - 200,
                      });
                      setOpenMenuId(openMenuId === admin.id ? null : admin.id);
                    }}
                    className="p-2 hover:bg-mahogany_red/20 rounded-lg transition-colors border border-transparent hover:border-mahogany_red"
                  >
                    <MoreVerticalIcon size={20} className="text-silver-400" />
                  </button>
                  {openMenuId === admin.id &&
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
                            onClick={() => handleViewAdmin(admin)}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx/50 rounded-t-lg flex items-center gap-3 transition-colors"
                          >
                            <ViewIcon size={16} className="text-silver-400" />
                            Ver
                          </button>
                          <button
                            onClick={() => handleEditAdmin(admin)}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx/50 flex items-center gap-3 transition-colors"
                          >
                            <PencilEdit02Icon
                              size={16}
                              className="text-silver-400"
                            />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
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
          data={admins}
          keyExtractor={(admin: any) => admin.id}
          emptyMessage="No hay organizaciones creadas"
          loading={loading}
          searchPlaceholder="Buscar..."
          onSearch={handleSearch}
          totalLabel={`MOSTRANDO ${admins.length} ORGANIZACIONES`}
          actions={
            <>
              <Button
                variant="outline"
                className="gap-2 border-silver-400 text-white hover:bg-carbon_black flex-1 sm:flex-none text-sm"
              >
                <Download01Icon size={16} />
                <span className="hidden sm:inline">Exportar Reporte</span>
              </Button>
              <Button
                className="gap-2 bg-mahogany_red hover:bg-mahogany_red-600 flex-1 sm:flex-none text-sm"
                onClick={handleOpenModal}
              >
                <span className="text-lg text-white">+</span>
                <span className="text-white">Nueva</span>
              </Button>
            </>
          }
        />

        <GenericModal
          open={isModalOpen}
          onOpenChange={handleCloseModal}
          title={
            selectedAdmin
              ? isViewMode
                ? "Ver Organización"
                : "Editar Organización"
              : "Nueva Organización"
          }
          description={
            selectedAdmin
              ? isViewMode
                ? "Información de la organización"
                : "Actualizar información de la organización"
              : "Crear un nuevo administrador y su organización"
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
                  {selectedAdmin ? "Actualizar" : "Crear Organización"}
                </Button>
              )}
            </>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Administrador</Label>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="admin@empresa.com"
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
              <Label htmlFor="password">
                Contraseña{selectedAdmin && " (dejar vacío para no cambiar)"}
              </Label>
              <PasswordInput
                value={formData.password}
                onChange={(value) => {
                  setFormData({ ...formData, password: value });
                  if (errors.password)
                    setErrors({ ...errors, password: undefined });
                }}
                error={errors.password}
                showRequirements={!isViewMode && !selectedAdmin}
              />
            </div>
          </div>
        </GenericModal>
      </div>
    </DashboardLayout>
  );
}
