"use client";

import { motion, AnimatePresence } from "framer-motion";

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
import { salesUtils } from "@/utils/sales.util";
import {
  Download01Icon,
  MoreVerticalIcon,
  PencilEdit02Icon,
  Delete02Icon,
  ArrowRight01Icon,
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
          <div className="bg-carbon_black border border-carbon_black-600 rounded-xl shadow-lg p-6">
            <p className="text-xs font-semibold text-silver-400 uppercase tracking-wider mb-2">
              VENTAS HOY
            </p>
            <p className="text-4xl font-bold text-white">
              {salesUtils.formatCurrency(todayTotal)}
            </p>
          </div>
          <div className="bg-carbon_black border border-carbon_black-600 rounded-xl shadow-lg p-6">
            <p className="text-xs font-semibold text-silver-400 uppercase tracking-wider mb-2">
              DISPOSITIVOS NUEVOS
            </p>
            <p className="text-4xl font-bold text-white">{salesUtils.formatNumber(newDevicesCount)}</p>
            <p className="text-sm font-medium text-success mt-1">
              +12% vs ayer
            </p>
          </div>
          <div className="bg-carbon_black border border-carbon_black-600 rounded-xl shadow-lg p-6">
            <p className="text-xs font-semibold text-silver-400 uppercase tracking-wider mb-2">
              PENDIENTES DE PAGO
            </p>
            <p className="text-4xl font-bold text-destructive">
              {pendingPayments}
            </p>
            <p className="text-sm font-medium text-destructive mt-1">
              Requieren atención
            </p>
          </div>
          <div className="bg-carbon_black border border-carbon_black-600 rounded-xl shadow-lg p-6">
            <p className="text-xs font-semibold text-silver-400 uppercase tracking-wider mb-2">
              TICKET PROMEDIO
            </p>
            <p className="text-4xl font-bold text-white">
              {salesUtils.formatCurrency(avgTicket)}
            </p>
            <p className="text-xs font-medium text-silver-400 mt-1">Últimos 30 días</p>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRow(sale.id);
                  }}
                  className="p-1.5 hover:bg-mahogany_red/20 rounded transition-all"
                >
                  <span
                    className={`text-silver-400 inline-block transition-transform duration-200 ${expandedRows.has(sale.id) ? "rotate-90" : ""}`}
                  >
                    <ArrowRight01Icon size={18} />
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
                      <p className="font-semibold text-sm text-white">
                        {sale.client.name}
                      </p>
                      <p className="text-xs font-medium text-silver-400">
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
                  <p className="font-semibold text-sm text-white">
                    {salesUtils.formatCurrency(Number(sale.totalAmount))}
                  </p>
                  <p className="text-xs font-medium text-silver-400">
                    {sale.installments} cuotas
                  </p>
                </div>
              ),
            },
            {
              key: "monthly",
              label: "CUOTA",
              render: (sale: ISale) => (
                <p className="font-semibold text-sm text-white">
                  {salesUtils.formatCurrency(Number(sale.installmentAmount))}
                </p>
              ),
            },
            {
              key: "date",
              label: "FECHA VENTA",
              render: (sale: ISale) => (
                <p className="text-xs font-medium text-silver-400">
                  {salesUtils.formatDate(sale.createdAt)}
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
                      e.stopPropagation();
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
                          className="fixed w-48 bg-carbon_black border border-carbon_black-600 rounded-lg shadow-2xl z-50"
                          style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                          }}
                        >
                          <button
                            onClick={() => handleEditSale(sale)}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx/50 rounded-t-lg flex items-center gap-3 transition-colors"
                          >
                            <PencilEdit02Icon
                              size={16}
                              className="text-silver-400"
                            />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale)}
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
          data={sales}
          keyExtractor={(sale: ISale) => sale.id}
          onRowClick={(sale: ISale) => toggleRow(sale.id)}
          emptyMessage="No hay ventas registradas"
          loading={loading}
          searchPlaceholder="Buscar venta por cliente o ID de dispositivo..."
          onSearch={handleSearch}
          totalLabel={`REGISTROS: ${sales.length} | PÁGINA 1 DE ${Math.ceil(sales.length / 10)}`}
          expandedContent={(sale: ISale) => (
            <AnimatePresence>
              {expandedRows.has(sale.id) && (
                <tr key={`${sale.id}-expanded`}>
                  <td colSpan={8} className="p-0 border-0">
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <div className="bg-onyx rounded-lg border border-carbon_black-600 p-4 shadow-inner">
                          <h4 className="text-white font-medium uppercase text-xs tracking-wider mb-3">
                            Cuotas del Plan de Financiamiento
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                            {sale.device.installments?.map((installment) => (
                              <div
                                key={installment.id}
                                className={`border rounded-lg p-3 ${
                                  installment.status === "PAID"
                                    ? "border-success/30 bg-success/5"
                                    : installment.status === "OVERDUE"
                                      ? "border-destructive/30 bg-destructive/5"
                                      : "border-warning/30 bg-warning/5"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-silver-400 text-xs">
                                    #{installment.number}
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
                                      ? "✓"
                                      : installment.status === "OVERDUE"
                                        ? "✗"
                                        : "●"}
                                  </span>
                                </div>
                                <p className="text-white font-bold text-sm">
                                  {salesUtils.formatCurrency(Number(installment.amount))}
                                </p>
                                <p className="text-silver-400 text-xs mt-1">
                                  {salesUtils.formatDate(installment.dueDate)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </td>
                </tr>
              )}
            </AnimatePresence>
          )}
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
                variant="destructive"
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
