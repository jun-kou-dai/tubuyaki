"use client";

import { useState, useCallback } from "react";
import TubuyakiCard from "@/components/TubuyakiCard";
import { TubuyakiRecord, INTENT_TAGS, INTENT_COLORS, IntentTag } from "@/types/tubuyaki";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [results, setResults] = useState<TubuyakiRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedIntent) params.set("intent", selectedIntent);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    try {
      const res = await fetch(`/api/tubuyaki/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedIntent, dateFrom, dateTo]);

  const handleFeedback = async (
    id: string,
    feedback: string,
    detail?: string
  ) => {
    try {
      await fetch(`/api/tubuyaki/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback,
          ...(detail && { feedbackDetail: detail }),
        }),
      });

      setResults((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, feedback, feedbackDetail: detail || null }
            : r
        )
      );
    } catch (err) {
      console.error("Failed to update feedback:", err);
    }
  };

  return (
    <div className="pt-8">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Search</h1>

      {/* 検索フォーム */}
      <div className="space-y-4 mb-6">
        {/* テキスト検索 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="キーワードで検索..."
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-500 text-white rounded-xl px-4 py-3 text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
          >
            {loading ? "..." : "検索"}
          </button>
        </div>

        {/* 意図タグフィルタ */}
        <div className="flex flex-wrap gap-2">
          {INTENT_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() =>
                setSelectedIntent(selectedIntent === tag ? null : tag)
              }
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                selectedIntent === tag
                  ? `${INTENT_COLORS[tag as IntentTag]} ring-2 ring-offset-1 ring-current`
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* 期間フィルタ */}
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <span className="text-gray-400 text-sm">~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      {/* 結果 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      ) : searched ? (
        results.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">
            該当するつぶやきが見つかりません
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              {results.length}件のつぶやき
            </p>
            {results.map((record) => (
              <TubuyakiCard
                key={record.id}
                record={record}
                onFeedback={handleFeedback}
              />
            ))}
          </div>
        )
      ) : (
        <p className="text-center text-gray-400 text-sm py-12">
          キーワードやタグで検索してみましょう
        </p>
      )}
    </div>
  );
}
