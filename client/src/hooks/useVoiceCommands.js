import { useState, useRef, useCallback } from "react";

/**
 * useVoiceCommands
 * Wraps the browser's Web Speech API (SpeechRecognition).
 * Returns { transcript, listening, startListening, stopListening, error }
 *
 * Settings:
 *  - lang: "en-IN"  (Indian English for better accent recognition)
 *  - continuous: false (single utterance per activation)
 *  - interimResults: false (only final results emitted)
 */
export default function useVoiceCommands({ onResult } = {}) {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const getSpeechRecognition = () => {
    return (
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      null
    );
  };

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }

    // Clean up any previous instance
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError(null);
      setTranscript("");
    };

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const text = result[0].transcript.trim();
        setTranscript(text);
        if (onResult) onResult(text);
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone.");
      } else {
        setError(`Speech error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  }, []);

  return { transcript, listening, startListening, stopListening, error };
}
