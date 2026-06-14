import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ExternalBlob, createActor } from "./backend";
import { loadConfig } from "./config";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const queryClient = new QueryClient();

(async () => {
  try {
    const canisterId = await loadConfig();
    if (canisterId) {
      const noopUpload = async (_file: ExternalBlob): Promise<Uint8Array> =>
        new Uint8Array();
      const noopDownload = async (_file: Uint8Array): Promise<ExternalBlob> =>
        ExternalBlob.fromBytes(new Uint8Array());
      (window as any).backend = createActor(
        canisterId,
        noopUpload,
        noopDownload,
      );
    } else {
      console.warn(
        "[main.tsx] No backend canister ID resolved — window.backend will not be available.",
      );
    }
  } catch (err) {
    console.warn("[main.tsx] Failed to initialize window.backend:", err);
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
      <InternetIdentityProvider>
        <App />
      </InternetIdentityProvider>
    </QueryClientProvider>,
  );
})();
