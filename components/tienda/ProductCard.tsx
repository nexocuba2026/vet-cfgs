"use client";

import { useState } from "react";
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

export default function ProductCard({ producto, onAdd }: { producto: Producto; onAdd?: (producto: Producto) => void }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

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
    if (onAdd) onAdd(producto);
    setLoading(false);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <img
          src={producto.imagen_url || "/placeholder.png"}
          alt={producto.nombre}
          className="object-contain max-h-full max-w-full p-4"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.png";
          }}
        />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-xs font-medium text-orange-600 uppercase">{producto.categoria}</span>
        <h3 className="font-bold text-gray-800 dark:text-gray-200">{producto.nombre}</h3>
        <p className="text-xs text-gray-500 line-clamp-2">{producto.descripcion}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xl font-bold text-green-600">${producto.precio.toFixed(2)}</span>
          <button
            onClick={agregarAlCarrito}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              added
                ? "bg-green-500 text-white"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          >
            {added ? "✓ Agregado" : loading ? "..." : "+ Carrito"}
          </button>
        </div>
      </div>
    </div>
  );
}