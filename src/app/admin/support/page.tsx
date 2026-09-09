import { AdminPageHeader } from "@/components/admin/AdminUI";
import SupportSection from "@/components/admin/sections/SupportSection";

export default function SupportPage() {
  return <><AdminPageHeader title="고객 문의" description="사용자가 고객센터에 남긴 문의를 확인하고 답변하세요." /><SupportSection /></>;
}
