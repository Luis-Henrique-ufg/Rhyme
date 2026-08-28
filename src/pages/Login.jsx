import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Loader';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const { user, loading, loginWithGoogle, loginWithUsername } = useAuth();
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return <Loader message="Conectando aos servidores..." />;
  }

  // Redirecionamento se já estiver logado
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    let hasError = false;
    let errors = {};

    if (!formData.username.trim()) {
      errors.username = 'O nome de usuário é obrigatório.';
      hasError = true;
    }
    if (!formData.password.trim()) {
      errors.password = 'A senha é obrigatória.';
      hasError = true;
    }

    if (hasError) {
      setValidationErrors(errors);
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);
      await loginWithUsername(formData.username, formData.password);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Usuário ou senha incorretos.');
      } else {
        setError('Falha ao autenticar: ' + err.message);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Theme Toggle no topo direito */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Background Gradients & Stars */}
      <div className="stars absolute inset-0 pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-orange-900/10 [html.light_&]:bg-orange-400/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-orange-950/20 [html.light_&]:bg-amber-400/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="electric-card bg-[#0A0A0A] [html.light_&]:bg-white/95 w-full max-w-md p-8 text-center rounded-[30px] z-10 relative border border-white/5 [html.light_&]:border-slate-200 shadow-2xl [html.light_&]:shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
        <div className="flex justify-center items-center gap-3 mb-4">
          <img src="/Logo.png" alt="Rhyme Logo" className="h-16 object-contain" />
          <h1 className="text-4xl lg:text-5xl font-bricolage font-bold text-white [html.light_&]:text-slate-900 tracking-tight">Rhyme.</h1>
        </div>
        <p className="text-neutral-400 [html.light_&]:text-slate-500 mb-8 text-sm">Gestão Inteligente de Transporte</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 [html.light_&]:bg-red-50 [html.light_&]:border-red-200 [html.light_&]:text-red-700 p-3 rounded-xl mb-6 text-sm text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left mb-6">
          <div>
            <label className="block text-zinc-400 [html.light_&]:text-slate-700 text-xs font-medium uppercase tracking-wider mb-2">Nome de Usuário</label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="ex: joaozinho"
              className={`w-full bg-white/5 [html.light_&]:bg-slate-100 border ${validationErrors.username ? 'border-red-500 focus:border-red-500' : 'border-white/10 [html.light_&]:border-slate-200 focus:border-orange-500'} rounded-xl px-4 py-3 text-white [html.light_&]:text-slate-900 placeholder:text-zinc-500 [html.light_&]:placeholder:text-slate-400 focus:outline-none transition-colors`}
            />
            {validationErrors.username && <p className="text-red-500 text-xs mt-1">{validationErrors.username}</p>}
          </div>

          <div>
            <label className="block text-zinc-400 [html.light_&]:text-slate-700 text-xs font-medium uppercase tracking-wider mb-2">Senha</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full bg-white/5 [html.light_&]:bg-slate-100 border ${validationErrors.password ? 'border-red-500 focus:border-red-500' : 'border-white/10 [html.light_&]:border-slate-200 focus:border-orange-500'} rounded-xl px-4 py-3 text-white [html.light_&]:text-slate-900 placeholder:text-zinc-500 [html.light_&]:placeholder:text-slate-400 focus:outline-none transition-colors`}
            />
            {validationErrors.password && <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary mt-2 flex justify-center items-center py-3.5 text-base font-bold"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="flex flex-col gap-4">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-800 [html.light_&]:border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-zinc-600 [html.light_&]:text-slate-400 text-xs uppercase font-bold tracking-wider">ou</span>
            <div className="flex-grow border-t border-zinc-800 [html.light_&]:border-slate-200"></div>
          </div>

          <button 
            onClick={async () => {
              try {
                setError('');
                await loginWithGoogle();
              } catch (err) {
                if (err.code === 'auth/popup-closed-by-user') {
                  setError('Você fechou a janela de login do Google antes de concluir.');
                } else {
                  setError('Falha ao autenticar com Google: ' + err.message);
                }
              }
            }}
            className="w-full bg-white/5 [html.light_&]:bg-slate-100 hover:bg-white/10 [html.light_&]:hover:bg-slate-200 text-white [html.light_&]:text-slate-800 py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-3 border border-white/10 [html.light_&]:border-slate-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.8 15.71 17.58V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
              <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.58C14.73 18.24 13.48 18.64 12 18.64C9.13 18.64 6.7 16.7 5.84 14.09H2.18V16.94C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
              <path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.06H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.94L5.84 14.09Z" fill="#FBBC05"/>
              <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.02L19.36 3.86C17.46 2.09 14.97 1 12 1C7.7 1 3.99 3.47 2.18 7.06L5.84 9.91C6.7 7.3 9.13 5.38 12 5.38Z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/5 [html.light_&]:border-slate-200 text-sm">
          <p className="text-zinc-400 [html.light_&]:text-slate-600">
            Ainda não tem conta? <Link to="/cadastro" className="text-orange-500 hover:text-orange-400 font-bold ml-1 transition-colors">Crie aqui</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
