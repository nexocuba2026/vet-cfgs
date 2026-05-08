"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

type Pedido = {
  id: string;
  estado: string;
  tipo_entrega: string;
  direccion_envio: string | null;
  notas: string | null;
  fecha_pedido: string;
  items: { cantidad: number; precio_unitario: number; producto: { nombre: string } }[];
};

export default function PedidosPage() {
  const { profile } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);

  const fetchPedidos = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("pedidos")
      .select(
        "id, estado, tipo_entrega, direccion_envio, notas, fecha_pedido, items:pedido_items(cantidad, precio_unitario, producto:productos(nombre))"
      )
      .eq("cliente_id", profile.id)
      .neq("estado", "carrito")
      .order("fecha_pedido", { ascending: false });

    if (data) setPedidos(data as unknown as Pedido[]);
    setCargando(false);
  };

  // Carga inicial de pedidos
  useEffect(() => {
    if (!profile) return;
    fetchPedidos();
  }, [profile]);

  // Suscripción a cambios en tiempo real para notificaciones
  useEffect(() => {
    if (!profile) return;

    const canal = supabase
      .channel("pedidos-cambios")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `cliente_id=eq.${profile.id}`,
        },
        (payload) => {
          const nuevoEstado = payload.new.estado;
          const viejoEstado = payload.old.estado;

          // Mostrar notificación si el estado cambió y el permiso está concedido
          if (
            nuevoEstado !== viejoEstado &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("📦 Tu pedido ha sido actualizado", {
              body: `Ahora está: ${nuevoEstado.toUpperCase()}`,
              icon: "/icon-192.png",
            });
          }

          // Recargar la lista de pedidos
          fetchPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [profile]);

  const estadoColor = (estado: string) => {
    switch (estado) {
      case "enviado":
        return "bg-yellow-100 text-yellow-700";
      case "preparando":
        return "bg-blue-100 text-blue-700";
      case "listo":
        return "bg-green-100 text-green-700";
      case "entregado":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (cargando) return <p className="p-4">Cargando pedidos...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📦 Mis Pedidos</h1>
      {pedidos.length === 0 && (
        <p className="text-gray-500">No tienes pedidos realizados.</p>
      )}
      {pedidos.map((pedido) => (
        <div key={pedido.id} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-500">
                Pedido del{" "}
                {new Date(pedido.fecha_pedido).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-400">
                {pedido.tipo_entrega === "domicilio"
                  ? "Envío a domicilio"
                  : "Recogida en clínica"}
              </p>
              {pedido.direccion_envio && (
                <p className="text-xs text-gray-400">
                  📍 {pedido.direccion_envio}
                </p>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${estadoColor(
                pedido.estado
              )}`}
            >
              {pedido.estado.toUpperCase()}
            </span>
          </div>
          <ul className="divide-y">
            {pedido.items.map((item, idx) => (
              <li key={idx} className="flex justify-between py-1 text-sm">
                <span>
                  {item.producto?.nombre} x{item.cantidad}
                </span>
                <span>
                  ${(item.precio_unitario * item.cantidad).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          {pedido.notas && (
            <p className="text-xs text-gray-500 mt-2">📝 {pedido.notas}</p>
          )}
        </div>
      ))}
    </div>
  );
}