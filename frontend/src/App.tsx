import LandingPage from "./pages/LandingPage";
import { RegisterChatProvider } from "./context/RegisterChatContext";
import RegisterChatWidget from "./components/chat/RegisterChatWidget";

export default function App() {
  return (
    <RegisterChatProvider>
      <LandingPage />
      <RegisterChatWidget />
    </RegisterChatProvider>
  );
}
