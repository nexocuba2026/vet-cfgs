"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";

type Historia = {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  veterinario_id: string;
};

type Mascota = {
  id: string;
  numero_historia_clinica: string;
  nombre: string;
  especie: string;
  estado: string;
};

export default function HistorialPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const router = useRouter();

  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [historias, setHistorias] = useState<Historia[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("consulta");
  const [message, setMessage] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>("activa");

  useEffect(() => {
    if (!profile || !id) return;

    const fetchData = async () => {
      const { data: mascotaData } = await supabase
        .from("mascotas")
        .select("id, numero_historia_clinica, nombre, especie, estado")
        .eq("id", id)
        .single();
      if (mascotaData) {
        setMascota(mascotaData);
        setEstadoSeleccionado(mascotaData.estado ?? "activa");
      }

      const { data: historialData } = await supabase
        .from("historias_clinicas")
        .select("*")
        .eq("mascota_id", id)
        .order("fecha", { ascending: false });
      if (historialData) setHistorias(historialData);

      setLoading(false);
    };

    fetchData();
  }, [id, profile]);

  const handleGuardarEntrada = async () => {
    if (!mascota || !id) return;

    // 1. Actualizar el estado de la mascota si cambió
    if (estadoSeleccionado !== mascota.estado) {
      const { error: errorEstado } = await supabase
        .from("mascotas")
        .update({ estado: estadoSeleccionado })
        .eq("id", mascota.id);

      if (errorEstado) {
        setMessage("Error al actualizar estado: " + errorEstado.message);
        return;
      }
    }

    // 2. Insertar nueva entrada si hay texto
    if (nuevaDescripcion.trim()) {
      const { error: errorHistoria } = await supabase.from("historias_clinicas").insert({
        mascota_id: id,
        veterinario_id: profile!.id,
        tipo: nuevoTipo,
        descripcion: nuevaDescripcion,
      });

      if (errorHistoria) {
        setMessage("Error al guardar entrada: " + errorHistoria.message);
        return;
      }
    }

    // 3. Redirigir a pacientes
    setMessage("✅ Cambios guardados. Volviendo...");
    setTimeout(() => {
      router.push("/dashboard/pacientes");
    }, 1200);
  };

  if (loading) return <p className="p-4">Cargando historial...</p>;
  if (!mascota) return <p className="p-4">Mascota no encontrada.</p>;

  const puedeEditar = profile?.role === "veterinario" || profile?.role === "superadmin";

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">
        Historial de {mascota.nombre} ({mascota.especie})
      </h1>
      <p className="text-sm text-gray-500 mb-6">Nº HC: {mascota.numero_historia_clinica}</p>

      {puedeEditar && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-6 flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium">Estado del paciente:</span>
          <select
            value={estadoSeleccionado}
            onChange={(e) => setEstadoSeleccionado(e.target.value)}
            className="border p-2 rounded-lg bg-white dark:bg-gray-700 text-sm"
          >
            <option value="activa">🟢 Activa</option>
            <option value="baja">🔴 Baja</option>
          </select>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${estadoSeleccionado === 'activa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {estadoSeleccionado === 'activa' ? 'ACTIVA' : 'BAJA'}
          </span>
        </div>
      )}

      <div className="space-y-4 mb-8">
        {historias.length === 0 && <p>No hay entradas en el historial.</p>}
        {historias.map((h) => (
          <div key={h.id} className="bg-white dark:bg-gray-900 p-4 rounded shadow">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>{new Date(h.fecha).toLocaleDateString()}</span>
              <span className="capitalize">{h.tipo}</span>
            </div>
            <p className="text-gray-800 dark:text-gray-200">{h.descripcion}</p>
          </div>
        ))}
      </div>

      {puedeEditar && (
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3">Agregar al historial</h2>
          <select
            value={nuevoTipo}
            onChange={(e) => setNuevoTipo(e.target.value)}
            className="border p-2 rounded mb-2 w-full bg-white dark:bg-gray-700"
          >
            <option value="consulta">Consulta</option>
            <option value="vacuna">Vacuna</option>
            <option value="tratamiento">Tratamiento</option>
            <option value="analisis">Análisis</option>
            <option value="nota">Nota</option>
          </select>
          <textarea
            value={nuevaDescripcion}
            onChange={(e) => setNuevaDescripcion(e.target.value)}
            placeholder="Descripción del diagnóstico, tratamiento, etc."
            rows={4}
            className="border p-2 rounded w-full mb-2 bg-white dark:bg-gray-700"
          />
          <button
            onClick={handleGuardarEntrada}
            disabled={!nuevaDescripcion.trim() && estadoSeleccionado === mascota?.estado}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Guardar entrada y estado
          </button>
          {message && (
            <p className={`mt-2 text-sm ${message.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}