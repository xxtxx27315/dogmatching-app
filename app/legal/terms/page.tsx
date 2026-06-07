import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="p-2 text-gray-500 active:bg-gray-100 rounded-full touch-manipulation">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">利用規約</h1>
      </div>
      <div className="prose prose-sm text-gray-600 space-y-5">
        <p className="text-xs text-gray-400">最終更新日: 2025年6月1日</p>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">1. 利用資格</h2>
          <p>本サービスはペットを愛するすべての方にご利用いただけます。利用登録時に虚偽の情報を提供することを禁止します。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">2. 禁止事項</h2>
          <p>以下の行為を禁止します：・虚偽情報の登録 ・他ユーザーへの嫌がらせ・誹謗中傷 ・動物虐待を示唆する投稿 ・著作権を侵害するコンテンツの投稿 ・営業・勧誘行為</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">3. 投稿コンテンツ</h2>
          <p>投稿した写真・動画の著作権はユーザーに帰属します。ただし当サービスはサービス提供に必要な範囲で利用できるものとします。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">4. アカウント管理</h2>
          <p>利用規約違反が確認された場合、予告なくアカウントを停止・削除する場合があります。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">5. 免責事項</h2>
          <p>当サービスはペット写真・動画の投稿・共有プラットフォームです。ユーザー間のトラブルについて、当社は責任を負いません。</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">6. 変更・終了</h2>
          <p>当社はサービス内容を予告なく変更・終了する場合があります。</p>
        </section>
      </div>
    </div>
  );
}
