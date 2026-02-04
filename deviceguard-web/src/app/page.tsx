import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            DeviceGuard
          </h1>
          <p className="text-xl text-muted-foreground">
            Sistema de gestión de dispositivos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Dispositivos</CardTitle>
              <CardDescription>
                Gestiona todos los dispositivos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Ver Dispositivos</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>
                Administra los usuarios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Ver Usuarios</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reportes</CardTitle>
              <CardDescription>Genera reportes y estadísticas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Ver Reportes</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
