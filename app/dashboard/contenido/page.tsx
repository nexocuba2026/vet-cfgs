"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Seccion = {
  id: string;
  seccion: string;
  contenido: any;
};

const SECCIONES_DISPONIBLES = [
  { key: "inicio", label: "Inicio" },
  { key: "servicios", label: "Servicios" },
  { key: "faq", label: "Preguntas Frecuentes" },
];

export default function ContenidoPage() {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [selectedKey, setSelectedKey] = useState("inicio");
  const [contenido, setContenido] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Cargar todas las secciones una vez
  useEffect(() => {
    const fetchSecciones = async () => {
      const { data, error } = await supabase
        .from("contenido_web")
        .select("*");
      if (!error && data) setSecciones(data);
      setLoading(false);
    };
    fetchSecciones();
  }, []);

  // Cuando cambia la sección seleccionada, buscar su contenido en las secciones cargadas
  useEffect(() => {
    const seccion = secciones.find((s) => s.seccion === selectedKey);
    if (seccion) {
      setContenido(JSON.stringify(seccion.contenido, null, 2));
    } else {
      // Si no existe, ofrecer un objeto vacío predefinido
      setContenido(JSON.stringify({ titulo: "", texto: "" }, null, 2));
    }
  }, [selectedKey, secciones]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    let jsonContenido;
    try {
      jsonContenido = JSON.parse(contenido);
    } catch {
      setMessage("Error: El contenido no es un JSON válido.");
      setSaving(false);
      return;
    }

    const existente = secciones.find((s) => s.seccion === selectedKey);

    if (existente) {
      // Actualizar
      const { error } = await supabase
        .from("contenido_web")
        .update({
          contenido: jsonContenido,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existente.id);

      if (error) {
        setMessage("Error al actualizar: " + error.message);
      } else {
        setMessage("Contenido actualizado correctamente.");
        // Refrescar lista local
        setSecciones((prev) =>
          prev.map((s) =>
            s.id === existente.id ? { ...s, contenido: jsonContenido } : s
          )
        );
      }
    } else {
      // Insertar nuevo
      const { data, error } = await supabase
        .from("contenido_web")
        .insert({
          seccion: selectedKey,
          contenido: jsonContenido,
        })
        .select()
        .single();

      if (error) {
        setMessage("Error al insertar: " + error.message);
      } else if (data) {
        setMessage("Contenido creado correctamente.");
        setSecciones((prev) => [...prev, data]);
      }
    }
    setSaving(false);
  };

  if (loading) return <p className="p-4">Cargando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestión de Contenido</h1>

      {/* Selector de sección */}
      <div className="flex gap-2 mb-4">
        {SECCIONES_DISPONIBLES.map((sec) => (
          <button
            key={sec.key}
            onClick={() => setSelectedKey(sec.key)}
            className={`px-4 py-2 rounded ${
              selectedKey === sec.key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-black"
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Editor JSON (provisional) */}
      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        rows={15}
        className="w-full p-3 border rounded font-mono text-sm"
      />

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        {message && (
          <span
            className={`text-sm ${
              message.startsWith("Error") ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </span>
        )}
      </div>

      <p className="mt-6 text-gray-500 text-sm">
        Formato sugerido: {"{ \"titulo\": \"...\", \"texto\": \"...\" }"}
        Puedes añadir más campos si los necesitas.
      </p>
    </div>
  );
}