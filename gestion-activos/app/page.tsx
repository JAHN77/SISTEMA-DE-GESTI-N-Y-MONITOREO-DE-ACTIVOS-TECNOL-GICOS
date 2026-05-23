import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sistema de Gestión de Activos',
  description: 'Plataforma de gestión y monitoreo de activos tecnológicos. Redirige automáticamente al dashboard.',
};

export default function Home() {
  redirect('/dashboard');
  return null;
}
