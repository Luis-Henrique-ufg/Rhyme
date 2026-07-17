import { createContext, useState, useContext } from 'react';

const AlertContext = createContext();

export function useCustomAlert() {
  return useContext(AlertContext);
}

export function AlertProvider({ children }) {
  const [alertData, setAlertData] = useState(null);

  const showAlert = (message) => {
    setAlertData({ message });
  };

  const closeAlert = () => {
    setAlertData(null);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alertData && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden transform transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full pointer-events-none"></div>
            <div className="flex flex-col items-center text-center z-10 relative">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Atenção</h3>
              <p className="text-zinc-400 text-sm mb-6 whitespace-pre-line">{alertData.message}</p>
              <button 
                onClick={closeAlert}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 px-6 rounded-xl transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}
