import React from "react";
import Link from "next/link";

interface MyPageViewProps {
  username: string;
  onLogout: () => void;
  onDeleteAccount: () => void;
  isDeletingAccount: boolean;
  deleteAccountError: string | null;
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.055)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "1.25rem",
  overflow: "hidden",
  boxShadow:
    "0 1px 0 rgba(255,255,255,0.08) inset, 0 12px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)",
};

const insetBoxStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.28)",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.04)",
  boxShadow:
    "inset -4px -4px 9px rgba(255,255,255,0.07), inset 4px 4px 11px rgba(0,0,0,0.65)",
};

const neuBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "10px",
  cursor: "pointer",
  boxShadow:
    "-4px -4px 10px rgba(255,255,255,0.08), 4px 4px 10px rgba(0,0,0,0.55)",
  transition: "box-shadow 0.15s ease",
};

function StackedCards() {
  return (
    <div style={{ position: "relative", width: "58.5%", aspectRatio: "1 / 1" }}>
      <div
        style={{
          ...insetBoxStyle,
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "94%",
          borderRadius: "13px",
          zIndex: 1,
          background: "rgba(180,180,180,0.18)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      />
      <div
        style={{
          ...insetBoxStyle,
          position: "absolute",
          left: 0,
          right: "3%",
          top: "6%",
          height: "94%",
          borderRadius: "13px",
          zIndex: 2,
          background: "rgba(90,90,90,0.35)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      />
      <div
        style={{
          ...insetBoxStyle,
          position: "absolute",
          left: 0,
          right: "6%",
          top: "12%",
          bottom: 0,
          borderRadius: "13px",
          zIndex: 3,
          background: "rgba(20,20,20,0.72)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      />
    </div>
  );
}

export function MyPageView({
  username,
  onLogout,
  onDeleteAccount,
  isDeletingAccount,
  deleteAccountError,
}: MyPageViewProps) {
  return (
    <div
      className="grid grid-cols-2 [grid-auto-rows:10px] md:[grid-auto-rows:12px] gap-[15px] md:gap-[18px] max-w-[560px] md:max-w-[860px] mx-auto w-full"
    >
      {/* ① 프로필 — col1, span 7 */}
      <div
        style={{
          ...cardStyle,
          gridColumn: "1",
          gridRow: "1 / span 7",
          padding: "1.1rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          {/* 아바타 */}
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "rgba(249,115,22,0.08)",
              border: "1px solid rgba(249,115,22,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "-3px -3px 8px rgba(249,115,22,0.15), 3px 3px 8px rgba(0,0,0,0.7), 0 0 16px rgba(249,115,22,0.1)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(251,146,60,0.85)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          {/* 3-dot 메뉴 */}
          <button
            style={{
              ...neuBtnStyle,
              padding: "5px 6px",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              alignItems: "center",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "3px",
                  height: "3px",
                  borderRadius: "50%",
                  background: "rgba(107,114,128,0.7)",
                }}
              />
            ))}
          </button>
        </div>
        <div>
          <p style={{ color: "#e5e7eb", fontWeight: 700, fontSize: "0.8rem", margin: "0 0 2px" }}>
            {username}
          </p>
          <p style={{ color: "#9ca3af", fontSize: "0.65rem", margin: 0 }}>내 계정</p>
        </div>
      </div>

      {/* ② My Closet — col1, span 11 */}
      <div
        style={{
          ...cardStyle,
          gridColumn: "1",
          gridRow: "8 / span 11",
          padding: "1.1rem",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(251,146,60,0.8)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
          </svg>
          <span style={{ color: "#e5e7eb", fontWeight: 700, fontSize: "0.78rem" }}>My Closet</span>
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px",
          }}
        >
          <StackedCards />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Link
            href="/closet"
            style={{
              color: "#9ca3af",
              fontSize: "0.62rem",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fb923c"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9ca3af"; }}
          >
            전체 보기 →
          </Link>
        </div>
      </div>

      {/* ③ 내가 즐겨 입는 사이즈 — col1, span 13 */}
      <div
        style={{
          ...cardStyle,
          gridColumn: "1",
          gridRow: "19 / span 13",
          padding: "1.1rem",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <p style={{ color: "#e5e7eb", fontWeight: 700, fontSize: "0.78rem", margin: 0 }}>
          내가 즐겨
          <br />
          입는 사이즈
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {["상의", "하의", "신발", "아우터", "악세서리"].map((label) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ color: "#9ca3af", fontSize: "0.68rem" }}>{label}</span>
              <div style={{ ...insetBoxStyle, width: "48px", height: "22px", borderRadius: "7px" }} />
            </div>
          ))}
        </div>
        <button
          style={{
            ...neuBtnStyle,
            width: "100%",
            padding: "8px 0",
            fontSize: "0.68rem",
            fontWeight: 600,
            color: "#9ca3af",
          }}
        >
          수정
        </button>
      </div>

      {/* ④ 위시리스트 — col2, span 12 */}
      <div
        style={{
          ...cardStyle,
          gridColumn: "2",
          gridRow: "1 / span 12",
          padding: "1.1rem",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="rgba(250,204,21,0.8)"
              stroke="rgba(250,204,21,0.8)"
              strokeWidth="1.5"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span style={{ color: "#e5e7eb", fontWeight: 700, fontSize: "0.875rem" }}>위시리스트</span>
          </div>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#374151"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px",
          }}
        >
          <StackedCards />
        </div>
      </div>

      {/* ⑤ 최근 본 상품 — col2, span 10 */}
      <div
        style={{
          ...cardStyle,
          gridColumn: "2",
          gridRow: "13 / span 10",
          padding: "1.1rem",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4b5563"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span style={{ color: "#e5e7eb", fontWeight: 700, fontSize: "0.78rem" }}>최근 본 상품</span>
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px",
          }}
        >
          <StackedCards />
        </div>
      </div>

      {/* ⑥ 내 명적 — col2, span 9 */}
      <div
        style={{
          ...cardStyle,
          gridColumn: "2",
          gridRow: "23 / span 9",
          padding: "1.1rem",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ color: "#e5e7eb", fontWeight: 700, fontSize: "0.78rem", margin: 0 }}>내 명적</p>
          <span style={{ color: "#9ca3af", fontSize: "0.6rem" }}>최근 이김한 옷</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flex: 1 }}>
          <div style={{ ...insetBoxStyle, flex: 1, borderRadius: "12px" }} />
          <div style={{ ...insetBoxStyle, flex: 1, borderRadius: "12px" }} />
        </div>
      </div>

      {/* ⑦ 계정 — 풀 너비, span 3 */}
      <div
        style={{
          ...cardStyle,
          gridColumn: "1 / span 2",
          gridRow: "32 / span 3",
          padding: "0 1.1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#374151"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span style={{ color: "#9ca3af", fontSize: "0.72rem", fontWeight: 600 }}>계정</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "auto" }}>
          <button
            onClick={onLogout}
            style={{
              ...neuBtnStyle,
              padding: "5px 18px",
              fontSize: "0.7rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
              color: "rgba(248,113,113,0.9)",
            }}
          >
            로그아웃
          </button>
          <button
            onClick={onDeleteAccount}
            disabled={isDeletingAccount}
            style={{
              ...neuBtnStyle,
              padding: "5px 13px",
              fontSize: "0.65rem",
              whiteSpace: "nowrap",
              color: "rgba(156,163,175,0.9)",
              cursor: isDeletingAccount ? "not-allowed" : "pointer",
            }}
          >
            {isDeletingAccount ? "삭제 중..." : "계정 삭제"}
          </button>
        </div>
        {deleteAccountError && (
          <p style={{ fontSize: "0.7rem", color: "rgba(248,113,113,0.9)", margin: 0 }}>
            {deleteAccountError}
          </p>
        )}
      </div>
    </div>
  );
}
