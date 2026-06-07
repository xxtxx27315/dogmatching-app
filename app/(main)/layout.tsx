import MainNav from "@/components/MainNav";

// 認証チェックはmiddlewareで実施するためここではしない
// layoutをsyncにすることでcookies()呼び出しが消え、ナビ時の再レンダリングがなくなる
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainNav>{children}</MainNav>;
}
