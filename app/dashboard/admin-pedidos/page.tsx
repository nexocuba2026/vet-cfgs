"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

type Pedido = {
  id: string;
  cliente_id: string;
  estado: string;
  tipo_entrega: string;
  direccion_envio: string | null;
  notas: string | null;
  fecha_pedido: string;
  items: { cantidad: number; precio_unitario: number; producto: { nombre: string } }[];
  perfil?: { nombre_completo: string; telefono: string };
};

export default function AdminPedidosPage() {
  const { profile } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    if (profile?.role && ["recepcionista", "veterinario", "superadmin"].includes(profile.role)) {
      fetchPedidos();
    }
  }, [profile]);

  const fetchPedidos = async () => {
    const { data } = await supabase
      .from("pedidos")
      .select("id, cliente_id, estado, tipo_entrega, direccion_envio, notas, fecha_pedido, items:pedido_items(cantidad, precio_unitario, producto:productos(nombre)), perfil:profiles!cliente_id(nombre_completo, telefono)")
      .not("estado", "in", '("carrito","entregado")')  // excluir carrito y entregados
      .order("fecha_pedido", { ascending: false });

    if (data) setPedidos(data as unknown as Pedido[]);
  };

  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from("pedidos")
      .update({ estado: nuevoEstado })
      .eq("id", id);
    if (!error) {
      fetchPedidos(); // refrescar lista
    }
  };

  if (!profile || !["recepcionista", "veterinario", "superadmin"].includes(profile.role))
    return <p>Acceso denegado.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📋 Pedidos Activos</h1>
      {pedidos.length === 0 && <p>No hay pedidos activos.</p>}
      {pedidos.map((pedido) => {
        // Determinar qué botones mostrar según el estado
        const estado = pedido.estado;
        const puedeRecibir = estado === "enviado";            // pedido inicial
        const puedeEnviar = estado === "recibido";            // ya fue recibido
        const puedeEntregar = estado === "enviado_entrega";   // ya fue marcado enviado

        return (
          <div key={pedido.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-semibold">
                  {pedido.perfil?.nombre_completo || "Cliente"} {pedido.perfil?.telefono && `📞 ${pedido.perfil.telefono}`}
                </p>
                <p className="text-sm text-gray-500">{new Date(pedido.fecha_pedido).toLocaleString()}</p>
                <p className="text-sm">
                  {pedido.tipo_entrega === "domicilio" ? `🚚 ${pedido.direccion_envio}` : "🏥 Recoger en clínica"}
                </p>
                {pedido.notas && <p className="text-sm text-gray-500">📝 {pedido.notas}</p>}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                estado === "enviado" ? "bg-yellow-100 text-yellow-700" :
                estado === "recibido" ? "bg-blue-100 text-blue-700" :
                estado === "enviado_entrega" ? "bg-purple-100 text-purple-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {estado.replace("_", " ")}
              </span>
            </div>

            <ul className="divide-y text-sm mb-3">
              {pedido.items.map((item, idx) => (
                <li key={idx} className="flex justify-between py-1">
                  <span>{item.producto?.nombre} x{item.cantidad}</span>
                  <span>${(item.precio_unitario * item.cantidad).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            {/* Botones de acción */}
            <div className="flex gap-2">
              {puedeRecibir && (
                <button
                  onClick={() => actualizarEstado(pedido.id, "recibido")}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  ✅ Recibido
                </button>
              )}
              {puedeEnviar && (
                <button
                  onClick={() => actualizarEstado(pedido.id, "enviado_entrega")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  🚀 Enviado
                </button>
              )}
              {puedeEntregar && (
                <button
                  onClick={() => actualizarEstado(pedido.id, "entregado")}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
                >
                  📬 Entregado
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}