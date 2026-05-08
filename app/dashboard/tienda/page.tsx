"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/tienda/ProductCard";
import Link from "next/link";
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

export default function TiendaPage() {
  const { profile } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [filtroCat, setFiltroCat] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    const { data } = await supabase
      .from("productos")
      .select("*")
      .eq("activo", true)
      .order("nombre");
    if (data) {
      setProductos(data);
      const cats = Array.from(new Set(data.map((p) => p.categoria)));
      setCategorias(cats as string[]);
    }
    setCargando(false);
  };

  const productosFiltrados = productos.filter((p) => {
    const coincideCat = filtroCat === "todas" || p.categoria === filtroCat;
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCat && coincideBusqueda;
  });

  if (cargando) return <div className="p-8 text-center">Cargando tienda...</div>;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">🛍️ Tienda Veterinaria</h1>
        <Link
          href="/dashboard/tienda/carrito"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          🛒 Ver carrito
        </Link>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="🔍 Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filtroCat}
          onChange={(e) => setFiltroCat(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todas">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Grid de productos */}
      {productosFiltrados.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No se encontraron productos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productosFiltrados.map((prod) => (
            <ProductCard key={prod.id} producto={prod} />
          ))}
        </div>
      )}
    </div>
  );
}