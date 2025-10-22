import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./utils/createAdminUser"; // Load admin creation utility

createRoot(document.getElementById("root")!).render(<App />);
