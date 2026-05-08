"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Seccion = {
  seccion: string;
  contenido: {
    titulo?: string;
    texto?: string;
    items?: string[];
  };
};

export default function HomePage() {
  const [secciones, setSecciones] = useState<Seccion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("contenido_web")
      .select("*")
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          setSecciones(data as Seccion[]);
        }
      })
      .catch((err) => {
        setError(err.message || "Error desconocido");
      });
  }, []);

  // Mientras no hay datos ni error, cargando
  if (!secciones && !error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  const inicio = secciones?.find((s) => s.seccion === "inicio")?.contenido;
  const servicios = secciones?.find((s) => s.seccion === "servicios")?.contenido;
  const faq = secciones?.find((s) => s.seccion === "faq")?.contenido;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Encabezado */}
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <span className="text-xl font-bold text-blue-700">🐾 Clínica Vet</span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Registrarse
          </Link>
        </div>
      </header>

      {/* Sección Inicio */}
      <section className="bg-blue-600 text-white py-20 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">
          {inicio?.titulo || "Bienvenidos a nuestra Clínica Veterinaria"}
        </h1>
        <p className="text-lg max-w-2xl mx-auto">
          {inicio?.texto || "Cuidamos de tu mascota con amor y profesionalidad."}
        </p>
      </section>

      {/* Sección Servicios */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          {servicios?.titulo || "Nuestros Servicios"}
        </h2>
        <p className="text-center text-gray-600 mb-8">
          {servicios?.texto || "Ofrecemos atención integral para tu mascota."}
        </p>
        {servicios?.items && servicios.items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.items.map((item, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
              >
                <p className="font-semibold text-lg">{item}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sección FAQ */}
      <section className="bg-white py-16 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          {faq?.titulo || "Preguntas Frecuentes"}
        </h2>
        <p className="text-center text-gray-600 mb-8">
          {faq?.texto || "Respuestas a las dudas más comunes."}
        </p>
        {faq?.items && faq.items.length > 0 && (
          <div className="space-y-4">
            {faq.items.map((item, i) => (
              <details
                key={i}
                className="bg-gray-50 p-4 rounded-lg border"
              >
                <summary className="font-medium cursor-pointer">
                  {item}
                </summary>
                <p className="mt-2 text-gray-600">
                  Información detallada sobre esta pregunta.
                </p>
              </details>
            ))}
          </div>
        )}
      </section>

      {/* Pie de página */}
      <footer className="bg-gray-800 text-white text-center py-6 text-sm">
        &copy; {new Date().getFullYear()} Clínica Veterinaria. Todos los derechos reservados.
      </footer>
    </div>
  );
}