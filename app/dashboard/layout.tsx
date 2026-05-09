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

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#fafafa] dark:bg-gray-950">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Cargando...
        </div>
      </div>
    );
  }

  const menuItems: { label: string; href: string; roles: string[] }[] = [
    { label: "Inicio", href: "/dashboard", roles: ["cliente", "recepcionista", "veterinario", "tecnico", "administrador", "superadmin"] },
    { label: "Pacientes", href: "/dashboard/pacientes", roles: ["recepcionista", "veterinario", "tecnico", "administrador", "superadmin"] },
    { label: "Solicitar Cita", href: "/dashboard/citas/solicitar", roles: ["cliente"] },
    { label: "Mis Citas", href: "/dashboard/citas", roles: ["cliente", "recepcionista", "veterinario", "tecnico", "administrador", "superadmin"] },
    { label: "Tienda", href: "/dashboard/tienda", roles: ["cliente"] },
    { label: "Mis Pedidos", href: "/dashboard/pedidos", roles: ["cliente"] },
    { label: "Agenda Diaria", href: "/dashboard/agenda", roles: ["veterinario", "recepcionista", "administrador", "superadmin"] },
    { label: "Historial Clínico", href: "/dashboard/historial", roles: ["veterinario", "tecnico", "administrador", "superadmin"] },
    { label: "Gestión Contenido", href: "/dashboard/contenido", roles: ["administrador", "superadmin"] },
    { label: "Gestión Tienda", href: "/dashboard/admin-tienda", roles: ["administrador", "superadmin"] },
    { label: "Pedidos Recibidos", href: "/dashboard/admin-pedidos", roles: ["recepcionista", "veterinario", "administrador", "superadmin"] },
    { label: "Noticias", href: "/dashboard/noticias", roles: ["administrador", "superadmin"] },
    { label: "Registro de Ventas", href: "/dashboard/ventas", roles: ["administrador", "superadmin"] },
    { label: "Usuarios", href: "/dashboard/usuarios", roles: ["superadmin"] },
    { label: "Herramientas", href: "/dashboard/herramientas", roles: ["superadmin"] },
  ];

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(profile.role)
  );

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 shadow-2xl border-r border-orange-100 dark:border-gray-800 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <img
              src="/logo.png"
              alt="ANIMALIA"
              className="w-10 h-10 rounded-lg object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-orange-600 leading-tight">
                ANIMALIA
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Centro Veterinario Universitario
              </p>
            </div>
          </div>

          {/* Menú */}
          <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
            {filteredMenu.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-800 hover:text-orange-600 transition-all duration-200"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Información de contacto y créditos */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-6 text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <p>📧 info@animalia.cu</p>
            <p>📞 +53 55415537</p>
            <p className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2 text-gray-400 dark:text-gray-500">
              Elaborado por{" "}
              <span className="font-semibold text-orange-600">neXo</span>
            </p>
          </div>

          {/* Usuario y cierre de sesión */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm uppercase">
                {(profile.nombre_completo?.[0] || "U")}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
                  {profile.nombre_completo || "Usuario"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {profile.role}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 py-2 px-4 rounded-lg text-sm font-semibold transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
          <button
            className="md:hidden bg-orange-50 dark:bg-gray-800 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-orange-100"
            onClick={() => setSidebarOpen(true)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="text-lg font-bold text-orange-600 ml-auto">
            ANIMALIA
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>

      {/* Botón flotante de WhatsApp (solo cliente) */}
      {profile.role === "cliente" && (
        <a
          href="https://wa.me/5355415537"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-xl transition-transform hover:scale-110"
        >
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.807-1.588-3.86-1.588-5.99C.156 5.204 5.472 0 12.004 0c3.159 0 6.124 1.232 8.354 3.47 2.232 2.24 3.463 5.212 3.458 8.38-.006 6.853-5.326 11.996-11.995 11.996h-.005c-1.993 0-3.945-.494-5.655-1.423L.057 24zm6.591-3.804l.36.213c1.473.875 3.158 1.338 4.895 1.338 5.718 0 10.278-4.66 10.283-10.389.003-2.777-1.076-5.386-3.037-7.348-1.96-1.96-4.57-3.04-7.347-3.04-5.724 0-10.292 4.667-10.292 10.398 0 1.943.536 3.84 1.55 5.479l.247.394-1.002 3.655 3.343-.7z" />
            <path d="M17.853 14.29c-.217-.109-1.281-.633-1.48-.706-.198-.073-.343-.109-.487.11-.145.22-.559.707-.685.852-.126.145-.253.163-.47.054-.218-.109-.917-.338-1.747-1.078-.646-.575-1.082-1.286-1.209-1.503-.127-.218-.013-.336.096-.445.099-.099.218-.253.327-.38.109-.126.145-.218.218-.362.073-.145.036-.272-.018-.38-.055-.109-.487-1.173-.667-1.607-.176-.424-.355-.365-.487-.372-.127-.006-.273-.007-.418-.007-.145 0-.38.054-.58.272-.2.218-.76.743-.76 1.812 0 1.07.78 2.103.89 2.248.108.145 1.535 2.343 3.722 3.285 2.187.942 2.187.628 2.58.588.393-.04 1.272-.52 1.451-1.022.18-.502.18-.932.126-1.022-.054-.09-.199-.145-.416-.254z" />
          </svg>
        </a>
      )}
    </div>
  );
}