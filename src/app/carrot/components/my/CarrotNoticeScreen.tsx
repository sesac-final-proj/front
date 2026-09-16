"use client";

import { DreamNoticeScreen } from "./DreamNoticeScreen";

export function CarrotNoticeScreen({ onBack }: { onBack: () => void }) {
  return <DreamNoticeScreen onBack={onBack} service="carrot" serviceParamName="service_type" />;
}
