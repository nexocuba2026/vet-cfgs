"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

type Noticia = {
  id: string;
  titulo: string;
  contenido: string;
  imagen_url: string;
  publicada: boolean;
  created_at: string;
};

export default function NoticiasPage() {
  const { profile } = useAuth();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [editando, setEditando] = useState<Noticia | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);

  const esSuperadmin = profile?.role === "superadmin";

  useEffect(() => {
    if (!profile) return;
    fetchNoticias();
  }, [profile]);

  const fetchNoticias = async () => {
    let query = supabase
      .from("noticias")
      .select("*")
      .order("created_at", { ascending: false });

    if (!esSuperadmin) {
      query = query.eq("publicada", true);
    }

    const { data } = await query;
    if (data) setNoticias(data);
  };

  // Suscripción a nuevas noticias en tiempo real
  useEffect(() => {
    if (!profile) return;

    const canal = supabase
      .channel("noticias-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "noticias",
        },
        (payload) => {
          const nueva = payload.new as Noticia;
          if (nueva.publicada && Notification.permission === "granted") {
            new Notification("📰 Nueva noticia", {
              body: nueva.titulo,
              icon: "/logo.png",
            });
          }
          fetchNoticias();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [profile]);

  const guardarNoticia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setMensaje("");

    let imagenUrl = editando.imagen_url;

    if (archivoSeleccionado) {
      const nombreArchivo = `noticias/${Date.now()}_${archivoSeleccionado.name}`;
      const { error: uploadError } = await supabase.storage
        .from("archivos")
        .upload(nombreArchivo, archivoSeleccionado);

      if (uploadError) {
        setMensaje("Error al subir imagen: " + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("archivos")
        .getPublicUrl(nombreArchivo);
      imagenUrl = urlData.publicUrl;
    }

    const datos = {
      titulo: editando.titulo,
      contenido: editando.contenido,
      imagen_url: imagenUrl || null,
      publicada: editando.publicada,
    };

    const { error } = editando.id
      ? await supabase.from("noticias").update(datos).eq("id", editando.id)
      : await supabase.from("noticias").insert(datos);

    if (error) {
      setMensaje("Error: " + error.message);
    } else {
      setMensaje("Noticia guardada.");
      setEditando(null);
      setArchivoSeleccionado(null);
      fetchNoticias();
    }
  };

  const eliminarNoticia = async (id: string) => {
    if (!confirm("¿Eliminar esta noticia?")) return;
    const { error } = await supabase.from("noticias").delete().eq("id", id);
    if (!error) fetchNoticias();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📰 Noticias</h1>
        {esSuperadmin && (
          <button
            onClick={() =>
              setEditando({
                id: "",
                titulo: "",
                contenido: "",
                imagen_url: "",
                publicada: false,
                created_at: "",
              })
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Nueva Noticia
          </button>
        )}
      </div>

      {mensaje && (
        <div className="bg-green-100 text-green-800 p-3 rounded-xl">{mensaje}</div>
      )}

      {noticias.length === 0 ? (
        <p className="text-gray-500">No hay noticias disponibles.</p>
      ) : (
        <div className="grid gap-4">
          {noticias.map((n) => (
            <div
              key={n.id}
              className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow border border-gray-100 dark:border-gray-800"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{n.titulo}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">
                    {n.contenido}
                  </p>
                  {n.imagen_url && (
                    <img
                      src={n.imagen_url}
                      alt={n.titulo}
                      className="mt-3 max-w-full h-auto max-h-60 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex gap-2 mt-2 text-xs text-gray-500">
                    <span>{new Date(n.created_at).toLocaleDateString()}</span>
                    {esSuperadmin && (
                      <>
                        <span>·</span>
                        <span>{n.publicada ? "✅ Publicada" : "📝 Borrador"}</span>
                      </>
                    )}
                  </div>
                </div>
                {esSuperadmin && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditando(n)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarNoticia(n.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editando && esSuperadmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            onSubmit={guardarNoticia}
            className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold">
              {editando.id ? "Editar" : "Nueva"} Noticia
            </h2>
            <input
              type="text"
              placeholder="Título"
              value={editando.titulo}
              onChange={(e) => setEditando({ ...editando, titulo: e.target.value })}
              className="w-full border p-2 rounded-lg"
              required
            />
            <textarea
              placeholder="Contenido de la noticia"
              value={editando.contenido}
              onChange={(e) => setEditando({ ...editando, contenido: e.target.value })}
              className="w-full border p-2 rounded-lg"
              rows={5}
            />
            <div>
              <label className="block text-sm font-medium mb-1">
                Imagen (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) setArchivoSeleccionado(e.target.files[0]);
                }}
                className="w-full"
              />
              {editando.imagen_url && (
                <img
                  src={editando.imagen_url}
                  alt="Vista previa"
                  className="w-32 h-32 object-contain mt-2 rounded border"
                />
              )}
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editando.publicada}
                onChange={(e) =>
                  setEditando({ ...editando, publicada: e.target.checked })
                }
              />
              Publicar ahora
            </label>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}