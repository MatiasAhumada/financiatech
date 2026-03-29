"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SaleModal } from "@/components/sales/SaleModal";
import { GenericModal } from "@/components/common/GenericModal";
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
  SALES_MESSAGES,
  SALES_STATS,
  SALES_TABLE,
} from "@/constants/sales.constant";
import {
  Download01Icon,
  MoreVerticalIcon,
  ViewIcon,
  PencilEdit02Icon,
  Delete02Icon,
  ShoppingCart01Icon,
} from "hugeicons-react";
import { useDebounce } from "@/hooks/useDebounce";
import { createPortal } from "react-dom";
import { getCenteredMenuPosition } from "@/utils/menu.util";
import { salesUtils } from "@/utils/sales.util";
import { DeviceStatus, InstallmentStatus } from "@prisma/client";
import { SalesStats, IInstallment } from "@/types";

export default function SalesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<ISale | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<ISale | null>(null);
  const [sales, setSales] = useState<ISale[]>([]);
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [clients, setClients] = useState<IClient[]>([]);
  const [financingPlans, setFinancingPlans] = useState<IFinancingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [stats, setStats] = useState<SalesStats>({
    todaySales: 0,
    newDevices: 0,
    pendingPayments: 0,
    avgTicket: 0,
  });
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [installments, setInstallments] = useState<IInstallment[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadSales(debouncedSearch || undefined);
  }, [debouncedSearch]);

  useEffect(() => {
    if (isModalOpen || isDeleteModalOpen) {
      setOpenMenuId(null);
    }
  }, [isModalOpen, isDeleteModalOpen]);

  const loadInitialData = async () => {
    try {
      const [devicesData, clientsData, plansData] = await Promise.all([
        deviceService.getAll(),
        clientService.getAll(),
        financingPlanService.getAll(),
      ]);
      setDevices(devicesData);
      setClients(clientsData);
      setFinancingPlans(plansData);
      await loadSales();
    } catch (error) {
      clientErrorHandler(error);
      setLoading(false);
    }
  };

  const loadSales = async (search?: string) => {
    try {
      setLoading(true);
      const [salesData, statsData] = await Promise.all([
        saleService.getAll(search),
        saleService.getStats(),
      ]);
      setSales(salesData);
      setStats(statsData);
    } catch (error) {
      clientErrorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setSelectedSale(null);
    setIsModalOpen(true);
  };

  const handleViewSale = (sale: ISale) => {
    setSelectedSale(sale);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleEditSale = (sale: ISale) => {
    setSelectedSale(sale);
    setOpenMenuId(null);
    setIsModalOpen(true);
  };

  const handleDeleteSale = (sale: ISale) => {
    setSaleToDelete(sale);
    setOpenMenuId(null);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!saleToDelete) return;

    try {
      await saleService.delete(saleToDelete.id);
      clientSuccessHandler(SALES_MESSAGES.SUCCESS.DELETED);
      await loadSales();
      setIsDeleteModalOpen(false);
      setSaleToDelete(null);
    } catch (error) {
      clientErrorHandler(error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handlePlansUpdate = (plans: IFinancingPlan[]) => {
    setFinancingPlans(plans);
  };

  const handleSuccess = () => {
    loadSales();
  };

  const handleExpandRow = async (sale: ISale) => {
    if (expandedSaleId === sale.id) {
      setExpandedSaleId(null);
      setInstallments([]);
    } else {
      setExpandedSaleId(sale.id);
      setLoadingInstallments(true);
      try {
        const data = await saleService.getInstallments(sale.id);
        setInstallments(data);
      } catch (error) {
        clientErrorHandler(error);
      } finally {
        setLoadingInstallments(false);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-silver-400 uppercase">
                  {SALES_STATS.TODAY_SALES}
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.todaySales}
                </p>
              </div>
              <ShoppingCart01Icon size={32} className="text-mahogany_red" />
            </div>
          </div>

          <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-silver-400 uppercase">
                  {SALES_STATS.NEW_DEVICES}
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.newDevices}
                </p>
              </div>
              <ShoppingCart01Icon size={32} className="text-success" />
            </div>
          </div>

          <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-silver-400 uppercase">
                  {SALES_STATS.PENDING_PAYMENTS}
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.pendingPayments}
                </p>
              </div>
              <ShoppingCart01Icon size={32} className="text-warning" />
            </div>
            <p className="text-xs text-silver-400 mt-2">
              {SALES_STATS.REQUIRES_ATTENTION}
            </p>
          </div>

          <div className="border border-carbon_black-600 rounded-lg p-4 bg-carbon_black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-silver-400 uppercase">
                  {SALES_STATS.AVG_TICKET}
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {salesUtils.formatCurrency(stats.avgTicket)}
                </p>
              </div>
              <ShoppingCart01Icon size={32} className="text-silver-400" />
            </div>
            <p className="text-xs text-silver-400 mt-2">
              {SALES_STATS.LAST_30_DAYS}
            </p>
          </div>
        </div>

        {/* Sales Table */}
        <DataTable
          title={SALES_TABLE.TITLE}
          subtitle={SALES_TABLE.SUBTITLE}
          onRowClick={(sale: ISale) => {
            if (window.innerWidth < 640) {
              setMenuPosition(getCenteredMenuPosition());
              setOpenMenuId(sale.id);
            } else {
              handleExpandRow(sale);
            }
          }}
          expandedContent={(sale: ISale) => {
            if (expandedSaleId !== sale.id) return null;

            return (
              <tr>
                <td colSpan={6} className="bg-onyx/30 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <ShoppingCart01Icon
                        size={20}
                        className="text-mahogany_red"
                      />
                      <h4 className="text-white font-semibold">
                        {SALES_TABLE.INSTALLMENTS_TITLE}
                      </h4>
                    </div>

                    {loadingInstallments && expandedSaleId === sale.id ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 border-2 border-mahogany_red border-t-transparent rounded-full animate-spin" />
                        <span className="text-silver-400 ml-3 text-sm">
                          Cargando cuotas...
                        </span>
                      </div>
                    ) : installments.length === 0 ? (
                      <p className="text-silver-400 text-sm text-center py-4">
                        No hay cuotas registradas
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {installments.map((installment) => {
                          const isPaid =
                            installment.status === InstallmentStatus.PAID;
                          const isOverdue =
                            installment.status === InstallmentStatus.OVERDUE;

                          return (
                            <div
                              key={installment.id}
                              className={`border rounded-lg p-3 ${
                                isPaid
                                  ? "border-success bg-success/5"
                                  : isOverdue
                                    ? "border-destructive bg-destructive/5"
                                    : "border-warning bg-warning/5"
                              }`}
                            >
                              <p className="text-xs text-silver-400 uppercase">
                                Cuota {installment.number}
                              </p>
                              <p className="text-lg font-bold text-white mt-1">
                                {salesUtils.formatCurrency(
                                  Number(installment.amount)
                                )}
                              </p>
                              <p className="text-xs text-silver-400 mt-1">
                                Vence:{" "}
                                {salesUtils.formatDate(installment.dueDate)}
                              </p>
                              <p
                                className={`text-xs font-medium mt-2 ${
                                  isPaid
                                    ? "text-success"
                                    : isOverdue
                                      ? "text-destructive"
                                      : "text-warning"
                                }`}
                              >
                                {isPaid
                                  ? "PAGADA"
                                  : isOverdue
                                    ? "VENCIDA"
                                    : "PENDIENTE"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          }}
          columns={[
            {
              key: "client",
              label: SALES_TABLE.COLUMNS.CLIENT_DEVICE,
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
                        ID: {sale.device.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              key: "totalAmount",
              label: SALES_TABLE.COLUMNS.TOTAL_AMOUNT,
              render: (sale: ISale) => (
                <p className="text-sm font-medium text-white">
                  {salesUtils.formatCurrency(Number(sale.totalAmount))}
                </p>
              ),
            },
            {
              key: "installmentAmount",
              label: SALES_TABLE.COLUMNS.MONTHLY_PAYMENT,
              render: (sale: ISale) => (
                <p className="text-sm font-medium text-white">
                  {salesUtils.formatCurrency(Number(sale.installmentAmount))}
                </p>
              ),
            },
            {
              key: "createdAt",
              label: SALES_TABLE.COLUMNS.SALE_DATE,
              render: (sale: ISale) => (
                <p className="text-xs font-medium text-silver-400">
                  {salesUtils.formatDate(sale.createdAt)}
                </p>
              ),
            },
            {
              key: "status",
              label: SALES_TABLE.COLUMNS.STATUS,
              render: (sale: ISale) => {
                const isPending =
                  sale.device.status === DeviceStatus.SOLD_PENDING;
                return (
                  <p
                    className={`text-sm font-medium ${
                      isPending
                        ? "text-warning"
                        : sale.device.status === DeviceStatus.SOLD_SYNCED
                          ? "text-success"
                          : "text-silver-400"
                    }`}
                  >
                    {isPending
                      ? SALES_TABLE.STATUS.PENDING
                      : SALES_TABLE.STATUS.ACTIVE}
                  </p>
                );
              },
            },
            {
              key: "actions",
              label: SALES_TABLE.COLUMNS.ACTIONS,
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
                    className="p-2 hover:bg-mahogany_red/20 rounded-lg transition-colors border border-transparent hover:border-mahogany_red hidden sm:block"
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
                            onClick={() => handleViewSale(sale)}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx/50 rounded-t-lg flex items-center gap-3 transition-colors"
                          >
                            <ViewIcon size={16} className="text-silver-400" />
                            {SALES_TABLE.ACTIONS.EDIT}
                          </button>
                          <button
                            onClick={() => handleEditSale(sale)}
                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-onyx/50 flex items-center gap-3 transition-colors"
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
                            {SALES_TABLE.ACTIONS.DELETE}
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
          emptyMessage={SALES_TABLE.EMPTY}
          loading={loading}
          searchPlaceholder={SALES_TABLE.SEARCH_PLACEHOLDER}
          onSearch={handleSearch}
          totalLabel={`MOSTRANDO ${sales.length} VENTAS`}
          actions={
            <>
              <Button
                variant="outline"
                className="gap-2 border-silver-400 text-white hover:bg-carbon_black flex-1 sm:flex-none text-sm"
              >
                <Download01Icon size={16} />
                <span className="hidden sm:inline">
                  {SALES_TABLE.EXPORT_CSV}
                </span>
              </Button>
              <Button
                className="gap-2 bg-mahogany_red hover:bg-mahogany_red/90 flex-1 sm:flex-none text-sm"
                onClick={handleOpenModal}
              >
                <span className="text-lg text-white">+</span>
                <span className="text-white">{SALES_TABLE.NEW_SALE}</span>
              </Button>
            </>
          }
        />

        {/* Sale Modal */}
        <SaleModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          devices={devices}
          clients={clients}
          financingPlans={financingPlans}
          onSuccess={handleSuccess}
          onPlansUpdate={handlePlansUpdate}
          initialSale={selectedSale}
        />

        {/* Delete Confirmation Modal */}
        <GenericModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          title={SALES_MESSAGES.DELETE.TITLE}
          description={SALES_MESSAGES.DELETE.DESCRIPTION}
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
          <div className="space-y-3">
            <p className="text-sm text-silver-400">
              {SALES_MESSAGES.DELETE.WARNING}
            </p>
            {saleToDelete && (
              <div className="border border-carbon_black-600 rounded-lg p-3 bg-carbon_black">
                <p className="text-sm text-white">
                  <span className="text-silver-400">Cliente:</span>{" "}
                  {saleToDelete.client.name}
                </p>
                <p className="text-sm text-white">
                  <span className="text-silver-400">Dispositivo:</span>{" "}
                  {saleToDelete.device.name}
                </p>
                <p className="text-sm text-white">
                  <span className="text-silver-400">Monto:</span>{" "}
                  {salesUtils.formatCurrency(Number(saleToDelete.totalAmount))}
                </p>
              </div>
            )}
          </div>
        </GenericModal>
      </div>
    </DashboardLayout>
  );
}
