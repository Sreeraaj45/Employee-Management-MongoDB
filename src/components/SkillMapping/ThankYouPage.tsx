import { CheckCircle, Home } from 'lucide-react';
import logo from '../../assets/logo.png';

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          <div className="flex justify-center mb-6">
            <img
              src={logo}
              alt="Logo"
              className="w-20 h-20 md:w-24 md:h-24 rounded-full shadow-lg border-2 border-emerald-400"
            />
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-100 rounded-full p-4">
              <CheckCircle className="w-16 h-16 text-emerald-600" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Thank You!
          </h1>
          
          <p className="text-lg text-slate-600 mb-8">
            Your skill mapping has been successfully submitted. We appreciate you taking the time to share your expertise with us.
          </p>

          <div className="bg-sky-50 rounded-xl p-6 mb-8">
            <p className="text-slate-700">
              Your responses will help us better understand our team's capabilities and plan future projects more effectively.
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-sky-400 to-indigo-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Home className="w-5 h-5" />
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}
