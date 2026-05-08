"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

type PerfilConMascotas = {
  id: string;
  nombre_completo: string;
  cedula: string;
  telefono: string;
  created_at: string;
  mascotas: { id: string; nombre: string; numero_historia_clinica: string }[];
};

export default function UsuariosPage() {
  const { profile } = useAuth();
  const [clientes, setClientes] = useState<PerfilConMascotas[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== "superadmin") return;
    fetchClientes();
  }, [profile]);

  const fetchClientes = async () => {
    // Obtener todos los clientes con sus mascotas
    const { data } = await supabase
      .from("profiles")
      .select("id, nombre_completo, cedula, telefono, created_at, mascotas(id, nombre, numero_historia_clinica)")
      .eq("role", "cliente");
    if (data) setClientes(data as unknown as PerfilConMascotas[]);
    setCargando(false);
  };

  const eliminarUsuario = async (userId: string) => {
    if (!confirm("¿Eliminar este usuario? Se borrarán sus mascotas e historiales.")) return;
    // Eliminar perfil (las mascotas se eliminan en cascada gracias a ON DELETE CASCADE)
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) alert("Error: " + error.message);
    else fetchClientes();
  };

  if (!profile || profile.role !== "superadmin") return <p>Acceso denegado.</p>;
  if (cargando) return <p>Cargando usuarios...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">👥 Usuarios (Clientes)</h1>
      {clientes.length === 0 && <p>No hay clientes registrados.</p>}
      {clientes.map((c) => (
        <div key={c.id} className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-lg">{c.nombre_completo || "Sin nombre"}</p>
              <p className="text-sm text-gray-600">Cédula: {c.cedula || "—"}</p>
              <p className="text-sm text-gray-600">Teléfono: {c.telefono || "—"}</p>
              <p className="text-xs text-gray-400">
                Registrado: {new Date(c.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => eliminarUsuario(c.id)}
              className="text-red-600 hover:underline text-sm"
            >
              Eliminar usuario
            </button>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold mb-2">Mascotas:</p>
            {c.mascotas.length === 0 ? (
              <p className="text-sm text-gray-400">No tiene mascotas registradas.</p>
            ) : (
              <ul className="list-disc list-inside text-sm">
                {c.mascotas.map((m) => (
                  <li key={m.id}>
                    {m.nombre} (Nº HC: {m.numero_historia_clinica})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}