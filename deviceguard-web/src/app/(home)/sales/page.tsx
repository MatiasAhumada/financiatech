"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { saleService } from "@/services/sale.service";
import { deviceService } from "@/services/device.service";
import { clientService } from "@/services/client.service";
import { financingPlanService } from "@/services/financingPlan.service";
import { ISale, IDevice, IClient, IFinancingPlan } from "@/types";
import {
  clientErrorHandler,
  clientSuccessHandler,
} from "@/utils/handlers/clientError.handler";
import {
  Download01Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
  Delete02Icon,
} from "hugeicons-react";
import { useDebounce } from "@/hooks/useDebounce";
import { SaleModal } from "@/components/sales/SaleModal";
import { GenericModal } from "@/components/common/GenericModal";
import { createPortal } from "react-dom";

export default function SalesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sales, setSales] = useState<ISale[]>([]);
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [clients, setClients] = useState<IClient[]>([]);
  const [financingPlans, setFinancingPlans] = useState<IFinancingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedSale, setSelectedSale] = useState<ISale | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSales(debouncedSearch || undefined);
  }, [debouncedSearch]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, devicesData, clientsData, plansData] =
        await Promise.all([
          saleService.getAll(),
          deviceService.getAll(),
          clientService.getAll(),
          financingPlanService.getAll(),
        ]);
      setSales(salesData);
      setDevices(devicesData);
      setClients(clientsData);
      setFinancingPlans(plansData);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async (search?: string) => {
    try {
      setLoading(true);
      const data = await saleService.getAll(search);
      setSales(data);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleSaleCreated = async () => {
    setIsModalOpen(false);
    setSelectedSale(null);
    await loadData();
  };

  const toggleRow = (saleId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedRows(newExpanded);
  };

  const handleEditSale = (sale: ISale) => {
    setSelectedSale(sale);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleDeleteSale = (sale: ISale) => {
    setSelectedSale(sale);
    setOpenMenuId(null);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSale) return;

    try {
      await saleService.delete(selectedSale.id);
      clientSuccessHandler("Venta eliminada exitosamente");
      await loadData();
      setIsDeleteModalOpen(false);
      setSelectedSale(null);
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  const todaySales = sales.filter(
    (sale) =>
      new Date(sale.createdAt).toDateString() === new Date().toDateString()
  );
  const todayTotal = todaySales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount),
    0
  );
  const newDevicesCount = devices.filter((d) => d.status === "ACTIVE").length;
  const pendingPayments = 14;
  const avgTicket = sales.length > 0 ? todayTotal / sales.length : 0;
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white_smoke border border-white_smoke/20 rounded-lg shadow-sm p-6">
            <p className="text-sm font-semibold text-onyx uppercase tracking-wide mb-2">
              VENTAS HOY
            </p>
            <p className="text-4xl font-bold text-onyx">
              ${todayTotal.toFixed(2)}
            </p>
          </div>
          <div className="bg-white_smoke border border-white_smoke/20 rounded-lg shadow-sm p-6">
            <p className="text-sm font-semibold text-onyx uppercase tracking-wide mb-2">
              DISPOSITIVOS NUEVOS
            </p>
            <p className="text-4xl font-bold text-onyx">{newDevicesCount}</p>
            <p className="text-sm font-medium text-success mt-1">
              +12% vs ayer
            </p>
          </div>
          <div className="bg-white_smoke border border-white_smoke/20 rounded-lg shadow-sm p-6">
            <p className="text-sm font-semibold text-onyx uppercase tracking-wide mb-2">
              PENDIENTES DE PAGO
            </p>
            <p className="text-4xl font-bold text-destructive">
              {pendingPayments}
            </p>
            <p className="text-sm font-medium  text-destructive mt-1">
              Requieren atención
            </p>
          </div>
          <div className="bg-white_smoke border border-white_smoke/20 rounded-lg shadow-sm p-6">
            <p className="text-sm font-semibold text-onyx uppercase tracking-wide mb-2">
              TICKET PROMEDIO
            </p>
            <p className="text-4xl font-bold text-onyx">
              ${avgTicket.toFixed(2)}
            </p>
            <p className="text-sm font-mediummt-1">Últimos 30 días</p>
          </div>
        </div>

        <DataTable
          title="TABLA DE REGISTRO DE VENTAS"
          subtitle="Registro histórico de transacciones y activaciones de licencias"
          columns={[
            {
              key: "expand",
              label: "",
              render: (sale: ISale) => (
                <button
                  onClick={() => toggleRow(sale.id)}
                  className="p-2 hover:bg-mahogany_red/20 rounded transition-colors"
                >
                  <span className="text-white text-lg">
                    {expandedRows.has(sale.id) ? "▼" : "▶"}
                  </span>
                </button>
              ),
            },
            {
              key: "client",
              label: "CLIENTE / ID DISPOSITIVO",
              render: (sale: ISale) => {
                const initials = sale.client.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border rounded-lg flex items-center justify-center font-semibold bg-onyx border-mahogany_red text-mahogany_red">
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold text-base text-onyx">
                        {sale.client.name}
                      </p>
                      <p className="text-sm font-medium text-silver-500">
                        SN: {sale.device.serialNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              key: "amount",
              label: "MONTO TOTAL",
              render: (sale: ISale) => (
                <div>
                  <p className="font-semibold text-base text-onyx">
                    ${Number(sale.totalAmount).toFixed(2)}
                  </p>
                  <p className="text-sm font-medium text-silver-500">
                    {sale.installments} cuotas
                  </p>
                </div>
              ),
            },
            {
              key: "monthly",
              label: "CUOTA",
              render: (sale: ISale) => (
                <p className="font-semibold text-base text-onyx">
                  ${Number(sale.installmentAmount).toFixed(2)}
                </p>
              ),
            },
            {
              key: "date",
              label: "FECHA VENTA",
              render: (sale: ISale) => (
                <p className="text-sm font-medium text-silver-500">
                  {new Date(sale.createdAt).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              ),
            },
            {
              key: "status",
              label: "ESTADO",
              render: (sale: ISale) => {
                const isPending = sale.device.status === "SOLD_PENDING";
                return (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isPending
                        ? "bg-warning/20 text-warning"
                        : "bg-success/20 text-success"
                    }`}
                  >
                    {isPending ? "PENDIENTE VINCULACIÓN" : "ACTIVO"}
                  </span>
                );
              },
            },
            {
              key: "actions",
              label: "ACCIONES",
              render: (sale: ISale) => (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuPosition({
                        top: rect.bottom + 4,
                        left: rect.right - 200,
                      });
                      setOpenMenuId(openMenuId === sale.id ? null : sale.id);
                    }}
                    className="p-2 hover:bg-mahogany_red/20 rounded-lg transition-colors border border-transparent hover:border-mahogany_red"
                  >
                    <MoreVerticalIcon size={20} className="text-silver-400" />
                  </button>
                  {openMenuId === sale.id &&
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
                            onClick={() => handleEditSale(sale)}
                            className="w-full text-left px-4 py-2.5 text-sm text-onyx hover:bg-carbon_black-100 rounded-t-lg flex items-center gap-3 transition-colors"
                          >
                            <PencilEdit02Icon
                              size={16}
                              className="text-silver-500"
                            />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale)}
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
          data={sales}
          keyExtractor={(sale: ISale) => sale.id}
          emptyMessage="No hay ventas registradas"
          loading={loading}
          searchPlaceholder="Buscar venta por cliente o ID de dispositivo..."
          onSearch={handleSearch}
          totalLabel={`REGISTROS: ${sales.length} | PÁGINA 1 DE ${Math.ceil(sales.length / 10)}`}
          expandedContent={(sale: ISale) =>
            expandedRows.has(sale.id) ? (
              <tr>
                <td colSpan={8} className="bg-onyx-600 p-6">
                  <div className="space-y-4">
                    <h4 className="text-white font-medium uppercase text-sm">
                      Cuotas del Plan de Financiamiento
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sale.device.installments?.map((installment) => (
                        <div
                          key={installment.id}
                          className={`border rounded-lg p-4 ${
                            installment.status === "PAID"
                              ? "border-success bg-success/5"
                              : installment.status === "OVERDUE"
                                ? "border-destructive bg-destructive/5"
                                : "border-warning bg-warning/5"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-silver-400 text-xs uppercase">
                              Cuota {installment.number}
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                installment.status === "PAID"
                                  ? "text-success"
                                  : installment.status === "OVERDUE"
                                    ? "text-destructive"
                                    : "text-warning"
                              }`}
                            >
                              {installment.status === "PAID"
                                ? "PAGADO"
                                : installment.status === "OVERDUE"
                                  ? "VENCIDO"
                                  : "PENDIENTE"}
                            </span>
                          </div>
                          <p className="text-white font-bold text-lg">
                            ${Number(installment.amount).toFixed(2)}
                          </p>
                          <p className="text-silver-400 text-xs mt-1">
                            Vence:{" "}
                            {new Date(installment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            ) : null
          }
          actions={
            <>
              <Button
                variant="outline"
                className="gap-2 border-silver-400 text-white hover:bg-carbon_black flex-1 sm:flex-none text-sm"
              >
                <Download01Icon size={16} />
                <span className="hidden sm:inline">Exportar CSV</span>
              </Button>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="gap-2 bg-mahogany_red hover:bg-mahogany_red-600 flex-1 sm:flex-none text-sm"
              >
                <span className="text-lg text-white">+</span>
                <span className="text-white">Nueva Venta</span>
              </Button>
            </>
          }
        />

        <SaleModal
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) setSelectedSale(null);
          }}
          devices={devices}
          clients={clients}
          financingPlans={financingPlans}
          onSuccess={handleSaleCreated}
          onPlansUpdate={setFinancingPlans}
          initialSale={selectedSale}
        />

        <GenericModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          title="Eliminar Venta"
          description="¿Estás seguro de que deseas eliminar esta venta? Esta acción no se puede deshacer."
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
            Se eliminarán todos los datos asociados incluyendo plan de pagos,
            cuotas y reglas de bloqueo.
          </p>
        </GenericModal>
      </div>
    </DashboardLayout>
  );
}
