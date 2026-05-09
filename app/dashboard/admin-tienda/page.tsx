"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string;
  categoria: string;
  activo: boolean;
  stock_visible: boolean;
};

export default function AdminTiendaPage() {
  const { profile } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);

  // Carga productos al montar y cuando se cambia de edición
  const fetchProductos = async () => {
    const { data } = await supabase.from("productos").select("*").order("nombre");
    if (data) setProductos(data);
  };

  useEffect(() => {
    if (profile?.role === "superadmin") fetchProductos();
  }, [profile]);

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setMensaje("");

    let imagenUrl = editando.imagen_url;

    if (archivoSeleccionado) {
      const nombreArchivo = `productos/${Date.now()}_${archivoSeleccionado.name}`;
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
      nombre: editando.nombre,
      descripcion: editando.descripcion,
      precio: editando.precio,
      imagen_url: imagenUrl,
      categoria: editando.categoria,
      activo: editando.activo,
    };

    const { error } = editando.id
      ? await supabase.from("productos").update(datos).eq("id", editando.id)
      : await supabase.from("productos").insert(datos);

    if (error) setMensaje("Error: " + error.message);
    else {
      setMensaje("Producto guardado.");
      setEditando(null);
      setArchivoSeleccionado(null);
      fetchProductos();
    }
  };

  const eliminarProducto = async (id: string) => {
    if (!confirm("¿Eliminar producto?")) return;
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) setMensaje("Error al eliminar: " + error.message);
    else fetchProductos();
  };

  if (!profile || profile.role !== "superadmin") return <p>Acceso denegado.</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📦 Gestión de Productos</h1>
        <button
          onClick={() =>
            setEditando({
              id: "",
              nombre: "",
              descripcion: "",
              precio: 0,
              imagen_url: "",
              categoria: "",
              activo: true,
              stock_visible: false,
            })
          }
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nuevo Producto
        </button>
      </div>

      {mensaje && (
        <div className="bg-green-100 text-green-800 p-3 rounded-xl">{mensaje}</div>
      )}

      {/* Tabla de productos */}
      <div className="bg-white rounded-xl shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Categoría</th>
              <th className="p-3 text-left">Precio</th>
              <th className="p-3 text-center">Activo</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No hay productos registrados.
                </td>
              </tr>
            ) : (
              productos.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.nombre}</td>
                  <td className="p-3">{p.categoria}</td>
                  <td className="p-3">${p.precio.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    {p.activo ? "✅" : "❌"}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setEditando(p)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarProducto(p.id)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de edición/creación */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            onSubmit={guardarProducto}
            className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold">
              {editando.id ? "Editar" : "Nuevo"} Producto
            </h2>
            <input
              type="text"
              placeholder="Nombre"
              value={editando.nombre}
              onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <textarea
              placeholder="Descripción"
              value={editando.descripcion}
              onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Precio"
              value={editando.precio}
              onChange={(e) => setEditando({ ...editando, precio: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <div>
              <label className="block text-sm font-medium mb-1">Imagen del producto</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setArchivoSeleccionado(e.target.files[0]);
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {editando.imagen_url && (
                <img
                  src={editando.imagen_url}
                  alt="Vista previa"
                  className="w-24 h-24 object-contain mt-2 rounded border"
                />
              )}
            </div>
            <input
              type="text"
              placeholder="Categoría"
              value={editando.categoria}
              onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editando.activo}
                onChange={(e) => setEditando({ ...editando, activo: e.target.checked })}
              />
              Activo
            </label>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditando(null);
                  setArchivoSeleccionado(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}