"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const [contenido, setContenido] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("contenido_web")
      .select("*")
      .then(({ data }) => {
        if (data) {
          const obj: any = {};
          data.forEach((item: any) => {
            obj[item.seccion] = item.contenido;
          });
          setContenido(obj);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-pulse text-gray-500">Cargando...</div>
      </div>
    );
  }

  const inicio = contenido.inicio || {};
  const servicios = contenido.servicios || {};
  const faq = contenido.faq || {};

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      {/* Banner principal con imagen de fondo opaca */}
      <section
        className="relative h-screen flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `url('/banner.jpg')`, // Cambia por tu imagen
        }}
      >
        {/* Overlay con gradiente para mejor legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-2xl tracking-tight">
            {inicio.titulo || "ANIMALIA"}
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed">
            {inicio.texto || "Centro Veterinario Universitario de Cienfuegos. Cuidamos a tu mascota con ciencia y dedicación."}
          </p>

          {/* Botones modernos y grandes */}
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-10 py-5 rounded-full shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-105"
            >
              <span>🔐</span> Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 text-white font-bold text-lg px-10 py-5 rounded-full shadow-2xl hover:shadow-white/10 transition-all duration-300 transform hover:scale-105"
            >
              <span>✨</span> Registrarse
            </Link>
          </div>
        </div>
      </section>

      {/* Sección Servicios */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-orange-600">
          {servicios.titulo || "Nuestros Servicios"}
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto text-lg">
          {servicios.texto || "Ofrecemos atención integral para tu mascota."}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(servicios.items || ["Consultas generales", "Vacunación", "Cirugía", "Hospitalización", "Peluquería canina", "Análisis clínicos"]).map(
            (item: string, i: number) => (
              <div
                key={i}
                className="bg-gray-50 dark:bg-gray-900 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-800 group hover:-translate-y-2"
              >
                <div className="text-5xl mb-6">🐾</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{item}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Atención especializada con los mejores profesionales.
                </p>
              </div>
            )
          )}
        </div>
      </section>

      {/* Sección FAQ */}
      <section className="bg-gray-100 dark:bg-gray-900 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-orange-600">
            {faq.titulo || "Preguntas Frecuentes"}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto text-lg">
            {faq.texto || "Respuestas a las dudas más comunes."}
          </p>
          <div className="space-y-6">
            {(faq.items || ["¿Cuáles son los horarios?", "¿Aceptan emergencias?", "¿Cómo agendar una cita?"]).map(
              (item: string, i: number) => (
                <details
                  key={i}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 group"
                >
                  <summary className="font-semibold cursor-pointer text-lg flex items-center justify-between">
                    {item}
                    <span className="text-orange-500 group-open:rotate-90 transition-transform duration-200">▶</span>
                  </summary>
                  <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                    Información detallada sobre esta pregunta.
                  </p>
                </details>
              )
            )}
          </div>
        </div>
      </section>

      {/* Pie de página */}
      <footer className="bg-gray-900 text-white py-12 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-3xl font-bold text-orange-500 mb-4">🐾 ANIMALIA</p>
          <p className="text-gray-400 text-sm">
            Centro Veterinario Universitario de Cienfuegos
          </p>
          <p className="text-gray-500 text-xs mt-2">
            &copy; {new Date().getFullYear()} Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}