"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CaptureButton from "@/components/CaptureButton";

export default function CapturePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const handleCapture = async (rawText: string) => {
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/tubuyaki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      setStatus("done");
      // 自動で Today 画面へ遷移
      setTimeout(() => {
        router.push("/today");
      }, 500);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "送信に失敗しました");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
      <h1 className="text-2xl font-bold text-gray-800">つぶやき</h1>
      <p className="text-sm text-gray-400 text-center">
        思いついたことを声に出してみよう
      </p>

      {status === "idle" && <CaptureButton onComplete={handleCapture} />}

      {status === "sending" && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">変換中...</p>
        </div>
      )}

      {status === "done" && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">完了! Todayに移動中...</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-red-500">{errorMsg}</p>
          <button
            onClick={() => setStatus("idle")}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            もう一度試す
          </button>
        </div>
      )}
    </div>
  );
}
