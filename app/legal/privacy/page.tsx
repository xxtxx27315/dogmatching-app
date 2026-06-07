import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="p-2 text-gray-500 active:bg-gray-100 rounded-full touch-manipulation">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">プライバシーポリシー</h1>
      </div>
      <div className="prose prose-sm text-gray-600 space-y-5">
        <p className="text-xs text-gray-400">最終更新日: 2025年6月1日</p>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">1. 収集する情報</h2>
          <p>当サービスは以下の情報を収集します：メールアドレス・ニックネーム・プロフィール写真・ペットの名前・ペットの種類・自己紹介・投稿した写真・動画・コメント内容</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">2. 利用目的</h2>
          <p>収集した情報は、サービスの提供・改善、投稿・フォロー機能の提供、不正利用の防止のために利用します。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">3. 第三者提供</h2>
          <p>法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供しません。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">4. データの保管</h2>
          <p>データはSupabase（米国）のサーバーに保管されます。適切なセキュリティ対策を講じています。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">5. お問い合わせ</h2>
          <p>プライバシーに関するお問い合わせは、アプリ内のお問い合わせ機能よりご連絡ください。</p>
        </section>
      </div>
    </div>
  );
}
