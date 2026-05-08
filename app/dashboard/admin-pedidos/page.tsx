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
      .neq("estado", "carrito")
      .order("fecha_pedido", { ascending: false });

    if (data) setPedidos(data as unknown as Pedido[]);
  };

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
  await supabase.from("pedidos").update({ estado: nuevoEstado }).eq("id", id);
  fetchPedidos();
  // Aquí después conectaremos notificaciones al cliente
};

  if (!profile || !["recepcionista", "veterinario", "superadmin"].includes(profile.role))
    return <p>Acceso denegado.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📋 Pedidos Recibidos</h1>
      {pedidos.map((pedido) => (
        <div key={pedido.id} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-semibold">
                {pedido.perfil?.nombre_completo || "Cliente"} {pedido.perfil?.telefono && `📞 ${pedido.perfil.telefono}`}
              </p>
              <p className="text-sm text-gray-500">{new Date(pedido.fecha_pedido).toLocaleString()}</p>
              <p className="text-sm">{pedido.tipo_entrega === "domicilio" ? `🚚 ${pedido.direccion_envio}` : "🏥 Recoger en clínica"}</p>
              {pedido.notas && <p className="text-sm text-gray-500">📝 {pedido.notas}</p>}
            </div>
            <select
              value={pedido.estado}
              onChange={(e) => cambiarEstado(pedido.id, e.target.value)}
              className="border rounded-lg px-3 py-1 text-sm"
            >
              <option value="enviado">Enviado</option>
              <option value="preparando">Preparando</option>
              <option value="listo">Listo</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>
          <ul className="divide-y text-sm">
            {pedido.items.map((item, idx) => (
              <li key={idx} className="flex justify-between py-1">
                <span>{item.producto?.nombre} x{item.cantidad}</span>
                <span>${(item.precio_unitario * item.cantidad).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}