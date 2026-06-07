import DogLogo from "@/components/DogLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "linear-gradient(135deg, #f5ede4 0%, #ede0d0 50%, #f5f0e8 100%)" }}
    >
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-3"
            style={{ boxShadow: "0 8px 32px rgba(74,55,40,0.15)" }}
          >
            <DogLogo size={72} />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logo-main.png"
            alt="ドッグLIFE"
            style={{ height: 44, width: "auto", objectFit: "contain" }}
          />
          <p className="text-xs mt-1" style={{ color: "#a89080" }}>愛犬の友達を作ろう</p>
        </div>
        {/* カード */}
        <div
          className="bg-white rounded-3xl p-7"
          style={{ boxShadow: "0 8px 40px rgba(74,55,40,0.12)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
