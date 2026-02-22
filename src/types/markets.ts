import { NewsHeadline } from "./news";

export interface Market {
  id: string;
  question: string;
  slug: string;
  volume: number;
  tokens: {
    outcome: string;
    price: number;
  }[];
  endDate: string;
  news?: NewsHeadline[];
}

// Internal interface for the raw API response
export interface RawMarket {
  id: string;
  question: string; // or title
  slug: string;
  active: boolean;
  closed: boolean;
  outcomePrices: string | string[];
  outcomes: string | string[];
  volume: string;
  endDate: string;
}