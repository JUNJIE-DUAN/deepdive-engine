import Sidebar from '@/components/layout/Sidebar';
import WorkspaceLayout from '@/components/ai-office/layout/WorkspaceLayout';

/**
 * AI Office 工作区页面
 * 整合资源管理、AI交互、文档生成的统一工作区
 * 支持生成 Word、Excel、PPT 等多种格式文档
 */
export default function AIOfficePage() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="h-full flex-1 overflow-hidden">
        <WorkspaceLayout />
      </div>
    </div>
  );
}
