import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import VideosPage from "./pages/VideosPage";
import WatchPage from "./pages/WatchPage";
import CoachPage from "./pages/CoachPage";
import { RegisterChatProvider } from "./context/RegisterChatContext";
import RegisterChatWidget from "./components/chat/RegisterChatWidget";

// BASE_URL is "/" on a custom domain, or "/repo-name/" on a github.io project page
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <RegisterChatProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/watch/:id" element={<WatchPage />} />
          <Route path="/coach" element={<CoachPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <RegisterChatWidget />
      </RegisterChatProvider>
    </BrowserRouter>
  );
}
