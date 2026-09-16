import { RefreshCw } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import { PULL_TO_REFRESH_THRESHOLD } from "../../hooks/usePullToRefresh";

export function PullToRefreshIndicator({
  pullOffset,
  isRefreshing,
}: {
  pullOffset: number;
  isRefreshing: boolean;
}) {
  return (
    <div
      className={styles.pullToRefreshIndicator}
      style={{ opacity: Math.min(pullOffset / PULL_TO_REFRESH_THRESHOLD, 1) }}
    >
      <RefreshCw
        size={20}
        className={isRefreshing ? styles.pullToRefreshSpinning : undefined}
        style={
          isRefreshing ? undefined : { transform: `rotate(${(pullOffset / PULL_TO_REFRESH_THRESHOLD) * 180}deg)` }
        }
      />
    </div>
  );
}
