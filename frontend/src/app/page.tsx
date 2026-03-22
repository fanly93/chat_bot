"use client";

import { useEffect, useState } from "react";

interface HealthStatus {
  status: string;
  database: boolean;
  redis: boolean;
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">ChatBot 健康检查</h1>

        {loading && (
          <p className="text-center text-gray-500">检查中...</p>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <p className="font-medium">连接失败</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {health && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <span className="font-medium">整体状态</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  health.status === "ok"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {health.status === "ok" ? "正常" : "部分异常"}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <span className="font-medium">PostgreSQL</span>
              <span
                className={`w-3 h-3 rounded-full ${
                  health.database ? "bg-green-500" : "bg-red-500"
                }`}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <span className="font-medium">Redis</span>
              <span
                className={`w-3 h-3 rounded-full ${
                  health.redis ? "bg-green-500" : "bg-red-500"
                }`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
