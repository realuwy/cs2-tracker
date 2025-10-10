import { Item } from "./types";

export async function fetchMarketItems(): Promise<Item[]> {
  // Mock list for demo table
  return [
    { name: "AK-47 | Redline (Field-Tested)", exterior: "FT", icon: "https://community.cloudflare.steamstatic.com/economy/image/IzFakeDemoHash/64fx64f", qty: 1, priceMedian: 21.5, priceMin: 20.9, lastSale: 21.1, delta1h: 0.4, delta24h: 2.1, delta30d: 5.9 },
    { name: "AWP | Asiimov (Field-Tested)", exterior: "FT", icon: "https://community.cloudflare.steamstatic.com/economy/image/IzFakeDemoHash/64fx64f", qty: 1, priceMedian: 140.0, priceMin: 135.5, lastSale: 138.0, delta1h: -0.2, delta24h: 1.0, delta30d: 3.3 },
    { name: "Desert Eagle | Mecha Industries (Minimal Wear)", exterior: "MW", icon: "https://community.cloudflare.steamstatic.com/economy/image/IzFakeDemoHash/64fx64f", qty: 2, priceMedian: 12.2, priceMin: 11.9, lastSale: 12.0, delta1h: 0.1, delta24h: 0.8, delta30d: 2.2 }
  ];
}
