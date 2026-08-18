import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: "linear-gradient(135deg, #2E1065 0%, #4C1D95 45%, #7C3AED 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "8px",
          border: "1.5px solid rgba(196, 181, 253, 0.4)",
          fontWeight: 900,
          fontFamily: "sans-serif",
          boxShadow: "0 4px 12px rgba(124, 58, 237, 0.5)",
          letterSpacing: "-0.5px",
        }}
      >
        T
      </div>
    ),
    {
      ...size,
    }
  );
}
