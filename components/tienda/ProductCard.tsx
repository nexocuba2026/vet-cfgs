"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url: string;
  categoria: string;
};

export default function ProductCard({ producto }: { producto: Producto }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imagenLocal, setImagenLocal] = useState<string | null>(null);

  // Descarga la imagen y la convierte a base64 para evitar problemas de carga
  useEffect(() => {
    if (!producto.imagen_url) {
      setImagenLocal(null);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    fetch(producto.imagen_url, { signal })
      .then((response) => {
        if (!response.ok) throw new Error("No se pudo cargar la imagen");
        return response.blob();
      })
      .then((blob) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      })
      .then((dataUrl) => {
        setImagenLocal(dataUrl);
      })
      .catch((error) => {
        console.warn("Error cargando imagen:", error);
        setImagenLocal(null); // se usará el placeholder automáticamente
      });

    return () => controller.abort();
  }, [producto.imagen_url]);

  const agregarAlCarrito = async () => {
    if (!profile) return;
    setLoading(true);

    const { data: pedidoData } = await supabase
      .from("pedidos")
      .select("id")
      .eq("cliente_id", profile.id)
      .eq("estado", "carrito")
      .single();

    let pedidoId = pedidoData?.id;
    if (!pedidoId) {
      const { data: nuevoPedido } = await supabase
        .from("pedidos")
        .insert({ cliente_id: profile.id, estado: "carrito", tipo_entrega: "recogida" })
        .select("id")
        .single();
      pedidoId = nuevoPedido?.id;
    }

    if (!pedidoId) return;

    const { data: itemExistente } = await supabase
      .from("pedido_items")
      .select("id, cantidad")
      .eq("pedido_id", pedidoId)
      .eq("producto_id", producto.id)
      .single();

    if (itemExistente) {
      await supabase
        .from("pedido_items")
        .update({ cantidad: itemExistente.cantidad + 1 })
        .eq("id", itemExistente.id);
    } else {
      await supabase.from("pedido_items").insert({
        pedido_id: pedidoId,
        producto_id: producto.id,
        cantidad: 1,
        precio_unitario: producto.precio,
      });
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    setLoading(false);
  };

  // Fuente de la imagen: la descargada en base64, o el placeholder
  const srcImagen = imagenLocal || "/placeholder.png";

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
        {/* Contenedor de la imagen */}
        <div
          className="w-full h-48 flex items-center justify-center bg-gray-100 cursor-pointer"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={srcImagen}
            alt={producto.nombre}
            className="max-h-full max-w-full object-contain"
            onError={(e) => {
              // Si falla incluso la base64, mostramos placeholder
              (e.target as HTMLImageElement).src = "/placeholder.png";
            }}
          />
        </div>

        {/* Información del producto */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <span className="text-xs font-medium text-blue-600 uppercase">
            {producto.categoria}
          </span>
          <h3 className="font-bold text-gray-800">{producto.nombre}</h3>
          <p className="text-xs text-gray-500 line-clamp-2">{producto.descripcion}</p>
          <div className="mt-auto flex items-center justify-between">
            <span className="text-2xl font-bold text-green-700">
              ${producto.precio.toFixed(2)}
            </span>
            <button
              onClick={agregarAlCarrito}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                added
                  ? "bg-green-500 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {added ? "✓ Agregado" : loading ? "..." : "+ Carrito"}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox (ampliar imagen) */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={srcImagen}
              alt={producto.nombre}
              className="object-contain max-h-[90vh] rounded-xl"
            />
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-8 right-0 text-white text-2xl hover:text-orange-400"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}