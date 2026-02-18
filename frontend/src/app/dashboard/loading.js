export default function DashboardLoading() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center p-6 animate-fade-in">
      {/* Premium Loader */}
      <div className="loader-premium mb-6">
        <div className="loader-pulse !w-12 !h-12" />
        <div className="loader-spinner !w-10 !h-10 border-t-primary-600" />
      </div>

      <div className="text-center space-y-2">
        <div className="flex items-center gap-2 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce"></span>
        </div>
        <h3 className="text-sm font-black text-dark-900 dark:text-white uppercase tracking-widest opacity-90">
          Carregando dados
        </h3>
        <p className="text-dark-400 dark:text-dark-300 text-[10px] font-bold uppercase tracking-wider">
          Ginásio Moz • Sistema Premium
        </p>
      </div>

      {/* Shimmer Placeholder simulation (optional) */}
      <div className="mt-12 w-full max-w-lg space-y-4 opacity-20">
        <div className="h-4 bg-dark-200 dark:bg-dark-800 rounded-full w-3/4 shimmer"></div>
        <div className="h-4 bg-dark-200 dark:bg-dark-800 rounded-full w-1/2 shimmer"></div>
        <div className="h-4 bg-dark-200 dark:bg-dark-800 rounded-full w-2/3 shimmer"></div>
      </div>
    </div>
  );
}
