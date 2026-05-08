"use client";

import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { profile } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Panel de {profile?.role === "superadmin" ? "Administración" : "Usuario"}</h1>
      <p className="text-gray-600">Bienvenido, {profile?.nombre_completo || "Usuario"}.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profile?.role === "superadmin" && (
          <>
            <div className="bg-white p-4 rounded-lg shadow">📦 Productos en tienda</div>
            <div className="bg-white p-4 rounded-lg shadow">📅 Citas pendientes</div>
            <div className="bg-white p-4 rounded-lg shadow">📝 Noticias recientes</div>
          </>
        )}
        {profile?.role === "veterinario" && (
          <>
            <div className="bg-white p-4 rounded-lg shadow">🩺 Pacientes del día</div>
            <div className="bg-white p-4 rounded-lg shadow">💊 Medicación activa</div>
          </>
        )}
        {profile?.role === "recepcionista" && (
          <>
            <div className="bg-white p-4 rounded-lg shadow">📋 Citas por confirmar</div>
            <div className="bg-white p-4 rounded-lg shadow">📞 Llamadas pendientes</div>
          </>
        )}
        {profile?.role === "cliente" && (
          <>
            <div className="bg-white p-4 rounded-lg shadow">🐶 Mis mascotas</div>
            <div className="bg-white p-4 rounded-lg shadow">📅 Próximas citas</div>
            <div className="bg-white p-4 rounded-lg shadow">🛒 Mi carrito</div>
          </>
        )}
      </div>
    </div>
  );
}