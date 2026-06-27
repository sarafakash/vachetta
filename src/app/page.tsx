"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Header } from "@/components/Header";
import { WalletCard } from "@/components/WalletCard";
import { TokenExplorer } from "@/components/TokenExplorer";
import { ActivityFeed } from "@/components/ActivityFeed";
import { NetWorthCard } from "@/components/NetWorthCard";
import { TrendingList } from "@/components/TrendingList";

export default function Home() {
  const { authenticated, ready, login } = usePrivy();

  return (
    <div className="relative min-h-screen bg-[#040406] overflow-x-hidden selection:bg-purple-500/30 selection:text-white antialiased font-sans">
      
      {/* 1. HIGH-FIDELITY CANVAS: BACKGROUND ENVIRONMENT */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-purple-600/30 via-fuchsia-500/10 to-cyan-500/20 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-purple-500/15 rounded-full blur-[70px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />

        <div 
          className="absolute inset-x-0 top-0 h-[600px] opacity-[0.06]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(circle 380px at 50% 220px, black 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle 380px at 50% 220px, black 30%, transparent 100%)'
          }} 
        />

        {!authenticated && (
          <div className="absolute inset-x-0 top-0 h-[500px] max-w-5xl mx-auto z-10">
            <div className="absolute bottom-[35%] left-[8%] w-2.5 h-2.5 rounded-sm bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.8)] animate-floatUp" style={{ animationDelay: '0s', animationDuration: '9s' }} />
            <div className="absolute bottom-[55%] right-[10%] w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-floatUp" style={{ animationDelay: '2s', animationDuration: '11s' }} />
            <div className="absolute bottom-[25%] left-[48%] w-2.5 h-2.5 rotate-45 bg-[#34d399] shadow-[0_0_14px_rgba(52,211,153,0.9)] animate-floatUp" style={{ animationDelay: '4s', animationDuration: '8s' }} />
            <div className="absolute bottom-[45%] left-[22%] w-2 h-2 rounded-sm bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.7)] animate-floatUp" style={{ animationDelay: '1s', animationDuration: '13s' }} />
          </div>
        )}
      </div>

      <div className="sticky top-0 z-50 w-full bg-[#040406]/40 backdrop-blur-md border-b border-white/[0.04]">
        <Header />
      </div>

      <div className="relative z-20">
        <main className="mx-auto max-w-7xl px-6 py-8">
          {!ready ? null : !authenticated ? (
            <section className="pt-12 pb-6 text-center relative">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0e0e12]/80 border border-white/[0.08] text-[10px] font-bold tracking-[0.2em] uppercase text-[#34d399] mb-6 backdrop-blur-md shadow-2xl">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                </span>
                Solana continuous index
              </div>

              <h1 className="text-4xl font-extrabold tracking-[-0.03em] text-white sm:text-5xl max-w-3xl mx-auto leading-[1.08] lg:text-6xl">
                Trade trending{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#b072ff] via-[#f472b6] to-[#4ae2ff] drop-shadow-[0_4px_30px_rgba(168,85,247,0.25)]">
                  Solana tokens.
                </span>
              </h1>
              
              <p className="mx-auto mt-4 max-w-lg text-[#898994] font-medium text-[14px] sm:text-base leading-relaxed">
                Generate your secure wallet now in few simple clicks.
                <br className="hidden sm:inline" /> Fund it, and launch into automated executions.
              </p>
              
              <div className="mt-8 inline-block relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 rounded-full blur opacity-50 group-hover:opacity-80 transition duration-500 group-hover:duration-200 animate-pulse" />
                <button
                  onClick={login}
                  className="relative h-11 px-9 rounded-full bg-[#0E0E12] text-[13px] font-bold text-white border border-white/[0.12] hover:border-white/30 active:scale-[0.97] transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1) select-none"
                >
                  <span className="tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-[#d2d2d7] flex items-center gap-1.5">
                    Get started
                    <svg className="w-3.5 h-3.5 mt-0.5 transform transition-transform duration-200 group-hover:translate-x-0.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </div>
              
              <div className="mt-16 text-left animate-slideUp">
                <TokenExplorer />
              </div>
            </section>
          ) : (
            <div className="space-y-8 pt-12 animate-fadeIn">
              <div className="flex flex-col lg:flex-row gap-8 w-full mt-4">
                
                <aside className="w-full lg:w-[352px] shrink-0 space-y-6">
                  <WalletCard />
                  <NetWorthCard />
                </aside>

                <section className="flex-1 min-w-0 w-full space-y-3">
                  {/* <h2 className="text-[20px] font-bold  tracking-widest text-[#86868b] mb-2">
                    Top tokens trending worldwide
                  </h2> */}
                  <TrendingList />
                </section>
              </div>

              <section className="pt-6 border-t border-white/[0.05]">
                <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#86868b]">
                  Activity
                </h2>
                <ActivityFeed />
              </section>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }

        @keyframes floatUp {
          0% { transform: translateY(140px) scale(0.4) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(-200px) scale(1.1) rotate(270deg); opacity: 0; }
        }
        .animate-floatUp { animation: floatUp linear infinite; }
      `}</style>
    </div>
  );
}