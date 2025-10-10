export type Item = {
  name: string;
  exterior: string;
  icon: string;
  qty?: number;
  priceMedian?: number;
  priceMin?: number;
  lastSale?: number;
  delta1h?: number;
  delta24h?: number;
  delta30d?: number;
  float?: number | null;
  paintSeed?: number | null;
  stattrak?: boolean;
  souvenir?: boolean;
};
