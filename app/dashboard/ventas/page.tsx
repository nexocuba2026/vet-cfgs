"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

type Venta = {
  id: string;
  fecha_pedido: string;
  estado: string;
  tipo_entrega: string;
  items: { cantidad: number; precio_unitario: number; producto: { nombre: string } }[];
  total: number;
};

export default function VentasPage() {
  const { profile } = useAuth();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [buscarProducto, setBuscarProducto] = useState("");

  useEffect(() => {
    if (profile?.role === "superadmin") fetchVentas();
  }, [profile]);

  const fetchVentas = async () => {
    const { data } = await supabase
      .from("pedidos")
      .select("id, fecha_pedido, estado, tipo_entrega, items:pedido_items(cantidad, precio_unitario, producto:productos(nombre))")
      .eq("estado", "entregado")
      .order("fecha_pedido", { ascending: false });
    if (data) {
      const ventasConTotal = data.map((pedido: any) => ({
        ...pedido,
        total: pedido.items.reduce((sum: number, item: any) => sum + item.cantidad * item.precio_unitario, 0),
      }));
      setVentas(ventasConTotal);
    }
    setLoading(false);
  };

  const ventasFiltradas = ventas.filter((v) => {
    const desdeOk = !fechaDesde || new Date(v.fecha_pedido) >= new Date(fechaDesde);
    const hastaOk = !fechaHasta || new Date(v.fecha_pedido) <= new Date(fechaHasta + "T23:59:59"); // incluir todo el día
    const productoOk =
      !buscarProducto ||
      v.items.some((item) =>
        item.producto?.nombre.toLowerCase().includes(buscarProducto.toLowerCase())
      );
    return desdeOk && hastaOk && productoOk;
  });

  const exportarPDF = async () => {
    // Import dinámico para reducir tamaño de bundle
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Registro de Ventas - ANIMALIA", 14, 20);

    const rows: any[] = [];
    ventasFiltradas.forEach((v, i) => {
      const nombres = v.items.map((item) => item.producto?.nombre).join(", ");
      const cantidad = v.items.reduce((sum, item) => sum + item.cantidad, 0);
      rows.push([
        new Date(v.fecha_pedido).toLocaleDateString(),
        nombres,
        cantidad,
        `$${v.total.toFixed(2)}`,
      ]);
    });

    autoTable(doc, {
      startY: 30,
      head: [["Fecha", "Productos", "Cantidad", "Importe"]],
      body: rows,
    });

    doc.save("ventas.pdf");
  };

  if (!profile || profile.role !== "superadmin") return <p>Acceso denegado.</p>;
  if (loading) return <p>Cargando ventas...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📊 Registro de Ventas</h1>
        <button
          onClick={exportarPDF}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          📄 Exportar PDF
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow">
        <div>
          <label className="text-xs text-gray-500">Desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="border p-2 rounded-lg w-full text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="border p-2 rounded-lg w-full text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Producto</label>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={buscarProducto}
            onChange={(e) => setBuscarProducto(e.target.value)}
            className="border p-2 rounded-lg w-full text-sm"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Productos</th>
              <th className="p-3 text-left">Cantidad</th>
              <th className="p-3 text-left">Importe</th>
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">No hay ventas registradas.</td></tr>
            ) : (
              ventasFiltradas.map((v) => (
                <tr key={v.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{new Date(v.fecha_pedido).toLocaleDateString()}</td>
                  <td className="p-3">
                    {v.items.map((item, i) => (
                      <div key={i}>{item.producto?.nombre} x{item.cantidad}</div>
                    ))}
                  </td>
                  <td className="p-3">{v.items.reduce((sum, item) => sum + item.cantidad, 0)}</td>
                  <td className="p-3 font-medium">${v.total.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}