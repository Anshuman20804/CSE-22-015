// Original demo response
export interface DemoResponse {
  message: string;
}

// URL Shortener API types
export interface ShortenUrlRequest {
  originalUrl: string;
  validityMinutes: number;
  customShortcode?: string;
}

export interface ShortenUrlResponse {
  shortenedUrl: string;
  shortcode: string;
  expiryTime: string;
  originalUrl: string;
}

export interface ClickData {
  timestamp: string;
  source: string;
  location: string;
  userAgent: string;
  ip: string;
}

export interface UrlRecord {
  id: string;
  originalUrl: string;
  shortcode: string;
  shortenedUrl: string;
  createdAt: string;
  expiryTime: string;
  validityMinutes: number;
  totalClicks: number;
  clicks: ClickData[];
  isExpired: boolean;
}

export interface StatisticsResponse {
  urls: UrlRecord[];
  totalUrls: number;
  totalClicks: number;
  activeUrls: number;
}

export interface RedirectResponse {
  originalUrl: string;
  success: boolean;
}

export interface ErrorResponse {
  error: string;
  code?: string;
}

export interface LogEntry {
  timestamp: string;
  action: string;
  userId?: string;
  shortcode?: string;
  originalUrl?: string;
  ip: string;
  userAgent: string;
  details?: Record<string, any>;
}
