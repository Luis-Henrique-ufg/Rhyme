import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import Loader from '../components/Loader';

const FACULTIES = [
  'UFG',
  'UFG - Campus Colemar',
  'PUC',
  'IFG',
  'UNIP',
  'FASAM',
  'Estácio',
  'Unicamps',
  'Eseffego',
  'Colégio Vitória',
  'Outra'
];

const CustomSelect = ({ value, onChange, options, name, className, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || null;

  return (
    <div className="relative group text-left">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-surface-hover border ${className || 'border-zinc-700 focus:border-primary'} rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer flex items-center justify-between group-hover:border-zinc-500`}
      >
        <span className={!selectedOption && placeholder ? 'text-zinc-500' : 'text-zinc-100 truncate'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={`absolute right-3 text-zinc-400 group-hover:text-zinc-200 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <ul className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-hidden">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  onChange({ target: { name, value: opt.value } });
                  setIsOpen(false);
                }}
                className={`px-4 py-3 cursor-pointer transition-colors text-sm ${value === opt.value ? 'bg-primary/20 text-primary font-bold border-l-2 border-primary pl-3' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white border-l-2 border-transparent'}`}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default function Register() {
  const { user, loading, registerWithUsername } = useAuth();
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(!!user);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: user?.displayName || '',
    role: 'student',
    faculty: FACULTIES[0],
    customFaculty: '',
    route: 'Professor Jamil'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    async function checkProfile() {
      if (!user) {
        setCheckingProfile(false);
        return;
      }
      try {
        const docRef = doc(db, 'students', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.role === 'driver') {
            navigate('/motorista/dashboard', { replace: true });
          } else {
            navigate('/aluno/mapa', { replace: true });
          }
        } else {
          setCheckingProfile(false);
        }
      } catch (err) {
        console.error("Erro ao verificar perfil", err);
        setCheckingProfile(false);
      }
    }
    checkProfile();
  }, [user, navigate]);

  if (loading || checkingProfile) {
    return <Loader message="Carregando..." />;
  }


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    
    let hasError = false;
    let errors = {};

    if (!user) {
      if (!formData.username.trim() || formData.username.length < 3) {
        errors.username = 'Nome de usuário deve ter pelo menos 3 caracteres.';
        hasError = true;
      }
      if (!formData.password || formData.password.length < 6) {
        errors.password = 'A senha deve ter no mínimo 6 caracteres.';
        hasError = true;
      }
    }

    if (!formData.name.trim()) {
      errors.name = 'O nome é obrigatório.';
      hasError = true;
    }

    if (formData.role === 'student' && !formData.faculty) {
      errors.faculty = 'Selecione uma faculdade.';
      hasError = true;
    }

    if (formData.role === 'student' && formData.faculty === 'Outra' && !formData.customFaculty.trim()) {
      errors.customFaculty = 'Digite o nome da sua faculdade.';
      hasError = true;
    }

    if (hasError) {
      setValidationErrors(errors);
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      let currentUserUid = user?.uid;
      
      if (!user) {
        await registerWithUsername(formData.username, formData.password);
        // O onAuthStateChanged vai atualizar o contexto, mas precisamos do auth agora.
        const { auth } = await import('../config/firebase');
        currentUserUid = auth.currentUser.uid;
      }
      
      // Salva os dados na coleção 'students'
      await setDoc(doc(db, 'students', currentUserUid), {
        uid: currentUserUid,
        name: formData.name,
        role: formData.role,
        faculty: formData.role === 'student' ? (formData.faculty === 'Outra' ? formData.customFaculty.trim() : formData.faculty) : null,
        route: formData.route,
        photoURL: user?.photoURL || null,
        notificationsEnabled: true
      });

      // Após o cadastro, redireciona
      if (formData.role === 'driver') {
        navigate('/motorista/dashboard', { replace: true });
      } else {
        navigate('/aluno/mapa', { replace: true });
      }

    } catch (err) {
      console.error('Erro ao salvar cadastro:', err);
      setError('Erro do Firebase: ' + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Gradients & Stars */}
      <div className="stars absolute inset-0 pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-orange-900/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-orange-950/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="electric-card bg-[#0A0A0A] w-full max-w-md p-8 text-left rounded-[30px] z-10 relative">
        <div className="flex justify-center items-center gap-3 mb-6">
          <img src="/Logo.png" alt="Rhyme Logo" className="h-10 object-contain" />
          <h1 className="text-3xl font-bricolage font-bold text-white tracking-tight">Rhyme.</h1>
        </div>
        <h2 className="text-2xl font-bricolage font-light tracking-tight text-white mb-2 text-center">Complete seu Cadastro</h2>
        <p className="text-zinc-400 mb-6 text-center text-sm">Precisamos de mais algumas informações.</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!user && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Nome de Usuário <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="ex: joaozinho"
                  className={`w-full bg-surface-hover border ${validationErrors.username ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:border-primary focus:ring-primary'} rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 transition-colors`}
                  required
                />
                {validationErrors.username && <p className="text-red-500 text-xs mt-1">{validationErrors.username}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Senha <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full bg-surface-hover border ${validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:border-primary focus:ring-primary'} rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 transition-colors`}
                  required
                />
                {validationErrors.password && <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Nome Completo <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Digite seu nome"
              className={`w-full bg-surface-hover border ${validationErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:border-primary focus:ring-primary'} rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 transition-colors`}
              required
            />
            {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Você é?</label>
            <CustomSelect
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={[
                { value: 'student', label: 'Aluno' },
                { value: 'driver', label: 'Motorista' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Rota <span className="text-red-500">*</span></label>
            <CustomSelect
              name="route"
              value={formData.route}
              onChange={handleChange}
              options={[
                { value: 'Professor Jamil', label: 'Professor Jamil' },
                { value: 'Cromínia', label: 'Cromínia' }
              ]}
            />
          </div>

          {formData.role === 'student' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Faculdade <span className="text-red-500">*</span></label>
              <CustomSelect
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                className={validationErrors.faculty ? 'border-red-500 focus:ring-red-500' : ''}
                placeholder="Selecione sua faculdade"
                options={FACULTIES.map(fac => ({ value: fac, label: fac }))}
              />
              {validationErrors.faculty && <p className="text-red-500 text-xs mt-1">{validationErrors.faculty}</p>}
              
              {formData.faculty === 'Outra' && (
                <div className="mt-3 animate-[fadeIn_0.3s_ease-out]">
                  <input
                    type="text"
                    name="customFaculty"
                    value={formData.customFaculty}
                    onChange={handleChange}
                    placeholder="Digite o nome da instituição"
                    className={`w-full bg-surface-hover border ${validationErrors.customFaculty ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:border-primary focus:ring-primary'} rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-1 transition-colors`}
                  />
                  {validationErrors.customFaculty && <p className="text-red-500 text-xs mt-1">{validationErrors.customFaculty}</p>}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Finalizar Cadastro'}
            </button>

            <button
              type="button"
              onClick={async () => {
                const { getAuth, signOut } = await import('firebase/auth');
                await signOut(getAuth());
                navigate('/login');
              }}
              disabled={isSubmitting}
              className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-full transition-colors font-medium border border-white/10 text-center"
            >
              Sair / Alterar Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
