
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";

const TURNSTILE_SITE_KEY = "0x4AAAAAAB_6pVCpxLaZjAKj";
const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";
const FALLBACK_TIMEOUT_MS = 10000;

export interface CloudflareTurnstileRef {
  reset: () => void;
}

interface CloudflareTurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Turnstile")));
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => {
      scriptLoadPromise = null;
      reject(new Error("Failed to load Turnstile script"));
    });
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export const CloudflareTurnstile = forwardRef<CloudflareTurnstileRef, CloudflareTurnstileProps>(
  ({ onVerify, onError, onExpire }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const scriptLoadedRef = useRef(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);

    // Store callbacks in refs to avoid re-rendering the widget when parent re-renders
    const onVerifyRef = useRef(onVerify);
    const onErrorRef = useRef(onError);
    const onExpireRef = useRef(onExpire);

    useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);
    useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

    const renderWidget = useCallback(() => {
      if (!containerRef.current || !window.turnstile) return;

      // Clean up existing widget
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore removal errors
        }
        widgetIdRef.current = null;
      }

      // Clear the container
      containerRef.current.innerHTML = "";

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        language: "pl",
        callback: (token: string) => {
          console.log("✅ Turnstile verification passed");
          onVerifyRef.current(token);
        },
        "error-callback": () => {
          console.warn("⚠️ Turnstile error");
          onErrorRef.current?.();
        },
        "expired-callback": () => {
          console.warn("⚠️ Turnstile token expired");
          onExpireRef.current?.();
        },
        theme: "dark",
      });
    }, []); // No callback deps needed — refs are used inside

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch (e) {
            // If reset fails, re-render the widget
            renderWidget();
          }
        }
      },
    }));

    useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;

      loadTurnstileScript()
        .then(() => {
          scriptLoadedRef.current = true;
          setScriptLoaded(true);
          clearTimeout(timeoutId);
        })
        .catch((err) => {
          console.error("❌ Failed to load Turnstile:", err);
          clearTimeout(timeoutId);
          setLoadError(true);
          // Graceful fallback: allow form submission after timeout
          onVerifyRef.current("TURNSTILE_LOAD_FAILED");
        });

      // Fallback timeout: if Turnstile doesn't load in time, allow submission
      timeoutId = setTimeout(() => {
        if (!scriptLoadedRef.current) {
          console.warn("⚠️ Turnstile load timeout, allowing fallback");
          setLoadError(true);
          onVerifyRef.current("TURNSTILE_TIMEOUT");
        }
      }, FALLBACK_TIMEOUT_MS);

      return () => {
        clearTimeout(timeoutId);
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (e) {
            // Ignore
          }
        }
      };
    }, []);

    useEffect(() => {
      if (scriptLoaded && !loadError) {
        renderWidget();
      }
    }, [scriptLoaded, loadError, renderWidget]);

    if (loadError) {
      return null; // Widget failed to load, fallback token already sent
    }

    return (
      <div className="flex justify-center my-3">
        <div ref={containerRef} />
      </div>
    );
  }
);

CloudflareTurnstile.displayName = "CloudflareTurnstile";
