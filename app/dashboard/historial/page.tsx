"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

type EntradaHistorial = {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  mascota_id: string;
  veterinario_id: string;
  mascota: {
    id: string;
    nombre: string;
    especie: string;
    numero_historia_clinica: string;
    propietario: {
      nombre_completo: string;
      cedula: string;
      telefono: string;
    } | null;
  } | null;
  veterinario: {
    nombre_completo: string;
  } | null;
};

export default function HistorialClinicoPage() {
  const { profile } = useAuth();
  const [entradas, setEntradas] = useState<EntradaHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todas");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  useEffect(() => {
    if (!profile) return;
    fetchEntradas();
  }, [profile]);

  const fetchEntradas = async () => {
    let query = supabase
      .from("historias_clinicas")
      .select(`
        id,
        fecha,
        tipo,
        descripcion,
        mascota_id,
        veterinario_id,
        mascota:mascotas (
          id,
          nombre,
          especie,
          numero_historia_clinica,
          propietario:propietario_id (nombre_completo, cedula, telefono)
        ),
        veterinario:profiles!veterinario_id (nombre_completo)
      `)
      .order("fecha", { ascending: false });

    // Si es cliente, no debería ver esta página (según el menú), pero por seguridad filtramos
    if (profile.role === "cliente") {
      query = query.eq("mascota.propietario_id", profile.id);
    }

    const { data } = await query;
    if (data) setEntradas(data as unknown as EntradaHistorial[]);
    setLoading(false);
  };

  // Aplicar filtros locales
  const entradasFiltradas = entradas.filter((e) => {
    const coincideTipo = filtroTipo === "todas" || e.tipo === filtroTipo;
    const coincideBusqueda =
      busqueda === "" ||
      e.mascota?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.mascota?.numero_historia_clinica?.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.mascota?.propietario?.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase());
    const desdeOk = !fechaDesde || new Date(e.fecha) >= new Date(fechaDesde);
    const hastaOk = !fechaHasta || new Date(e.fecha) <= new Date(fechaHasta);
    return coincideTipo && coincideBusqueda && desdeOk && hastaOk;
  });

  if (loading) return <p className="p-4">Cargando historial clínico...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📋 Historial Clínico General</h1>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow">
        <input
          type="text"
          placeholder="🔍 Buscar por mascota, HC o propietario"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border p-2 rounded-lg w-full text-sm"
        />
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="border p-2 rounded-lg w-full text-sm"
        >
          <option value="todas">Todos los tipos</option>
          <option value="consulta">Consulta</option>
          <option value="vacuna">Vacuna</option>
          <option value="tratamiento">Tratamiento</option>
          <option value="analisis">Análisis</option>
          <option value="nota">Nota</option>
        </select>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="border p-2 rounded-lg w-full text-sm"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="border p-2 rounded-lg w-full text-sm"
          />
        </div>
      </div>

      {/* Listado */}
      {entradasFiltradas.length === 0 ? (
        <p className="text-gray-500">No se encontraron entradas.</p>
      ) : (
        <div className="space-y-4">
          {entradasFiltradas.map((entrada) => (
            <div key={entrada.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="capitalize font-semibold text-sm bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {entrada.tipo}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entrada.fecha).toLocaleDateString()}
                    </span>
                    {entrada.veterinario && (
                      <span className="text-xs text-gray-400">
                        Dr/a. {entrada.veterinario.nombre_completo}
                      </span>
                    )}
                  </div>
                  {entrada.mascota && (
                    <div className="text-sm">
                      <span className="font-medium">{entrada.mascota.nombre}</span> ({entrada.mascota.especie})
                      <span className="text-gray-400 ml-2">HC: {entrada.mascota.numero_historia_clinica}</span>
                    </div>
                  )}
                  {entrada.mascota?.propietario && (
                    <p className="text-xs text-gray-500">
                      Propietario: {entrada.mascota.propietario.nombre_completo} · {entrada.mascota.propietario.telefono}
                    </p>
                  )}
                  <p className="mt-2 text-gray-800 dark:text-gray-200 text-sm">
                    {entrada.descripcion.length > 200
                      ? entrada.descripcion.slice(0, 200) + "..."
                      : entrada.descripcion}
                  </p>
                </div>
                <Link
                  href={`/dashboard/historial/${entrada.mascota_id}`}
                  className="text-orange-600 hover:underline text-xs font-medium whitespace-nowrap"
                >
                  Ver historial completo
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}