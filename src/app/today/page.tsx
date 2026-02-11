"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import TubuyakiCard from "@/components/TubuyakiCard";
import { TubuyakiRecord } from "@/types/tubuyaki";

export default function TodayPage() {
  const router = useRouter();
  const [records, setRecords] = useState<TubuyakiRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchToday = useCallback(async () => {
    try {
      const res = await fetch("/api/tubuyaki");
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error("Failed to fetch today's records:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

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

      setRecords((prev) =>
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

  if (loading) {
    return (
      <div className="pt-8">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Today</h1>
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
      </div>
    );
  }

  return (
    <div className="pt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Today</h1>
        <span className="text-sm text-gray-400">
          {new Date().toLocaleDateString("ja-JP", {
            month: "long",
            day: "numeric",
            weekday: "short",
          })}
        </span>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-gray-400 text-sm">まだつぶやきがありません</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-500 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            つぶやく
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <TubuyakiCard
              key={record.id}
              record={record}
              onFeedback={handleFeedback}
            />
          ))}
        </div>
      )}
    </div>
  );
}
