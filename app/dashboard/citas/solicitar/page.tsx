"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function SolicitarCitaPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    nombre_completo: "",
    cedula: "",
    telefono: "",
    nombre_mascota: "",
    tipo_mascota: "perro",
    servicio: "consulta general",
    horario_preferido: "",
  });
  const [message, setMessage] = useState("");

  if (!profile || profile.role !== "cliente") {
    return <p className="p-4">Solo los clientes pueden solicitar citas.</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    console.log("🟢 Botón presionado, datos del formulario:", form);

    const datosFormulario = {
      nombre_completo: form.nombre_completo,
      cedula: form.cedula,
      telefono: form.telefono,
      nombre_mascota: form.nombre_mascota,
      tipo_mascota: form.tipo_mascota,
    };

    try {
    const { error } = await supabase.from("citas").insert({
  cliente_id: profile.id,
  servicio: form.servicio,
  fecha_hora_solicitada: form.horario_preferido || null,
  datos_formulario: datosFormulario,
  estado: "solicitada",
});

      if (error) {
        console.error("❌ Error Supabase:", error);
        setMessage("Error al solicitar: " + error.message);
      } else {
        console.log("✅ Cita insertada correctamente");
        setMessage("Cita solicitada correctamente. Recibirás confirmación pronto.");
        setTimeout(() => router.push("/dashboard/citas"), 1500);
      }
    } catch (err: any) {
      console.error("❌ Error inesperado:", err);
      setMessage("Error inesperado: " + (err.message || "Desconocido"));
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Solicitar Cita</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow flex flex-col gap-3">
        <input type="text" placeholder="Nombre completo" value={form.nombre_completo} onChange={(e) => setForm({...form, nombre_completo: e.target.value})} className="border p-2 rounded" required />
        <input type="text" placeholder="Cédula" value={form.cedula} onChange={(e) => setForm({...form, cedula: e.target.value})} className="border p-2 rounded" />
        <input type="tel" placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} className="border p-2 rounded" />
        <input type="text" placeholder="Nombre de la mascota" value={form.nombre_mascota} onChange={(e) => setForm({...form, nombre_mascota: e.target.value})} className="border p-2 rounded" required />
        <select value={form.tipo_mascota} onChange={(e) => setForm({...form, tipo_mascota: e.target.value})} className="border p-2 rounded">
          <option value="perro">Perro</option>
          <option value="gato">Gato</option>
          <option value="ave">Ave</option>
          <option value="otro">Otro</option>
        </select>
        <select value={form.servicio} onChange={(e) => setForm({...form, servicio: e.target.value})} className="border p-2 rounded">
          <option value="consulta general">Consulta general</option>
          <option value="vacunación">Vacunación</option>
          <option value="peluquería">Peluquería</option>
          <option value="cirugía">Cirugía</option>
          <option value="hospitalización">Hospitalización</option>
        </select>
        <label className="text-sm text-gray-600">
          Fecha y hora preferida:
          <input type="datetime-local" value={form.horario_preferido} onChange={(e) => setForm({...form, horario_preferido: e.target.value})} className="border p-2 rounded w-full mt-1" />
        </label>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Enviar solicitud</button>
      </form>
      {message && <p className={`mt-4 text-sm ${message.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
    </div>
  );
}