
import React, { useState, useEffect } from 'react';
import { sheetService } from '../services/mockSheetService';
import { Vendor } from '../types';
import { Lock, Network, User, Loader2, Info } from 'lucide-react';

interface LoginProps {
  onLogin: (vendor: Vendor) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>(''); // This is the ID
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbStatus, setDbStatus] = useState('Checking connection...');

  useEffect(() => {
      // Initial check
      sheetService.initializeConnection().then(res => {
          setDbStatus(res.success ? 'System Online' : 'System Offline (Mode Demo)');
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const result = await sheetService.login(username, password);
        
        if (result.success && result.user) {
            onLogin(result.user);
        } else {
            setError(result.message || "Login Failed");
        }
    } catch (err) {
        setError("Network Error. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative overflow-hidden">
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 to-blue-600"></div>

        <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-brand-500/30">
                <Network size={36} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">APJATEL</h1>
            <p className="text-sm font-medium text-brand-600 mt-1">PMO Vendor Dashboard</p>
            <div className="flex items-center gap-2 mt-4 px-3 py-1 bg-slate-100 rounded-full">
                <div className={`w-2 h-2 rounded-full ${dbStatus.includes('Online') ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <span className="text-[10px] text-gray-500 font-medium">{dbStatus}</span>
            </div>
        </div>

        {/* Demo Hint */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
            <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800">
                <strong>Akses Demo / Testing:</strong><br/>
                User ID: <span className="font-mono bg-blue-100 px-1 rounded">admin</span> <br/>
                Password: <span className="font-mono bg-blue-100 px-1 rounded">admin</span>
            </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">User ID / Username</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <User size={18} className="text-gray-400" />
                    </div>
                    <input 
                        type="text" 
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50 text-sm transition-all"
                        placeholder="e.g. admin or vendor_id"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Lock size={18} className="text-gray-400" />
                    </div>
                    <input 
                        type="password" 
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50 text-sm transition-all"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg text-center font-medium animate-pulse">
                    {error}
                </div>
            )}

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-brand-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Login to Dashboard"}
            </button>
        </form>

        <div className="mt-8 text-center">
             <p className="text-xs text-gray-400">
                Belum punya akun? Hubungi <span className="text-brand-600 font-medium cursor-pointer hover:underline">Administrator</span>
             </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
