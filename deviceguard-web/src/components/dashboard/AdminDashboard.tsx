"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import {
  SmartPhone01Icon,
  UserMultiple02Icon,
  Download01Icon,
  DollarCircleIcon,
} from "hugeicons-react";

export function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 bg-onyx min-h-screen space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="DISPOSITIVOS"
            value="0"
            trend={{ value: "0 activos", isPositive: true }}
            icon={SmartPhone01Icon}
            iconColor="bg-mahogany_red"
          />
          <StatCard
            title="CLIENTES"
            value="0"
            trend={{ value: "0 activos", isPositive: true }}
            icon={UserMultiple02Icon}
            iconColor="bg-mahogany_red"
          />
          <StatCard
            title="PAGOS PENDIENTES"
            value="$0"
            trend={{ value: "0 cuotas", isPositive: false }}
            icon={DollarCircleIcon}
            iconColor="bg-warning"
          />
          <StatCard
            title="PAGOS AL DÍA"
            value="$0"
            trend={{ value: "0 cuotas", isPositive: true }}
            icon={DollarCircleIcon}
            iconColor="bg-success"
          />
        </div>

        <DataTable
          title="MIS DISPOSITIVOS"
          subtitle="Gestión de dispositivos y clientes asignados"
          columns={[
            {
              key: "device",
              label: "DISPOSITIVO",
              render: () => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-onyx-600 border border-mahogany_red rounded-lg flex items-center justify-center">
                    <SmartPhone01Icon size={20} className="text-mahogany_red" />
                  </div>
                  <div>
                    <p className="font-medium text-white">-</p>
                    <p className="text-sm text-silver-400">-</p>
                  </div>
                </div>
              ),
            },
            {
              key: "client",
              label: "CLIENTE",
              render: () => (
                <div>
                  <p className="font-medium text-white">-</p>
                  <p className="text-sm text-silver-400">-</p>
                </div>
              ),
            },
            {
              key: "status",
              label: "ESTADO",
              render: () => (
                <span className="px-2 py-1 text-xs rounded-full bg-silver-600 text-white">
                  -
                </span>
              ),
            },
            {
              key: "payment",
              label: "PAGO",
              render: () => (
                <div>
                  <p className="font-medium text-white">$0</p>
                  <p className="text-sm text-silver-400">0/0 cuotas</p>
                </div>
              ),
            },
          ]}
          data={[]}
          keyExtractor={() => ""}
          emptyMessage="No hay dispositivos registrados"
          loading={false}
          searchPlaceholder="Buscar por dispositivo, cliente o IMEI..."
          onSearch={() => {}}
          totalLabel="MOSTRANDO 0 DISPOSITIVOS"
          actions={
            <>
              <Button
                variant="outline"
                className="gap-2 border-silver-400 text-white hover:bg-carbon_black flex-1 sm:flex-none text-sm"
              >
                <Download01Icon size={16} />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              <Button className="gap-2 bg-mahogany_red hover:bg-mahogany_red-600 flex-1 sm:flex-none text-sm">
                <span className="text-lg text-white">+</span>
                <span className="text-white">Nuevo Dispositivo</span>
              </Button>
            </>
          }
        />
      </div>
    </DashboardLayout>
  );
}
