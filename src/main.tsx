
  import { createRoot } from "react-dom/client";
  import { GoogleOAuthProvider } from "@react-oauth/google";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  const GOOGLE_CLIENT_ID = "868460784794-g2uqp61qrqvu9tp37moloev22t9c7lno.apps.googleusercontent.com";

  createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  );
  