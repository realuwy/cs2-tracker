// src/types/steam.ts
export type SteamAsset = {
  appid: number;
  contextid: string;
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
};

export type SteamDescription = {
  appid: number;
  classid: string;
  instanceid: string;
  market_hash_name?: string;
  market_name?: string;
  name?: string;
  icon_url?: string;
  descriptions?: Array<{ type: string; value: string; name?: string; color?: string }>;
  tags?: Array<{
    category: string;
    internal_name: string;
    localized_category_name: string;
    localized_tag_name: string;
    color?: string;
  }>;
};

export type SteamAssetProperty = {
  appid: number;
  contextid: string;
  assetid: string;
  asset_properties: Array<
    | { propertyid: 2; float_value: string; name: "Wear Rating" }
    | { propertyid: 1; int_value: string; name: "Pattern Template" }
    | { propertyid: number; [k: string]: any }
  >;
};

export type SteamInventoryResponse = {
  assets?: SteamAsset[];
  descriptions?: SteamDescription[];
  asset_properties?: SteamAssetProperty[];
  more_items?: number;
  last_assetid?: string;
  total_inventory_count?: number;
  success: number;
  rwgrsn?: number;
};

export type ParsedInventory = { items: any[] };
