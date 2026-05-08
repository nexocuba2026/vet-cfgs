"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

type Mascota = {
  id: string;
  numero_historia_clinica: string;
  nombre: string;
  especie: string;
  raza: string;
  propietario_id: string;
};

export default function MascotasListaPage() {
  const { profile } = useAuth();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchMascotas = async () => {
      let query = supabase.from("mascotas").select("*");
      // Si es cliente, solo ve sus propias mascotas
      if (profile.role === "cliente") {
        query = query.eq("propietario_id", profile.id);
      }
      const { data, error } = await query;
      if (!error && data) setMascotas(data);
      setLoading(false);
    };

    fetchMascotas();
  }, [profile]);

  if (loading) return <p className="p-4">Cargando mascotas...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Mascotas</h1>
        {profile?.role !== "cliente" && (
          <Link
            href="/dashboard/mascotas/nueva"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Nueva Mascota
          </Link>
        )}
      </div>
      {mascotas.length === 0 ? (
        <p>No se encontraron mascotas.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mascotas.map((m) => (
            <div key={m.id} className="bg-white p-4 rounded shadow">
              <p className="font-bold text-lg">{m.nombre}</p>
              <p className="text-sm text-gray-600">{m.especie} - {m.raza || "Sin raza"}</p>
              <p className="text-xs text-gray-400">Nº HC: {m.numero_historia_clinica}</p>
              <Link
                href={`/dashboard/historial/${m.id}`}
                className="text-blue-600 hover:underline text-sm mt-2 inline-block"
              >
                Ver historial
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}