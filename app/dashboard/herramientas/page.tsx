"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function HerramientasPage() {
  const { profile } = useAuth();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ejecutando, setEjecutando] = useState(false);

  if (!profile || profile.role !== "superadmin") {
    return <p className="p-4">Acceso denegado.</p>;
  }

  const PASSWORD_CORRECTA = "esrZ8425*";

  const handleReiniciar = async () => {
    if (password !== PASSWORD_CORRECTA) {
      setMensaje("Contraseña incorrecta.");
      return;
    }

    setMensaje("");
    setEjecutando(true);

    try {
      const { data, error } = await supabase.rpc("reset_all_data");
      if (error) {
        setMensaje("Error al reiniciar: " + error.message);
      } else {
        // La función ahora retorna un texto
        if (data && data.includes("correctamente")) {
          setMensaje("✅ " + data);
          setMostrarModal(false);
          setPassword("");
        } else {
          setMensaje("Error: " + (data || "No se pudo completar."));
        }
      }
    } catch (err: any) {
      setMensaje("Error: " + err.message);
    } finally {
      setEjecutando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🛠️ Herramientas de Administrador</h1>

      <div className="bg-red-50 border border-red-300 p-6 rounded-xl">
        <h2 className="text-lg font-semibold text-red-700 mb-2">⚠️ Reinicio del Sistema</h2>
        <p className="text-sm text-red-600 mb-4">
          Esta acción eliminará <strong>todos</strong> los registros de la base de datos:
          clientes, mascotas, historial clínico, citas, productos, pedidos, noticias, etc.
          Solo se conservará tu cuenta de superadmin. Esta operación no se puede deshacer.
        </p>
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl"
        >
          Reiniciar sistema
        </button>
      </div>

      {mensaje && (
        <div className={`p-3 rounded-xl ${mensaje.startsWith("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {mensaje}
        </div>
      )}

      {/* Modal de confirmación */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold text-red-700">Confirmar reinicio</h3>
            <p className="text-sm text-gray-600">
              Ingresa la contraseña de administrador para continuar.
            </p>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 rounded-lg"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setPassword("");
                  setMensaje("");
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg"
                disabled={ejecutando}
              >
                Cancelar
              </button>
              <button
                onClick={handleReiniciar}
                disabled={ejecutando || !password}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {ejecutando ? "Eliminando..." : "Confirmar eliminación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}