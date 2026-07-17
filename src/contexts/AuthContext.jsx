import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signOut, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Diagnóstico do Estado: inscrever o listener e garantir a função de limpeza
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Preservando a modularidade e evitando expor a instância completa do Firebase User
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAnonymous = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Erro na autenticação anônima:', error);
      // Garantindo que a interface se recupere caso haja erro
      setLoading(false);
      throw error;
    }
  };

  const loginWithUsername = async (username, password) => {
    try {
      setLoading(true);
      const fakeEmail = `${username.toLowerCase().trim().replace(/\s+/g, '_')}@unitrack.app`;
      await signInWithEmailAndPassword(auth, fakeEmail, password);
    } catch (error) {
      console.error('Erro no login com username:', error);
      setLoading(false);
      throw error;
    }
  };

  const registerWithUsername = async (username, password) => {
    try {
      setLoading(true);
      const fakeEmail = `${username.toLowerCase().trim().replace(/\s+/g, '_')}@unitrack.app`;
      await createUserWithEmailAndPassword(auth, fakeEmail, password);
    } catch (error) {
      console.error('Erro no registro com username:', error);
      setLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Erro na autenticação com Google:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // O onAuthStateChanged tratará a mudança de estado para null
    } catch (error) {
      console.error('Erro ao deslogar:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    loginAnonymous,
    loginWithGoogle,
    loginWithUsername,
    registerWithUsername,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
