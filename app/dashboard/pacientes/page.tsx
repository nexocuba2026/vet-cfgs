"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

type Propietario = {
  id: string;
  nombre_completo: string;
  cedula: string;
  direccion: string;
  telefono: string;
};

type Mascota = {
  id: string;
  nombre: string;
  especie: string;
  raza: string;
  peso: number;
  fecha_nacimiento: string;
  estado: string;
  numero_historia_clinica: string;
  propietario_id: string;
  propietario?: Propietario;
};

export default function PacientesPage() {
  const { profile } = useAuth();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Formulario – estado inicial sin campo estado
  const [formPropietario, setFormPropietario] = useState<Propietario>({
    id: "",
    nombre_completo: "",
    cedula: "",
    direccion: "",
    telefono: "",
  });
  const [formMascota, setFormMascota] = useState({
    nombre: "",
    especie: "perro",
    raza: "",
    fecha_nacimiento: "",
    peso: "",
  });

  useEffect(() => {
    if (!profile) return;
    fetchMascotas();
  }, [profile]);

  const fetchMascotas = async () => {
    if (!profile) return;
    let query = supabase
      .from("mascotas")
      .select("*, propietario:propietario_id (nombre_completo, cedula, direccion, telefono)");
    if (profile.role === "cliente") {
      query = query.eq("propietario_id", profile.id);
    }
    const { data } = await query;
    if (data) setMascotas(data as unknown as Mascota[]);
    setCargando(false);
  };

  const handleCrearPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");

    // 1. Buscar o crear propietario
    let propietarioId = formPropietario.id;
    if (!propietarioId) {
      // Buscar por cédula
      const { data: existente } = await supabase
        .from("profiles")
        .select("id")
        .eq("cedula", formPropietario.cedula)
        .single();
      if (existente) {
        propietarioId = existente.id;
      } else {
        // Crear nuevo perfil de cliente
        const { data: nuevo, error: errorCreado } = await supabase
          .from("profiles")
          .insert({
            role: "cliente",
            nombre_completo: formPropietario.nombre_completo,
            cedula: formPropietario.cedula || null,
            direccion: formPropietario.direccion || null,
            telefono: formPropietario.telefono || null,
          })
          .select("id")
          .single();
        if (errorCreado) {
          setMensaje("Error al crear propietario: " + errorCreado.message);
          return;
        }
        propietarioId = nuevo.id;
      }
    }

    // 2. Insertar mascota (siempre con estado activa)
    const { data: nuevaMascota, error: errorMascota } = await supabase
      .from("mascotas")
      .insert({
        propietario_id: propietarioId,
        nombre: formMascota.nombre,
        especie: formMascota.especie,
        raza: formMascota.raza || null,
        fecha_nacimiento: formMascota.fecha_nacimiento || null,
        peso: formMascota.peso ? parseFloat(formMascota.peso) : null,
        estado: 'activa',   // siempre activa al crear
      })
      .select("id, numero_historia_clinica")
      .single();

    if (errorMascota) {
      setMensaje("Error al registrar mascota: " + errorMascota.message);
      return;
    }

    // 3. Crear entrada automática en historia clínica
    if (nuevaMascota) {
      await supabase.from("historias_clinicas").insert({
        mascota_id: nuevaMascota.id,
        veterinario_id: profile!.id,
        tipo: "nota",
        descripcion: `Paciente registrado. Número de historia: ${nuevaMascota.numero_historia_clinica}`,
      });
    }

    // 4. Recargar lista y cerrar formulario
    setMensaje("✅ Paciente registrado correctamente.");
    setMostrarFormulario(false);
    setFormPropietario({ id: "", nombre_completo: "", cedula: "", direccion: "", telefono: "" });
    setFormMascota({ nombre: "", especie: "perro", raza: "", fecha_nacimiento: "", peso: "" });
    fetchMascotas();
  };

  if (cargando) return <p className="p-4">Cargando pacientes...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🐾 Pacientes</h1>
        {profile?.role !== "cliente" && (
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            + Nuevo Paciente
          </button>
        )}
      </div>

      {mensaje && (
        <div className="bg-green-100 text-green-800 p-4 rounded-xl">{mensaje}</div>
      )}

      {/* Formulario de alta – sin selector de estado */}
      {mostrarFormulario && (
        <form onSubmit={handleCrearPaciente} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-orange-600">Registrar Nuevo Paciente</h2>

          {/* Datos del propietario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre completo del propietario *"
              value={formPropietario.nombre_completo}
              onChange={(e) => setFormPropietario({ ...formPropietario, nombre_completo: e.target.value })}
              className="border p-3 rounded-xl w-full"
              required
            />
            <input
              type="text"
              placeholder="Carnet (Cédula)"
              value={formPropietario.cedula}
              onChange={(e) => setFormPropietario({ ...formPropietario, cedula: e.target.value })}
              className="border p-3 rounded-xl w-full"
            />
            <input
              type="text"
              placeholder="Dirección"
              value={formPropietario.direccion}
              onChange={(e) => setFormPropietario({ ...formPropietario, direccion: e.target.value })}
              className="border p-3 rounded-xl w-full"
            />
            <input
              type="text"
              placeholder="Teléfono"
              value={formPropietario.telefono}
              onChange={(e) => setFormPropietario({ ...formPropietario, telefono: e.target.value })}
              className="border p-3 rounded-xl w-full"
            />
          </div>

          {/* Datos de la mascota – sin el selector de estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre de la mascota *"
              value={formMascota.nombre}
              onChange={(e) => setFormMascota({ ...formMascota, nombre: e.target.value })}
              className="border p-3 rounded-xl w-full"
              required
            />
            <select
              value={formMascota.especie}
              onChange={(e) => setFormMascota({ ...formMascota, especie: e.target.value })}
              className="border p-3 rounded-xl w-full"
            >
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
              <option value="ave">Ave</option>
              <option value="cerdo">Cerdo</option>
              <option value="otro">Otro</option>
            </select>
            <input
              type="text"
              placeholder="Raza"
              value={formMascota.raza}
              onChange={(e) => setFormMascota({ ...formMascota, raza: e.target.value })}
              className="border p-3 rounded-xl w-full"
            />
            <input
              type="date"
              placeholder="Fecha de nacimiento"
              value={formMascota.fecha_nacimiento}
              onChange={(e) => setFormMascota({ ...formMascota, fecha_nacimiento: e.target.value })}
              className="border p-3 rounded-xl w-full"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Peso (kg)"
              value={formMascota.peso}
              onChange={(e) => setFormMascota({ ...formMascota, peso: e.target.value })}
              className="border p-3 rounded-xl w-full"
            />
          </div>

          <div className="flex gap-4">
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-xl transition">
              Guardar Paciente
            </button>
            <button type="button" onClick={() => setMostrarFormulario(false)} className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-3 rounded-xl transition">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Listado de pacientes */}
      {mascotas.length === 0 ? (
        <p className="text-gray-500">No se encontraron pacientes.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mascotas.map((m) => (
            <div key={m.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold">{m.nombre}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${m.estado === 'activa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {m.estado.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600">{m.especie} {m.raza && `· ${m.raza}`}</p>
              {m.peso && <p className="text-sm text-gray-500">{m.peso} kg</p>}
              {m.numero_historia_clinica && (
                <p className="text-xs text-gray-400 mt-1">HC: {m.numero_historia_clinica}</p>
              )}
              {m.propietario && (
                <p className="text-xs text-gray-500 mt-2">
                  Propietario: {m.propietario.nombre_completo || "—"} · {m.propietario.telefono || "Sin teléfono"}
                </p>
              )}
              <div className="mt-3">
                <Link href={`/dashboard/historial/${m.id}`} className="text-orange-600 hover:underline text-sm font-medium">
                  Ver historial
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}