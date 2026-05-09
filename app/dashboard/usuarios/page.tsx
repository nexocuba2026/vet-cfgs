"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

type PerfilCompleto = {
  id: string;
  nombre_completo: string;
  cedula: string;
  telefono: string;
  role: string;
  activo: boolean;
  created_at: string;
  mascotas: { id: string; nombre: string; numero_historia_clinica: string }[];
};

export default function UsuariosPage() {
  const { profile } = useAuth();
  const [usuarios, setUsuarios] = useState<PerfilCompleto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!profile || profile.role !== "superadmin") return;
    fetchUsuarios();
  }, [profile]);

  const fetchUsuarios = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*, mascotas(id, nombre, numero_historia_clinica)")
      .order("created_at", { ascending: false });

    if (data) setUsuarios(data as unknown as PerfilCompleto[]);
    setCargando(false);
  };

  const toggleEstado = async (userId: string) => {
    setMensaje("");
    const { error } = await supabase.rpc("toggle_user_active", { user_id: userId });
    if (error) {
      setMensaje("Error: " + error.message);
    } else {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, activo: !u.activo } : u))
      );
      setMensaje("Estado actualizado.");
    }
    setTimeout(() => setMensaje(""), 2000);
  };

  const eliminarUsuario = async (userId: string) => {
    if (!confirm("¿Eliminar definitivamente este usuario? Se borrarán sus mascotas e historiales.")) return;
    setMensaje("");
    const { error } = await supabase.rpc("admin_delete_user", { user_id: userId });
    if (error) {
      setMensaje("Error al eliminar: " + error.message);
    } else {
      setUsuarios((prev) => prev.filter((u) => u.id !== userId));
      setMensaje("Usuario eliminado.");
    }
    setTimeout(() => setMensaje(""), 2000);
  };

  if (!profile || profile.role !== "superadmin") return <p>Acceso denegado.</p>;
  if (cargando) return <p className="p-4">Cargando usuarios...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">👥 Usuarios del sistema</h1>

      {mensaje && (
        <div className={`p-3 rounded-xl ${mensaje.startsWith("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {mensaje}
        </div>
      )}

      {usuarios.length === 0 ? (
        <p>No hay usuarios registrados.</p>
      ) : (
        <div className="space-y-4">
          {usuarios.map((usuario) => (
            <div
              key={usuario.id}
              className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-800"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center font-bold text-sm uppercase">
                      {(usuario.nombre_completo?.[0] || "U")}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{usuario.nombre_completo || "Sin nombre"}</p>
                      <p className="text-xs text-gray-500 capitalize">{usuario.role}</p>
                    </div>
                    {usuario.activo ? (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">Activo</span>
                    ) : (
                      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">Inhabilitado</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <span>📧 Cédula: {usuario.cedula || "—"}</span>
                    <span>📞 Tel: {usuario.telefono || "—"}</span>
                    <span>📅 Registro: {new Date(usuario.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Mascotas del usuario */}
                  {usuario.mascotas && usuario.mascotas.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold">Mascotas:</p>
                      <ul className="list-disc list-inside text-sm text-gray-500">
                        {usuario.mascotas.map((m) => (
                          <li key={m.id}>
                            {m.nombre} (HC: {m.numero_historia_clinica})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 self-end">
                  <button
                    onClick={() => toggleEstado(usuario.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      usuario.activo
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                  >
                    {usuario.activo ? "Inhabilitar" : "Habilitar"}
                  </button>
                  <button
                    onClick={() => eliminarUsuario(usuario.id)}
                    className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}