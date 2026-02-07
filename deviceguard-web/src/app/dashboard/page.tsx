"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, DollarSign, TrendingUp, Download, Search, MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@prisma/client";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isSuperAdmin ? "Gestión de Organizaciones" : "Mi Organización"}
            </h1>
            <p className="text-slate-600 mt-1">
              Control centralizado de clientes y suscripciones corporativas
            </p>
          </div>
          {isSuperAdmin && (
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar Reporte
              </Button>
              <Button className="gap-2">
                <span className="text-lg">+</span>
                Nueva Organización
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Dispositivos"
            value="12,482"
            trend={{ value: "+8.4% este mes", isPositive: true }}
            icon={Smartphone}
            iconColor="bg-blue-600"
          />
          <StatCard
            title="Ingresos Globales"
            value="$142,500.00"
            subtitle="MRR ACTUAL"
            icon={DollarSign}
            iconColor="bg-green-600"
          />
          <StatCard
            title="Tasa de Recuperación"
            value="94.2%"
            trend={{ value: "-1.2% v. anterior", isPositive: false }}
            icon={TrendingUp}
            iconColor="bg-purple-600"
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por empresa o administrador..."
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Filtrar por Plan:</span>
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option>Todos los planes</option>
                  <option>Enterprise</option>
                  <option>Pro</option>
                  <option>Starter</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-600">
                    <th className="pb-3 font-medium">EMPRESA / ADMIN</th>
                    <th className="pb-3 font-medium">DISPOSITIVOS TOTALES</th>
                    <th className="pb-3 font-medium">SUSCRIPCIÓN</th>
                    <th className="pb-3 font-medium">ÚLTIMA ACTIVIDAD</th>
                    <th className="pb-3 font-medium">NIVEL DE RIESGO</th>
                    <th className="pb-3 font-medium">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ORGANIZATIONS.map((org) => (
                    <tr key={org.id} className="border-b hover:bg-slate-50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center font-semibold text-slate-700">
                            {org.initials}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{org.name}</p>
                            <p className="text-sm text-slate-500">Admin: {org.admin}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-medium">{org.devices.toLocaleString()}</p>
                        <p className="text-sm text-slate-500">dispositivos</p>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          org.plan === "ENTERPRISE" ? "bg-blue-100 text-blue-700" :
                          org.plan === "PRO" ? "bg-purple-100 text-purple-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {org.plan}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-slate-600">{org.lastActivity}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            org.risk === "BAJO" ? "bg-green-500" :
                            org.risk === "MEDIO" ? "bg-yellow-500" :
                            "bg-red-500"
                          }`} />
                          <span className="text-sm">{org.risk}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <button className="p-2 hover:bg-slate-100 rounded-lg">
                          <MoreVertical className="w-4 h-4 text-slate-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-slate-600">Mostrando 4 de 128 organizaciones</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Anterior</Button>
                <Button variant="outline" size="sm">Siguiente</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

const MOCK_ORGANIZATIONS = [
  {
    id: "1",
    name: "TechLogistics S.A.",
    initials: "TL",
    admin: "Roberto Méndez",
    devices: 1250,
    plan: "ENTERPRISE",
    lastActivity: "Hace 15 min",
    risk: "BAJO",
  },
  {
    id: "2",
    name: "Retail Solutions",
    initials: "RS",
    admin: "Lucía Torres",
    devices: 432,
    plan: "PRO",
    lastActivity: "Ayer, 14:20",
    risk: "CRÍTICO",
  },
  {
    id: "3",
    name: "FastCorp Int.",
    initials: "FC",
    admin: "Kevin Smith",
    devices: 85,
    plan: "STARTER",
    lastActivity: "Hace 3 horas",
    risk: "MEDIO",
  },
  {
    id: "4",
    name: "Delivery Masters",
    initials: "DM",
    admin: "Carlos Ruiz",
    devices: 3120,
    plan: "ENTERPRISE",
    lastActivity: "Hace 5 min",
    risk: "BAJO",
  },
];
