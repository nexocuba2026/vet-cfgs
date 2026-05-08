"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

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

  useEffect(() => {
    if (!profile) return;
    const fetchCitas = async () => {
      let query = supabase.from("citas").select("*");
      if (profile.role === "cliente") {
        query = query.eq("cliente_id", profile.id);
      }
      const { data } = await query;
      if (data) setCitas(data);
      setLoading(false);
    };
    fetchCitas();
  }, [profile]);

  const handleCancelar = async (id: string) => {
    const { error } = await supabase.from("citas").update({ estado: "cancelada" }).eq("id", id);
    if (!error) {
      setCitas((prev) => prev.map((c) => c.id === id ? { ...c, estado: "cancelada" } : c));
    }
  };

  const handleAsignarConfirmar = async (id: string, fechaAsignada: string) => {
    const { error } = await supabase.from("citas").update({
      fecha_hora_asignada: fechaAsignada,
      estado: "confirmada",
    }).eq("id", id);
    if (!error) {
      setCitas((prev) => prev.map((c) => c.id === id ? { ...c, fecha_hora_asignada: fechaAsignada, estado: "confirmada" } : c));
    }
  };

  const puedeGestionar = profile?.role === "recepcionista" || profile?.role === "veterinario" || profile?.role === "superadmin";

  if (loading) return <p className="p-4">Cargando citas...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mis Citas</h1>
      {citas.length === 0 && <p>No tienes citas registradas.</p>}
      <div className="grid gap-4">
        {citas.map((cita) => (
          <div key={cita.id} className="bg-white p-4 rounded shadow flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div>
              <p className="font-semibold">{cita.servicio}</p>
              <p className="text-sm text-gray-600">
                Estado: <span className={`capitalize ${cita.estado === "confirmada" ? "text-green-600" : cita.estado === "cancelada" ? "text-red-500" : "text-yellow-600"}`}>{cita.estado}</span>
              </p>
              {cita.numero_cita && <p className="text-sm">Nº Cita: {cita.numero_cita}</p>}
              {cita.fecha_hora_asignada && <p className="text-sm">Fecha asignada: {new Date(cita.fecha_hora_asignada).toLocaleString()}</p>}
              {cita.fecha_hora_solicitada && cita.estado === "solicitada" && <p className="text-sm">Preferida: {new Date(cita.fecha_hora_solicitada).toLocaleString()}</p>}
              <details className="text-xs text-gray-500 mt-1">
                <summary>Datos del formulario</summary>
                <pre>{JSON.stringify(cita.datos_formulario, null, 2)}</pre>
              </details>
            </div>
            <div className="flex gap-2 mt-2 sm:mt-0">
              {(cita.estado === "solicitada" || cita.estado === "confirmada") && profile?.role === "cliente" && (
                <button onClick={() => handleCancelar(cita.id)} className="text-red-600 text-sm hover:underline">Cancelar</button>
              )}
              {puedeGestionar && cita.estado === "solicitada" && (
                <>
                  <input type="datetime-local" className="border rounded px-2 py-1 text-sm" id={`fecha-${cita.id}`} />
                  <button onClick={() => {
                    const fechaInput = (document.getElementById(`fecha-${cita.id}`) as HTMLInputElement)?.value;
                    if (fechaInput) handleAsignarConfirmar(cita.id, fechaInput);
                  }} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Confirmar</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}