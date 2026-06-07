"use client";

import { useEffect, useState } from "react";
import { requestNotificationPermission } from "@/lib/hooks/useNotification";

export default function NotificationPermission() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  async function handleAllow() {
    await requestNotificationPermission();
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in slide-in-from-top-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🐾</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">通知を許可しますか？</p>
          <p className="text-xs text-gray-500 mt-0.5">
            新しいいいねやコメントをすぐにお知らせします
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setShow(false)}
          className="flex-1 py-2 text-sm text-gray-500 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
        >
          後で
        </button>
        <button
          onClick={handleAllow}
          className="flex-1 py-2 text-sm font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition"
        >
          許可する
        </button>
      </div>
    </div>
  );
}
