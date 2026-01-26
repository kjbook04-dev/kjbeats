"use client";
import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-900 text-pink-200 flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-300 to-pink-500 text-transparent bg-clip-text mb-4">
              Something went wrong
            </h1>
            <p className="mb-2">An unexpected error occurred. Details:</p>
            <pre className="bg-gray-950 text-pink-300 p-3 rounded overflow-auto text-sm mb-4">
              {error?.message || "Unknown error"}
              {error?.digest ? `\nDigest: ${error.digest}` : ""}
            </pre>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-full bg-pink-500 text-gray-900 font-semibold hover:bg-pink-600"
                onClick={() => reset()}
              >
                Try again
              </button>
              <button
                className="px-4 py-2 rounded-full border border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-gray-900"
                onClick={() => window.location.reload()}
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
