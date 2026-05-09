"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

type Cita = {
  id: string;
  numero_cita: string | null;
  cliente_id: string;
  mascota_id: string | null;
  servicio: string;
  fecha_hora_solicitada: string | null;
  fecha_hora_asignada: string | null;
  estado: string;
  datos_formulario: any;
  notas_internas: string | null;
};

export default function CitasPage() {
  const { profile } = useAuth();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [reagendandoId, setReagendandoId] = useState<string | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!profile) return;
    const fetchCitas = async () => {
      let query = supabase.from("citas").select("*").order("fecha_hora_asignada", { ascending: true });
      if (profile.role === "cliente") {
        query = query.eq("cliente_id", profile.id);
      }
      const { data } = await query;
      if (data) setCitas(data as Cita[]);
      setLoading(false);
    };
    fetchCitas();
  }, [profile]);

  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    setMensaje("");
    const { error } = await supabase.from("citas").update({ estado: nuevoEstado }).eq("id", id);
    if (!error) {
      setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c)));
      setMensaje(`Estado cambiado a "${nuevoEstado}".`);
      setTimeout(() => setMensaje(""), 2000);
    } else {
      setMensaje("Error: " + error.message);
    }
  };

  const confirmarReagendar = async (id: string) => {
    setMensaje("");
    if (!nuevaFecha) {
      setMensaje("⚠️ Selecciona una nueva fecha.");
      return;
    }
    const { error } = await supabase
      .from("citas")
      .update({ fecha_hora_asignada: nuevaFecha })
      .eq("id", id);

    if (error) {
      setMensaje("Error al re-agendar: " + error.message);
    } else {
      setCitas((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, fecha_hora_asignada: nuevaFecha } : c
        )
      );
      setReagendandoId(null);
      setNuevaFecha("");
      setMensaje("✅ Cita re-agendada correctamente.");
    }
    setTimeout(() => setMensaje(""), 3000);
  };

  const citasActivas = citas.filter((c) => ["solicitada", "confirmada"].includes(c.estado));
  const citasHistorial = citas.filter((c) => ["realizada", "no_realizada", "cancelada"].includes(c.estado));

  if (loading) return <p className="p-4">Cargando citas...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📅 Mis Citas</h1>
        {profile?.role === "cliente" && (
          <Link
            href="/dashboard/citas/solicitar"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition text-sm"
          >
            + Nueva Cita
          </Link>
        )}
      </div>

      {mensaje && (
        <div className={`p-3 rounded-xl text-sm ${mensaje.startsWith("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {mensaje}
        </div>
      )}

      {/* Citas activas */}
      {citasActivas.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">📌 Citas Activas</h2>
          <div className="grid gap-4">
            {citasActivas.map((cita) => (
              <div key={cita.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{cita.servicio}</p>
                    <p className="text-sm text-gray-500">
                      {cita.fecha_hora_asignada
                        ? new Date(cita.fecha_hora_asignada).toLocaleString()
                        : cita.fecha_hora_solicitada
                        ? "Solicitada: " + new Date(cita.fecha_hora_solicitada).toLocaleString()
                        : "Sin fecha"}
                    </p>
                    {cita.numero_cita && <p className="text-xs text-gray-400">Nº {cita.numero_cita}</p>}
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                    {cita.estado.toUpperCase()}
                  </span>
                </div>

                {/* Botones de acción */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => actualizarEstado(cita.id, "realizada")}
                    className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-lg text-sm font-medium"
                  >
                    ✅ Realizada
                  </button>
                  <button
                    onClick={() => actualizarEstado(cita.id, "no_realizada")}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-lg text-sm font-medium"
                  >
                    ❌ No realizada
                  </button>
                  {reagendandoId === cita.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="datetime-local"
                        value={nuevaFecha}
                        onChange={(e) => setNuevaFecha(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => confirmarReagendar(cita.id)}
                        disabled={!nuevaFecha}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          !nuevaFecha
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-blue-100 hover:bg-blue-200 text-blue-800"
                        }`}
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setReagendandoId(null)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReagendandoId(cita.id)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium"
                    >
                      🔁 Re-agendar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historial de citas */}
      {citasHistorial.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 mt-8">📋 Historial de Citas</h2>
          <div className="grid gap-4">
            {citasHistorial.map((cita) => (
              <div
                key={cita.id}
                className={`p-4 rounded-xl shadow border ${
                  cita.estado === "realizada"
                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    : cita.estado === "no_realizada"
                    ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                    : "bg-gray-50 border-gray-200 dark:bg-gray-800"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{cita.servicio}</p>
                    <p className="text-sm">
                      {cita.fecha_hora_asignada
                        ? new Date(cita.fecha_hora_asignada).toLocaleString()
                        : cita.fecha_hora_solicitada
                        ? "Solicitada: " + new Date(cita.fecha_hora_solicitada).toLocaleString()
                        : "Sin fecha"}
                    </p>
                    {cita.numero_cita && <p className="text-xs text-gray-400">Nº {cita.numero_cita}</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    cita.estado === "realizada"
                      ? "bg-green-100 text-green-700"
                      : cita.estado === "no_realizada"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {cita.estado.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {citas.length === 0 && <p className="text-gray-500">No tienes citas registradas.</p>}
    </div>
  );
}