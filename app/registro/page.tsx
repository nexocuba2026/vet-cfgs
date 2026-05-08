"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // 1. Crear usuario en auth.users con metadatos
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: nombre,
          cedula: cedula,
          telefono: telefono,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // El trigger handle_new_user creará automáticamente el perfil en public.profiles
      // con los metadatos enviados y el rol 'cliente'.
      // Si el trigger falla, podemos insertarlo manualmente (pero no debería).
      setMessage("Registro exitoso. Redirigiendo al inicio de sesión...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } else {
      setMessage("No se pudo crear el usuario. Inténtalo de nuevo.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Crear Cuenta</h1>
        <form onSubmit={handleRegistro} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border p-2 rounded text-black"
            required
          />
          <input
            type="text"
            placeholder="Cédula"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            className="border p-2 rounded text-black"
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="border p-2 rounded text-black"
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded text-black"
            required
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded text-black"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>
        {message && (
          <p
            className={`mt-4 text-sm text-center ${
              message.includes("error") || message.includes("no pudo")
                ? "text-red-500"
                : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}
        <p className="mt-4 text-sm text-center text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}