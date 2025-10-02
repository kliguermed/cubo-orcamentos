import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

// Registrar service worker para PWA
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('Nova versão disponível! Recarregue a página.');
  },
  onOfflineReady() {
    console.log('App pronto para funcionar offline!');
  },
});

createRoot(document.getElementById("root")!).render(<App />);
