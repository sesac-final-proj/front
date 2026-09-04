export interface TradeProduct {
  id: number;
  title: string;
  neighborhoodName: string;
  createdAt: string; // ISO datetime
  price: number | null;
  tradeStatus: "SALE" | "RESERVED" | "SOLD";
  tradeType: "SALE" | "FREE";
  chatCount: number;
  favoriteCount: number;
  viewCount: number;
  interestCount: number;
  category: string;
  searchKeyword?: string;
  description?: string;
  tradePlace?: string;
  sellerNickname?: string;
  sellerMannerTemp?: number;
  isMine?: boolean;
  thumbnailUrl?: string;
}

export interface TradeProductPage {
  items: TradeProduct[];
  total: number;
}

export interface TradeProductQuery {
  category?: string;
  tradeStatus?: TradeProduct["tradeStatus"];
  q?: string;
  regionId?: number;
  page?: number;
  size?: number;
}
