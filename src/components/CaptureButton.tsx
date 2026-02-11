"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type CaptureState = "idle" | "listening" | "transcribing" | "converting";

interface CaptureButtonProps {
  onComplete: (rawText: string) => void;
}

export default function CaptureButton({ onComplete }: CaptureButtonProps) {
  const [state, setState] = useState<CaptureState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      (!("SpeechRecognition" in window) &&
        !("webkitSpeechRecognition" in window))
    ) {
      setSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalText = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalText);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setState("idle");
      }
    };

    recognition.onend = () => {
      // If still in listening state, recognition ended unexpectedly
      if (state === "listening" && finalText) {
        handleSubmit(finalText);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState("listening");
    setTranscript("");
    setInterimTranscript("");
  }, [state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const finalText = transcript;
    if (finalText.trim()) {
      handleSubmit(finalText);
    } else {
      setState("idle");
    }
  }, [transcript]);

  const handleSubmit = async (text: string) => {
    setState("converting");
    try {
      onComplete(text);
    } finally {
      setState("idle");
      setTranscript("");
      setInterimTranscript("");
    }
  };

  const handleToggle = () => {
    if (state === "idle") {
      startListening();
    } else if (state === "listening") {
      stopListening();
    }
  };

  if (!supported) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-gray-500 text-center">
          このブラウザは音声認識に対応していません。
          <br />
          テキスト入力をお使いください。
        </p>
        <TextInput onSubmit={(text) => handleSubmit(text)} />
      </div>
    );
  }

  const stateLabel = {
    idle: "録る",
    listening: "停止",
    transcribing: "文字起こし中...",
    converting: "変換中...",
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Big capture button */}
      <button
        onClick={handleToggle}
        disabled={state === "transcribing" || state === "converting"}
        className={`w-40 h-40 rounded-full flex items-center justify-center text-white text-xl font-bold transition-all shadow-lg ${
          state === "listening"
            ? "bg-red-500 hover:bg-red-600 animate-pulse shadow-red-200"
            : state === "idle"
              ? "bg-blue-500 hover:bg-blue-600 shadow-blue-200 active:scale-95"
              : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        {state === "listening" ? (
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </button>

      <p className="text-sm text-gray-500 font-medium">
        {stateLabel[state]}
      </p>

      {/* Live transcript display */}
      {(transcript || interimTranscript) && (
        <div className="w-full max-w-sm bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {transcript}
            <span className="text-gray-400">{interimTranscript}</span>
          </p>
        </div>
      )}

      {/* Fallback text input */}
      <div className="w-full max-w-sm">
        <details className="text-center">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            テキスト入力に切り替え
          </summary>
          <div className="mt-3">
            <TextInput onSubmit={(text) => handleSubmit(text)} />
          </div>
        </details>
      </div>
    </div>
  );
}

function TextInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="つぶやきを入力..."
        rows={3}
        className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="bg-blue-500 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        送信
      </button>
    </form>
  );
}
