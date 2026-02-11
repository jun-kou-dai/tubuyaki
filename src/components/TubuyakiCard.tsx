"use client";

import { useState } from "react";
import { TubuyakiRecord, INTENT_COLORS, IntentTag } from "@/types/tubuyaki";

interface TubuyakiCardProps {
  record: TubuyakiRecord;
  onFeedback?: (id: string, feedback: string, detail?: string) => void;
  onReprocess?: (id: string, rawText: string) => void;
  onDelete?: (id: string) => void;
}

export default function TubuyakiCard({ record, onFeedback, onReprocess, onDelete }: TubuyakiCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [showIdeas, setShowIdeas] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [showFeedbackDetail, setShowFeedbackDetail] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(record.rawText);

  const summaryLines = record.summary3lines?.split("\n").filter(Boolean) || [];

  const handleFeedback = (type: string) => {
    if (type === "thumbs_down") {
      setShowFeedbackDetail(true);
    } else {
      onFeedback?.(record.id, type);
    }
  };

  const handleFeedbackDetail = (detail: string) => {
    onFeedback?.(record.id, "thumbs_down", detail);
    setShowFeedbackDetail(false);
  };

  if (record.status === "processing") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        <div className="flex items-center mt-4">
          <p className="text-sm text-gray-400">AI変換中...</p>
          <button
            onClick={async () => {
              if (!onDelete) return;
              if (!window.confirm("処理中ですが、このつぶやきを削除しますか？")) return;
              setDeleting(true);
              try {
                await onDelete(record.id);
              } finally {
                setDeleting(false);
              }
            }}
            disabled={deleting || !onDelete}
            className="ml-auto text-gray-300 hover:text-red-400 transition-colors disabled:opacity-30"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (record.status === "pending" || record.status === "error") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
            {record.status === "pending" ? "未処理" : "エラー"}
          </span>
          <time className="text-xs text-gray-400">
            {new Date(record.createdAt).toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
          <button
            onClick={async () => {
              if (!onDelete) return;
              if (!window.confirm("このつぶやきを削除しますか？")) return;
              setDeleting(true);
              try {
                await onDelete(record.id);
              } finally {
                setDeleting(false);
              }
            }}
            disabled={deleting || !onDelete}
            className="ml-auto text-gray-300 hover:text-red-400 transition-colors disabled:opacity-30"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600 text-sm whitespace-pre-wrap">{record.rawText}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header: Intent tags + time */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {record.intent.map((tag) => (
          <span
            key={tag}
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              INTENT_COLORS[tag as IntentTag] || "bg-gray-100 text-gray-700"
            }`}
          >
            {tag}
          </span>
        ))}
        <time className="text-xs text-gray-400 ml-auto">
          {new Date(record.createdAt).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>

      {/* 3行要約 */}
      {summaryLines.length > 0 && (
        <div className="mb-4">
          {summaryLines.map((line, i) => (
            <p key={i} className="text-sm text-gray-700 leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      )}

      {/* 次の一手（強調表示） */}
      {record.nextAction && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-xs text-blue-500 font-medium mb-1">次の一手</p>
          <p className="text-sm text-blue-800 font-medium">{record.nextAction}</p>
        </div>
      )}

      {/* アイデア（折りたたみ） */}
      {record.ideas.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowIdeas(!showIdeas)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showIdeas ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            アイデア ({record.ideas.length})
          </button>
          {showIdeas && (
            <div className="mt-2 space-y-2 pl-5">
              {record.ideas.map((idea, i) => (
                <div key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-gray-400 shrink-0">{i + 1}.</span>
                  <span>{idea}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 生テキスト（編集・再変換可能） */}
      <div className="mb-4">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showRaw ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          生テキスト
        </button>
        {showRaw && (
          <div className="mt-2 pl-5">
            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (editText.trim() && onReprocess) {
                        onReprocess(record.id, editText.trim());
                        setEditing(false);
                        setShowRaw(false);
                      }
                    }}
                    disabled={!editText.trim()}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                  >
                    再変換
                  </button>
                  <button
                    onClick={() => {
                      setEditText(record.rawText);
                      setEditing(false);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    やめる
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed flex-1">
                  {record.rawText}
                </p>
                <button
                  onClick={() => {
                    setEditText(record.rawText);
                    setEditing(true);
                  }}
                  className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 shrink-0 transition-colors"
                >
                  修正
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* フィードバック */}
      <div className="flex items-center gap-3 border-t border-gray-50 pt-3">
        {!showFeedbackDetail ? (
          <>
            <button
              onClick={() => handleFeedback("thumbs_up")}
              className={`text-lg transition-transform hover:scale-110 ${
                record.feedback === "thumbs_up" ? "opacity-100" : "opacity-40 hover:opacity-70"
              }`}
              title="Good"
            >
              👍
            </button>
            <button
              onClick={() => handleFeedback("thumbs_down")}
              className={`text-lg transition-transform hover:scale-110 ${
                record.feedback === "thumbs_down" ? "opacity-100" : "opacity-40 hover:opacity-70"
              }`}
              title="Bad"
            >
              👎
            </button>
            {record.confidence !== null && record.confidence < 0.5 && (
              <span className="text-xs text-orange-500">
                自信度低 ({Math.round(record.confidence * 100)}%)
              </span>
            )}
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">ズレ方:</span>
            {["intent", "summary", "suggestion", "idea"].map((detail) => (
              <button
                key={detail}
                onClick={() => handleFeedbackDetail(detail)}
                className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                {detail === "intent"
                  ? "意図"
                  : detail === "summary"
                    ? "要約"
                    : detail === "suggestion"
                      ? "提案"
                      : "アイデア"}
              </button>
            ))}
            <button
              onClick={() => setShowFeedbackDetail(false)}
              className="text-xs text-gray-400 ml-1"
            >
              取消
            </button>
          </div>
        )}
        <button
          onClick={async () => {
            if (!onDelete) return;
            if (!window.confirm("このつぶやきを削除しますか？")) return;
            setDeleting(true);
            try {
              await onDelete(record.id);
            } finally {
              setDeleting(false);
            }
          }}
          disabled={deleting || !onDelete}
          className="ml-auto text-gray-300 hover:text-red-400 transition-colors disabled:opacity-30"
          title="削除"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
