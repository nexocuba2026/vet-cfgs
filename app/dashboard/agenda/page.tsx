"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

type Cita = {
  id: string;
  servicio: string;
  fecha_hora_asignada: string;
  estado: string;
  numero_cita: string | null;
  datos_formulario: any;
};

type Recordatorio = {
  id: string;
  tipo: string;
  fecha_hora_programada: string;
  estado: string;
  referencia_id: string | null;
  mascota_id: string;
  mascota?: {
    nombre: string;
    propietario?: {
      nombre_completo: string;
      telefono: string;
    };
  };
  receta?: {
    medicamento: string;
    dosis: string;
  };
};

export default function AgendaPage() {
  const { profile } = useAuth();
  const [citasHoy, setCitasHoy] = useState<Cita[]>([]);
  const [recordatoriosHoy, setRecordatoriosHoy] = useState<Recordatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!profile) return;
    fetchAgenda();
  }, [profile]);

  const fetchAgenda = async () => {
    const hoy = new Date();
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString();

    // Cargar citas del día (confirmadas y solicitadas)
    const { data: citasData } = await supabase
      .from("citas")
      .select("*")
      .gte("fecha_hora_asignada", inicioDia)
      .lt("fecha_hora_asignada", finDia)
      .in("estado", ["solicitada", "confirmada"])
      .order("fecha_hora_asignada", { ascending: true });

    if (citasData) setCitasHoy(citasData as Cita[]);

    // Cargar recordatorios del día (solo los pendientes)
    const { data: recData } = await supabase
      .from("recordatorios")
      .select("*, mascota:mascotas(nombre, propietario:propietario_id(nombre_completo, telefono)), receta:recetas(medicamento, dosis)")
      .gte("fecha_hora_programada", inicioDia)
      .lt("fecha_hora_programada", finDia)
      .eq("estado", "pendiente")
      .order("fecha_hora_programada", { ascending: true });

    if (recData) setRecordatoriosHoy(recData as unknown as Recordatorio[]);

    setLoading(false);
  };

  const actualizarEstadoCita = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase.from("citas").update({ estado: nuevoEstado }).eq("id", id);
    if (!error) {
      setCitasHoy((prev) => prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c)));
      setMensaje(`Cita marcada como ${nuevoEstado}.`);
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const marcarRecordatorio = async (id: string, estado: string) => {
    const { error } = await supabase.from("recordatorios").update({ estado }).eq("id", id);
    if (!error) {
      setRecordatoriosHoy((prev) => prev.filter((r) => r.id !== id));
      setMensaje("Medicación actualizada.");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  if (loading) return <p className="p-4">Cargando agenda...</p>;

  const hoy = new Date().toLocaleDateString("es-CU", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📋 Agenda Diaria</h1>
      <p className="text-gray-500 dark:text-gray-400 capitalize">{hoy}</p>

      {mensaje && (
        <div className="bg-green-100 text-green-800 p-3 rounded-xl">{mensaje}</div>
      )}

      {/* Sección: Citas del día */}
      <section>
        <h2 className="text-xl font-semibold mb-3">📅 Citas del día</h2>
        {citasHoy.length === 0 ? (
          <p className="text-gray-500 italic">No hay citas programadas para hoy.</p>
        ) : (
          <div className="grid gap-4">
            {citasHoy.map((cita) => (
              <div
                key={cita.id}
                className={`p-4 rounded-xl shadow border flex justify-between items-start ${
                  cita.estado === "confirmada"
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                    : "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                }`}
              >
                <div>
                  <p className="font-semibold text-lg">{cita.servicio}</p>
                  <p className="text-sm">
                    {new Date(cita.fecha_hora_asignada).toLocaleTimeString("es-CU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {cita.numero_cita && (
                    <p className="text-xs text-gray-500">Nº {cita.numero_cita}</p>
                  )}
                  {cita.datos_formulario && (
                    <details className="text-xs text-gray-500 mt-1">
                      <summary>Datos del cliente</summary>
                      <p>{cita.datos_formulario.nombre_completo}</p>
                      <p>{cita.datos_formulario.nombre_mascota} ({cita.datos_formulario.tipo_mascota})</p>
                    </details>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    cita.estado === "confirmada"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {cita.estado.toUpperCase()}
                  </span>
                  <button
                    onClick={() => actualizarEstadoCita(cita.id, "realizada")}
                    className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-lg text-xs font-medium"
                  >
                    ✅ Realizada
                  </button>
                  <button
                    onClick={() => actualizarEstadoCita(cita.id, "no_realizada")}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-lg text-xs font-medium"
                  >
                    ❌ No realizada
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sección: Medicación del día */}
      <section>
        <h2 className="text-xl font-semibold mb-3">💊 Medicación del día</h2>
        {recordatoriosHoy.length === 0 ? (
          <p className="text-gray-500 italic">No hay medicaciones programadas para hoy.</p>
        ) : (
          <div className="grid gap-4">
            {recordatoriosHoy.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl shadow border bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">
                      {rec.receta?.medicamento || "Medicamento"} - {rec.receta?.dosis || "Dosis no especificada"}
                    </p>
                    <p className="text-sm">
                      {new Date(rec.fecha_hora_programada).toLocaleTimeString("es-CU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {rec.mascota && (
                      <p className="text-sm font-medium">
                        🐾 {rec.mascota.nombre} 
                        {rec.mascota.propietario && ` (${rec.mascota.propietario.nombre_completo})`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                      PENDIENTE
                    </span>
                    <button
                      onClick={() => marcarRecordatorio(rec.id, "administrada")}
                      className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-lg text-xs font-medium"
                    >
                      ✅ Administrada
                    </button>
                    <button
                      onClick={() => marcarRecordatorio(rec.id, "omitida")}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium"
                    >
                      ⚪ Omitida
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}