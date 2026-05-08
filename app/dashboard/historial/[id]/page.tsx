"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

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
};

export default function HistorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [historias, setHistorias] = useState<Historia[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("consulta");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      // Cargar mascota
      const { data: mascotaData } = await supabase
        .from("mascotas")
        .select("*")
        .eq("id", id)
        .single();
      if (mascotaData) setMascota(mascotaData);

      // Cargar historial
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

  const handleAgregarHistoria = async () => {
    if (!nuevaDescripcion.trim()) return;

    const { error } = await supabase.from("historias_clinicas").insert({
      mascota_id: id,
      veterinario_id: profile!.id,
      tipo: nuevoTipo,
      descripcion: nuevaDescripcion,
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Historial actualizado.");
      setNuevaDescripcion("");
      // Refrescar la lista
      const { data } = await supabase
        .from("historias_clinicas")
        .select("*")
        .eq("mascota_id", id)
        .order("fecha", { ascending: false });
      if (data) setHistorias(data);
    }
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

      {/* Lista de entradas */}
      <div className="space-y-4 mb-8">
        {historias.length === 0 && <p>No hay entradas en el historial.</p>}
        {historias.map((h) => (
          <div key={h.id} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>{h.fecha}</span>
              <span className="capitalize">{h.tipo}</span>
            </div>
            <p className="text-gray-800">{h.descripcion}</p>
          </div>
        ))}
      </div>

      {/* Formulario para añadir entrada (solo vet/superadmin) */}
      {puedeEditar && (
        <div className="bg-gray-100 p-6 rounded">
          <h2 className="text-xl font-semibold mb-3">Agregar al historial</h2>
          <select
            value={nuevoTipo}
            onChange={(e) => setNuevoTipo(e.target.value)}
            className="border p-2 rounded mb-2 w-full"
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
            className="border p-2 rounded w-full mb-2"
          />
          <button
            onClick={handleAgregarHistoria}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Guardar entrada
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