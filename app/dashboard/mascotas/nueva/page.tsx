"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function NuevaMascotaPage() {
  const { profile } = useAuth();
  const router = useRouter();

  // Campos del propietario
  const [buscarCliente, setBuscarCliente] = useState("");
 const [clienteEncontrado, setClienteEncontrado] = useState<{
  id: string;
  nombre_completo: string;
  cedula: string;
  telefono: string;
} | null>(null);
  const [crearNuevo, setCrearNuevo] = useState(false);
  const [nombreProp, setNombreProp] = useState("");
  const [cedulaProp, setCedulaProp] = useState("");
  const [telefonoProp, setTelefonoProp] = useState("");

  // Campos de la mascota
  const [nombreMascota, setNombreMascota] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [peso, setPeso] = useState("");
  const [tipo, setTipo] = useState("perro");
  const [raza, setRaza] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Buscar cliente por cédula o nombre
  const handleBuscarCliente = async () => {
    if (!buscarCliente.trim()) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, nombre_completo, cedula, telefono")
      .eq("role", "cliente")
      .or(`cedula.eq.${buscarCliente}, nombre_completo.ilike.%${buscarCliente}%`)
      .single();
    if (data) {
      setClienteEncontrado(data);
      setCrearNuevo(false);
    } else {
      setClienteEncontrado(null);
      setCrearNuevo(true);
      setNombreProp("");
      setCedulaProp(buscarCliente); // asume que la búsqueda fue por cédula
      setTelefonoProp("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje("");

    // Determinar propietario
    let propietarioId: string;

    if (clienteEncontrado) {
      propietarioId = clienteEncontrado.id;
    } else {
      // Crear nuevo cliente con los datos ingresados
      const { data: nuevoCliente, error: errorCliente } = await supabase
        .from("profiles")
        .insert({
          role: "cliente",
          nombre_completo: nombreProp,
          cedula: cedulaProp,
          telefono: telefonoProp,
        })
        .select("id")
        .single();

      if (errorCliente) {
        setMensaje("Error al crear propietario: " + errorCliente.message);
        setGuardando(false);
        return;
      }
      propietarioId = nuevoCliente.id;
    }

    // Calcular edad a partir de la fecha de nacimiento (opcional)
    let edad = null;
    if (fechaNacimiento) {
      const hoy = new Date();
      const nac = new Date(fechaNacimiento);
      edad = hoy.getFullYear() - nac.getFullYear();
      const mes = hoy.getMonth() - nac.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) {
        edad--;
      }
    }

    // Insertar mascota
    const { error: errorMascota } = await supabase.from("mascotas").insert({
      propietario_id: propietarioId,
      nombre: nombreMascota,
      especie: tipo, // guardamos como especie el tipo seleccionado
      raza: raza || null,
      fecha_nacimiento: fechaNacimiento || null,
      peso: peso ? parseFloat(peso) : null,
    });

    if (errorMascota) {
      setMensaje("Error al registrar mascota: " + errorMascota.message);
    } else {
      setMensaje("Mascota registrada correctamente. Redirigiendo...");
      setTimeout(() => router.push("/dashboard/mascotas"), 1500);
    }
    setGuardando(false);
  };

  if (!profile || !["superadmin", "veterinario", "recepcionista"].includes(profile.role)) {
    return <p className="p-4">No tienes permiso para registrar mascotas.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Registrar Nueva Mascota</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
        {/* Sección propietario */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Propietario</h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Buscar por cédula o nombre"
              value={buscarCliente}
              onChange={(e) => setBuscarCliente(e.target.value)}
              className="flex-1 border p-2 rounded"
            />
            <button
              type="button"
              onClick={handleBuscarCliente}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Buscar
            </button>
          </div>

          {clienteEncontrado && (
            <div className="bg-green-50 p-3 rounded mb-3">
              <p>✅ Cliente encontrado: {clienteEncontrado.nombre_completo}</p>
              <p className="text-sm">Cédula: {clienteEncontrado.cedula} | Tel: {clienteEncontrado.telefono}</p>
            </div>
          )}

          {crearNuevo && (
            <div className="border p-4 rounded bg-gray-50 space-y-2">
              <p className="text-sm font-medium">Nuevo propietario (no encontrado):</p>
              <input
                type="text"
                placeholder="Nombre completo *"
                value={nombreProp}
                onChange={(e) => setNombreProp(e.target.value)}
                required
                className="w-full border p-2 rounded"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Cédula"
                  value={cedulaProp}
                  onChange={(e) => setCedulaProp(e.target.value)}
                  className="flex-1 border p-2 rounded"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={telefonoProp}
                  onChange={(e) => setTelefonoProp(e.target.value)}
                  className="flex-1 border p-2 rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sección mascota */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Datos de la mascota</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nombre de la mascota *"
              value={nombreMascota}
              onChange={(e) => setNombreMascota(e.target.value)}
              required
              className="border p-2 rounded"
            />
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
              <option value="pajaro">Pájaro</option>
              <option value="cerdo">Cerdo</option>
              <option value="otro">Otro</option>
            </select>
            <input
              type="text"
              placeholder="Raza"
              value={raza}
              onChange={(e) => setRaza(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Peso (kg)"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="border p-2 rounded"
            />
            <label className="flex flex-col text-sm">
              Fecha de nacimiento
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="border p-2 rounded mt-1"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Registrar Mascota"}
        </button>

        {mensaje && (
          <p className={`text-sm ${mensaje.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
            {mensaje}
          </p>
        )}
      </form>
    </div>
  );
}