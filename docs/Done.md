### O que foi alterado e configurado:
1. Framework e Setup: Criado o projeto Vite em React.
Dependências: Instalamos todas as bibliotecas solicitadas (react-router-dom, firebase, leaflet, tailwindcss, @tailwindcss/vite, e as dependências sugeridas como lucide-react, clsx, tailwind-merge).
Variáveis de Ambiente: O arquivo .env.example foi criado na raiz com as chaves padrão do Firebase aguardando preenchimento. 
Ver arquivo

2. Paleta de Cores & Design System: Configurado um tema Dark Mode Premium via variáveis CSS no 
index.css
, utilizando cores baseadas na escala zinc para o fundo, e indigo (primary), violet (secondary) e teal (accent vibrante) para as ações. Também foram adicionadas classes utilitárias base para Glassmorphism (.glass, .glass-card).
Estrutura de Pastas (Arquitetura): Criados os diretórios components, pages, config, hooks e routes.
Configuração Firebase: Criado o arquivo de inicialização em 
firebase.js

3. Roteamento Inicial: Configurado o react-router-dom no 
AppRoutes.jsx
 com mockups (telas temporárias) com as rotas:
/login: Tela de autenticação base (glassmorphism aplicado)
/student: Painel do Aluno
/driver: Painel do Motorista
Validação Realizada
O projeto foi perfeitamente "buildado" sem erros (npm run build).