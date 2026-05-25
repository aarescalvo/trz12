import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-amber-500 mb-4">404</div>
        <h1 className="text-2xl font-semibold text-stone-800 mb-2">
          Página no encontrada
        </h1>
        <p className="text-stone-600 mb-6">
          La página que busca no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
