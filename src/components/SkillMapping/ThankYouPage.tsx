import { Sparkles, CheckCircle } from "lucide-react";
import logo from '../../assets/logo.png';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 py-8 relative overflow-hidden">

      {/* Soft Background Blobs */}
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-pink-200 opacity-30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-200 opacity-30 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="max-w-3xl mx-auto px-10 relative z-10 text-center">

        {/* Header */}
        <header className="bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 rounded-xl shadow-xl p-10 text-white mb-8 flex flex-col items-center">
          <img
            src={logo}
            alt="Logo"
            className="w-24 h-24 rounded-full shadow-lg border-2 border-white/60 hover:scale-110 transition-transform duration-300 mb-4"
          />

          <h1 className="text-4xl font-extrabold flex items-center gap-3">
            <Sparkles className="w-8 h-8 animate-spin-slow" />
            Thank You!
            <Sparkles className="w-8 h-8 animate-spin-slow" />
          </h1>

          <p className="text-white/80 mt-2 font-medium text-lg">
            Your response has been recorded successfully.
          </p>
        </header>

        {/* Main Card */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-7 border border-slate-100 flex flex-col items-center">

          <CheckCircle className="w-20 h-20 text-emerald-500 mb-4" />

          <h2 className="text-3xl font-bold text-slate-800 mb-3">
            Submission Completed
          </h2>
          {/* DigiVidya Button */}
          <a
            href="https://www.digividya.ielektron.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="
              relative 
              inline-block 
              px-6 py-3 mt-3 
              font-semibold 
              rounded-xl 
              border-2 
              text-slate-700
              transition-all 
              duration-300 
              hover:scale-[1.03]
              hover:shadow-lg
              backdrop-blur-xl
            "
            style={{
              borderImage: "linear-gradient(to right, #38bdf8, #6366f1, #d946ef) 1"
            }}
          >
            {/* Gradient Glow */}
            <span className="absolute inset-0 rounded-xl opacity-30 blur-xl bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 -z-10"></span>

            Sharpen Skills on DigiVidya
          </a>
        </div>
      </div>

      {/* Spin Animation */}
      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        .animate-spin-slow { animation: spin 8s linear infinite; }
      `}</style>

    </div>
  );
}
