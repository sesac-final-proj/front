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
  tradePlaceLat?: number;
  tradePlaceLng?: number;
  sellerNickname?: string;
  sellerMannerTemp?: number;
  isMine?: boolean;
  thumbnailUrl?: string;
}

export interface TradeProductPage {
  items: TradeProduct[];
  total: number;
}

export type TradeSort = "latest" | "price_asc" | "price_desc";

export interface TradeProductQuery {
  category?: string;
  tradeStatus?: TradeProduct["tradeStatus"];
  tradeType?: TradeProduct["tradeType"];
  priceMin?: number;
  priceMax?: number;
  sort?: TradeSort;
  excludeSold?: boolean;
  q?: string;
  regionId?: number;
  page?: number;
  size?: number;
}
