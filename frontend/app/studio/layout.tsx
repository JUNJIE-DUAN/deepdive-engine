/**
 * AI Studio Layout
 * 独立的全屏布局，不使用全局 Sidebar
 * AI Studio 页面自身包含完整的导航结构
 */
export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
