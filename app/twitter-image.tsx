import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "radial-gradient(1200px 700px at 20% 10%, #1f2a4a 0%, #0b1224 45%, #050810 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)",
              color: "#0b1224",
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            🎧
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: -1,
              background: "linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)",
              color: "transparent",
              backgroundClip: "text",
            }}
          >
            KJBeats
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: -0.7 }}>
            Share Music. Build Playlists. Connect with Friends.
          </div>
          <div style={{ fontSize: 30, color: "#c4b5fd" }}>kjbeats.vercel.app</div>
        </div>
      </div>
    ),
    size
  );
}
