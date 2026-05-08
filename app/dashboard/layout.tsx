"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificacionPermitida, setNotificacionPermitida] = useState(false);

  // Solicitar permiso de notificaciones al cargar el dashboard
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      setNotificacionPermitida(true);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") setNotificacionPermitida(true);
      });
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Cargando...
      </div>
    );
  }

  const menuItems: { label: string; href: string; roles: string[] }[] = [
    { label: "Inicio", href: "/dashboard", roles: ["cliente", "recepcionista", "veterinario", "superadmin"] },
    { label: "Mis Mascotas", href: "/dashboard/mascotas", roles: ["cliente", "recepcionista", "veterinario", "superadmin"] },
    { label: "Nueva Mascota", href: "/dashboard/mascotas/nueva", roles: ["recepcionista", "veterinario", "superadmin"] },
    { label: "Solicitar Cita", href: "/dashboard/citas/solicitar", roles: ["cliente"] },
    { label: "Mis Citas", href: "/dashboard/citas", roles: ["cliente", "recepcionista", "veterinario", "superadmin"] },
    { label: "Tienda", href: "/dashboard/tienda", roles: ["cliente"] },
    { label: "Mis Pedidos", href: "/dashboard/pedidos", roles: ["cliente"] },
    { label: "Agenda Diaria", href: "/dashboard/agenda", roles: ["veterinario", "recepcionista", "superadmin"] },
    { label: "Pacientes", href: "/dashboard/pacientes", roles: ["veterinario", "superadmin"] },
    { label: "Historial Clínico", href: "/dashboard/historial", roles: ["veterinario", "superadmin"] },
    { label: "Gestión Contenido", href: "/dashboard/contenido", roles: ["superadmin"] },
    { label: "Gestión Tienda", href: "/dashboard/admin-tienda", roles: ["superadmin"] },
    { label: "Pedidos Recibidos", href: "/dashboard/admin-pedidos", roles: ["recepcionista", "veterinario", "superadmin"] },
    { label: "Noticias", href: "/dashboard/noticias", roles: ["superadmin"] },
    { label: "Usuarios", href: "/dashboard/usuarios", roles: ["superadmin"] },
  ];

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(profile.role)
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-white shadow-md p-4 flex flex-col`}>
        <div className="text-lg font-bold mb-6">🐾 Clínica Vet</div>
        <nav className="flex flex-col gap-2 flex-1">
          {filteredMenu.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded hover:bg-blue-100 text-sm"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="border-t pt-4 mt-4">
          <p className="text-sm text-gray-600">{profile.nombre_completo || "Usuario"}</p>
          <p className="text-xs text-gray-400 capitalize mb-2">{profile.role}</p>
          <button
            onClick={() => signOut()}
            className="text-red-600 hover:underline text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Botón menú móvil */}
        <button
          className="md:hidden mb-4 bg-white p-2 rounded shadow"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰ Menú
        </button>
        {children}
      </main>
    </div>
  );
}