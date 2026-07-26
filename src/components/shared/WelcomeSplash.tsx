import { useState, useEffect, type ReactNode } from 'react';

export default function WelcomeSplash({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (!show) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">DP</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">DealerPulse</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">Toyota dealership performance dashboard</p>
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
