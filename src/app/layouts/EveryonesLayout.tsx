import RWSDKBadge from "@/app/components/rwsdk/RWSDKBadge";
import type { LayoutProps } from "rwsdk/router";

const EveryonesLayout = ({ children }: LayoutProps) => {
  return (
    <div className="bg-bg min-h-screen min-w-screen">
      {children}
      <RWSDKBadge size="md" />
    </div>
  );
};

export { EveryonesLayout };