import { useState, useEffect, useRef, useCallback } from "react";

// Unified speech recognition hook for Capacitor (iOS/Android) and the web.
//
// Returns:
//   isListening         - true while a recording is active
//   transcript          - the finalized text so far
//   partialTranscript   - in-progress text being recognized
//   start()             - begin recording (requests permission if needed)
//   stop()              - stop recording, finalize transcript
//   reset()             - clear transcript and partial text
//   supported           - true if the platform supports speech recognition
//   error               - last error message, if any
//   permissionDenied    - true if the user has denied mic/speech permission
//
// Implementation notes:
// - On Capacitor (iOS/Android), uses @capacitor-community/speech-recognition
//   which wraps SFSpeechRecognizer (iOS) and SpeechRecognizer (Android).
// - On the web, uses the browser's SpeechRecognition API (webkit-prefixed
//   on Safari).
// - Both paths emit partial results so the user sees live transcription.

const isNative = () => typeof window !== "undefined" && !!window.Capacitor?.isNativePlatform?.();

const getWebSpeechCtor = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export default function useSpeechRecognition({ language = "en-US" } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [error, setError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [supported, setSupported] = useState(false);

  const webRecogRef = useRef(null);
  const stopAttemptRef = useRef(false);

  // Detect support on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isNative()) {
        try {
          const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
          const r = await SpeechRecognition.available();
          if (!cancelled) setSupported(!!r.available);
        } catch {
          if (!cancelled) setSupported(false);
        }
      } else {
        const Ctor = getWebSpeechCtor();
        if (!cancelled) setSupported(!!Ctor);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setPartialTranscript("");
    setError("");
  }, []);

  // ── Native (Capacitor) path ────────────────────────────────────────────────
  const startNative = useCallback(async () => {
    const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
    // Check or request permission
    const perm = await SpeechRecognition.checkPermissions().catch(() => ({ speechRecognition: "denied" }));
    if (perm.speechRecognition !== "granted") {
      const req = await SpeechRecognition.requestPermissions().catch(() => ({ speechRecognition: "denied" }));
      if (req.speechRecognition !== "granted") {
        setPermissionDenied(true);
        setError("Microphone permission is required to record your voice.");
        return false;
      }
    }
    setPermissionDenied(false);

    // Attach listeners
    SpeechRecognition.removeAllListeners();
    SpeechRecognition.addListener("partialResults", (data) => {
      const matches = data?.matches || [];
      if (matches.length > 0) setPartialTranscript(matches[0]);
    });
    SpeechRecognition.addListener("listeningState", (data) => {
      if (data?.status === "stopped") {
        setIsListening(false);
        // Promote any final partial into the transcript
        setTranscript((prev) => {
          const next = (prev ? prev + " " : "") + (partialTranscript || "").trim();
          return next.trim();
        });
        setPartialTranscript("");
      }
    });

    await SpeechRecognition.start({
      language,
      maxResults: 1,
      prompt: "",
      partialResults: true,
      popup: false,
    });
    setIsListening(true);
    return true;
  }, [language, partialTranscript]);

  const stopNative = useCallback(async () => {
    const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
    try {
      await SpeechRecognition.stop();
    } catch {
      // ignore: stop on a non-running session throws
    }
    // Finalize transcript
    setTranscript((prev) => {
      const next = (prev ? prev + " " : "") + (partialTranscript || "").trim();
      return next.trim();
    });
    setPartialTranscript("");
    setIsListening(false);
    SpeechRecognition.removeAllListeners().catch(() => {});
  }, [partialTranscript]);

  // ── Web path ───────────────────────────────────────────────────────────────
  const startWeb = useCallback(() => {
    const Ctor = getWebSpeechCtor();
    if (!Ctor) {
      setError("Speech recognition is not supported in this browser.");
      return false;
    }
    const r = new Ctor();
    r.lang = language;
    r.continuous = true;
    r.interimResults = true;

    r.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      if (finalText) {
        setTranscript((prev) => {
          const joined = (prev ? prev + " " : "") + finalText.trim();
          return joined.trim();
        });
      }
      setPartialTranscript(interimText);
    };

    r.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setPermissionDenied(true);
        setError("Microphone permission is required to record your voice.");
      } else if (event.error === "no-speech") {
        // not a real error, ignore
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    r.onend = () => {
      setIsListening(false);
      setPartialTranscript("");
    };

    webRecogRef.current = r;
    stopAttemptRef.current = false;
    try {
      r.start();
      setIsListening(true);
      return true;
    } catch (err) {
      setError(err?.message || "Could not start recording.");
      return false;
    }
  }, [language]);

  const stopWeb = useCallback(() => {
    if (!webRecogRef.current || stopAttemptRef.current) return;
    stopAttemptRef.current = true;
    try {
      webRecogRef.current.stop();
    } catch {
      // ignore
    }
  }, []);

  // ── Unified API ────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setError("");
    if (isNative()) {
      try {
        return await startNative();
      } catch (err) {
        setError(err?.message || "Could not start recording.");
        return false;
      }
    }
    return startWeb();
  }, [startNative, startWeb]);

  const stop = useCallback(async () => {
    if (isNative()) return stopNative();
    return stopWeb();
  }, [stopNative, stopWeb]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) stop();
      if (isNative()) {
        import("@capacitor-community/speech-recognition")
          .then(({ SpeechRecognition }) => SpeechRecognition.removeAllListeners())
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isListening,
    transcript,
    partialTranscript,
    start,
    stop,
    reset,
    supported,
    error,
    permissionDenied,
  };
}
