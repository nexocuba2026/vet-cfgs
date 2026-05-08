"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ItemPedido = {
  id: string;
  cantidad: number;
  precio_unitario: number;
  producto: {
    nombre: string;
    imagen_url: string;
  };
};

export default function CarritoPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [tipoEntrega, setTipoEntrega] = useState("recogida");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!profile) return;
    cargarCarrito();
  }, [profile]);

  const cargarCarrito = async () => {
    const { data: pedido } = await supabase
      .from("pedidos")
      .select("id, tipo_entrega, direccion_envio, notas")
      .eq("cliente_id", profile!.id)
      .eq("estado", "carrito")
      .single();

    if (pedido) {
      setPedidoId(pedido.id);
      setTipoEntrega(pedido.tipo_entrega || "recogida");
      setDireccion(pedido.direccion_envio || "");
      setNotas(pedido.notas || "");

      const { data: itemsData } = await supabase
        .from("pedido_items")
        .select("id, cantidad, precio_unitario, producto:productos(nombre, imagen_url)")
        .eq("pedido_id", pedido.id);

      if (itemsData) setItems(itemsData as unknown as ItemPedido[]);
    }
  };

  const actualizarCantidad = async (itemId: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      await supabase.from("pedido_items").delete().eq("id", itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      await supabase.from("pedido_items").update({ cantidad: nuevaCantidad }).eq("id", itemId);
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, cantidad: nuevaCantidad } : i)));
    }
  };

  const subtotal = items.reduce((sum, i) => sum + i.precio_unitario * i.cantidad, 0);
  const costoEnvio = tipoEntrega === "domicilio" ? 5.0 : 0;
  const total = subtotal + costoEnvio;

  const confirmarPedido = async () => {
    if (!pedidoId || items.length === 0) return;
    setEnviando(true);
    setMensaje("");

    const { error } = await supabase
      .from("pedidos")
      .update({
        estado: "enviado",
        tipo_entrega: tipoEntrega,
        direccion_envio: tipoEntrega === "domicilio" ? direccion : null,
        notas: notas,
        fecha_pedido: new Date().toISOString(),
      })
      .eq("id", pedidoId);

    if (error) {
      setMensaje("Error al confirmar pedido: " + error.message);
      setEnviando(false);
    } else {
      setMensaje("✅ Pedido confirmado. Recibirás actualizaciones.");
      setTimeout(() => {
        router.push("/dashboard/pedidos");
      }, 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🛒 Mi Carrito</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Tu carrito está vacío.</p>
          <Link href="/dashboard/tienda" className="text-blue-600 hover:underline mt-2 block">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <>
          {/* Lista de items */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3 border-b last:border-0">
                <img
                  src={item.producto?.imagen_url || "/placeholder.png"}
                  className="w-16 h-16 object-contain rounded-lg bg-gray-100"
                  alt={item.producto?.nombre}
                />
                <div className="flex-1">
                  <p className="font-semibold">{item.producto?.nombre}</p>
                  <p className="text-sm text-gray-500">${item.precio_unitario.toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{item.cantidad}</span>
                  <button
                    onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
                <span className="font-bold w-20 text-right">${(item.precio_unitario * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Resumen y entrega */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-lg">Opciones de entrega</h2>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="entrega"
                  value="recogida"
                  checked={tipoEntrega === "recogida"}
                  onChange={() => setTipoEntrega("recogida")}
                />
                <span>Recoger en clínica (GRATIS)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="entrega"
                  value="domicilio"
                  checked={tipoEntrega === "domicilio"}
                  onChange={() => setTipoEntrega("domicilio")}
                />
                <span>Envío a domicilio (+$5.00)</span>
              </label>
            </div>
            {tipoEntrega === "domicilio" && (
              <input
                type="text"
                placeholder="Dirección completa"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Notas adicionales</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Entregar por la mañana..."
              />
            </div>
          </div>

          {/* Totales */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Envío</span>
              <span>{costoEnvio === 0 ? "GRATIS" : `$${costoEnvio.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Mensaje y botón */}
          {mensaje && (
            <div className={`p-4 rounded-lg ${mensaje.startsWith("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {mensaje}
            </div>
          )}
          <button
            onClick={confirmarPedido}
            disabled={enviando || items.length === 0 || (tipoEntrega === "domicilio" && !direccion)}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {enviando ? "Procesando..." : "✅ Confirmar pedido"}
          </button>
        </>
      )}
    </div>
  );
}