export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black p-4">
      {/* Branding Spinner */}
      <div className="loader-premium mb-8">
        <div className="loader-pulse" />
        <div className="loader-spinner !w-20 !h-20" />
        <div className="absolute h-10 w-10 flex items-center justify-center">
           <img 
            src="/logo.png" 
            alt="Gym" 
            className="w-10 h-10 object-contain brightness-0 dark:brightness-100 dark:invert" 
          />
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="text-center">
        <h2 className="text-xl font-black text-dark-900 dark:text-white uppercase tracking-widest animate-pulse">
          Prepando o Seu Espaço
        </h2>
        <p className="text-dark-400 dark:text-dark-300 text-xs font-bold mt-2 uppercase tracking-wide opacity-80">
          Crosstraining Gym Moz
        </p>
      </div>
    </div>
  );
}
