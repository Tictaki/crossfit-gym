import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 to-dark-800">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-2xl text-dark-300 mb-8">Página não encontrada</p>
        <p className="text-dark-400 mb-8 max-w-md mx-auto">
          Desculpe, a página que procura não existe ou foi movida.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-200"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
