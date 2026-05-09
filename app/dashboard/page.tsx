"use client";

import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  productos: number;
  citasPendientes: number;
  noticias: number;
  mascotas: number;
  pedidosPendientes: number;
};

type Noticia = {
  id: string;
  titulo: string;
  contenido: string;
  imagen_url: string;
  created_at: string;
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ productos: 0, citasPendientes: 0, noticias: 0, mascotas: 0, pedidosPendientes: 0 });
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      // Estadísticas (código existente)
      const { count: productos } = await supabase.from("productos").select("*", { count: "exact", head: true }).eq("activo", true);
      let queryCitas = supabase.from("citas").select("*", { count: "exact", head: true }).eq("estado", "solicitada");
      if (profile.role === "cliente") queryCitas = queryCitas.eq("cliente_id", profile.id);
      const { count: citasPendientes } = await queryCitas;
      const { count: noticiasCount } = await supabase.from("noticias").select("*", { count: "exact", head: true }).eq("publicada", true);
      let queryMascotas = supabase.from("mascotas").select("*", { count: "exact", head: true });
      if (profile.role === "cliente") queryMascotas = queryMascotas.eq("propietario_id", profile.id);
      const { count: mascotas } = await queryMascotas;
      let pedidosPendientes = 0;
      if (["recepcionista", "veterinario", "administrador", "superadmin"].includes(profile.role)) {
        const { count } = await supabase.from("pedidos").select("*", { count: "exact", head: true }).eq("estado", "enviado");
        pedidosPendientes = count || 0;
      }
      setStats({ productos: productos || 0, citasPendientes: citasPendientes || 0, noticias: noticiasCount || 0, mascotas: mascotas || 0, pedidosPendientes });

      // Noticias para carrusel (solo cliente, pero lo cargamos para todos)
      const { data: noticiasData } = await supabase.from("noticias").select("*").eq("publicada", true).order("created_at", { ascending: false }).limit(5);
      if (noticiasData) setNoticias(noticiasData);

      setLoading(false);
    };

    fetchData();
  }, [profile]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-pulse text-gray-500">Cargando estadísticas...</div></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bienvenido, {profile?.nombre_completo || "Usuario"}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Resumen de actividad</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* ... (mantén las tarjetas tal cual las tienes) ... */}
        <Link href="/dashboard/tienda" className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 group hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Productos en tienda</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.productos}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🛍️</div>
          </div>
        </Link>

        <Link href="/dashboard/citas" className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 group hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Citas pendientes</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.citasPendientes}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📅</div>
          </div>
        </Link>

        <Link href="/dashboard/noticias" className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 group hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Noticias publicadas</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.noticias}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📰</div>
          </div>
        </Link>

        <Link href="/dashboard/mascotas" className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 group hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mascotas {profile?.role === "cliente" ? "propias" : "registradas"}</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.mascotas}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🐶</div>
          </div>
        </Link>

        {["recepcionista", "veterinario", "administrador", "superadmin"].includes(profile?.role || "") && (
          <Link href="/dashboard/admin-pedidos" className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 group hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pedidos recibidos</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pedidosPendientes}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📦</div>
            </div>
          </Link>
        )}
      </div>

      {/* Carrusel de noticias (visible para todos, pero especialmente para clientes) */}
      {noticias.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">📰 Últimas noticias</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {noticias.map((n) => (
              <div key={n.id} className="snap-start shrink-0 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 p-4 flex flex-col">
                {n.imagen_url && (
                  <img src={n.imagen_url} alt={n.titulo} className="h-40 w-full object-cover rounded-xl mb-3" />
                )}
                <h3 className="font-bold text-lg">{n.titulo}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">{n.contenido}</p>
                <span className="text-xs text-gray-500 mt-2">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}