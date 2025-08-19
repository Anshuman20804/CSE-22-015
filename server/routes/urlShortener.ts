import { RequestHandler } from "express";
import { ShortenUrlRequest, ShortenUrlResponse, StatisticsResponse, RedirectResponse, ErrorResponse, UrlRecord, ClickData, LogEntry } from "@shared/api";

// In-memory storage (in production, use a proper database)
let urlDatabase: UrlRecord[] = [];
let logs: LogEntry[] = [];

// Custom logger middleware
const log = (action: string, req: any, details?: Record<string, any>) => {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    action,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    details: details || {}
  };
  logs.push(logEntry);
  console.log(`[URL_SHORTENER] ${action}:`, logEntry);
};

// Generate random shortcode
const generateShortcode = (length: number = 6): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Validate URL format
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate shortcode format (alphanumeric only)
const isValidShortcode = (shortcode: string): boolean => {
  return /^[a-zA-Z0-9]+$/.test(shortcode);
};

// Check if shortcode already exists
const shortcodeExists = (shortcode: string): boolean => {
  return urlDatabase.some(record => record.shortcode === shortcode);
};

// Get coarse location from IP (simplified)
const getLocationFromIP = (ip: string): string => {
  // In production, use a proper IP geolocation service
  if (ip.includes('127.0.0.1') || ip.includes('localhost')) return 'Local';
  return 'Unknown Location';
};

// Shorten URL endpoint
export const shortenUrl: RequestHandler = (req, res) => {
  try {
    const { originalUrl, validityMinutes, customShortcode }: ShortenUrlRequest = req.body;

    log('URL_SHORTEN_ATTEMPT', req, { originalUrl, validityMinutes, customShortcode });

    // Validate required fields
    if (!originalUrl) {
      const error: ErrorResponse = { error: 'Original URL is required' };
      log('URL_SHORTEN_ERROR', req, { error: error.error });
      return res.status(400).json(error);
    }

    // Validate URL format
    if (!isValidUrl(originalUrl)) {
      const error: ErrorResponse = { error: 'Invalid URL format' };
      log('URL_SHORTEN_ERROR', req, { error: error.error });
      return res.status(400).json(error);
    }

    // Validate validity minutes
    if (!validityMinutes || validityMinutes <= 0 || !Number.isInteger(validityMinutes)) {
      const error: ErrorResponse = { error: 'Validity must be a positive integer' };
      log('URL_SHORTEN_ERROR', req, { error: error.error });
      return res.status(400).json(error);
    }

    // Generate or validate shortcode
    let shortcode = customShortcode;
    if (shortcode) {
      // Validate custom shortcode
      if (!isValidShortcode(shortcode)) {
        const error: ErrorResponse = { error: 'Shortcode must be alphanumeric' };
        log('URL_SHORTEN_ERROR', req, { error: error.error });
        return res.status(400).json(error);
      }
      
      // Check uniqueness
      if (shortcodeExists(shortcode)) {
        const error: ErrorResponse = { error: 'Shortcode already exists' };
        log('URL_SHORTEN_ERROR', req, { error: error.error });
        return res.status(400).json(error);
      }
    } else {
      // Generate unique shortcode
      do {
        shortcode = generateShortcode();
      } while (shortcodeExists(shortcode));
    }

    // Calculate expiry time
    const expiryTime = new Date(Date.now() + validityMinutes * 60 * 1000);
    const createdAt = new Date();

    // Create URL record
    const urlRecord: UrlRecord = {
      id: Date.now().toString(),
      originalUrl,
      shortcode,
      shortenedUrl: `${req.protocol}://${req.get('host')}/r/${shortcode}`,
      createdAt: createdAt.toISOString(),
      expiryTime: expiryTime.toISOString(),
      validityMinutes,
      totalClicks: 0,
      clicks: [],
      isExpired: false
    };

    // Store in database
    urlDatabase.push(urlRecord);

    log('URL_SHORTENED_SUCCESS', req, { 
      shortcode, 
      originalUrl, 
      expiryTime: expiryTime.toISOString() 
    });

    const response: ShortenUrlResponse = {
      shortenedUrl: urlRecord.shortenedUrl,
      shortcode: urlRecord.shortcode,
      expiryTime: urlRecord.expiryTime,
      originalUrl: urlRecord.originalUrl
    };

    res.json(response);
  } catch (error) {
    log('URL_SHORTEN_ERROR', req, { error: error.message });
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(500).json(errorResponse);
  }
};

// Redirect endpoint
export const redirectUrl: RequestHandler = (req, res) => {
  try {
    const { shortcode } = req.params;

    log('REDIRECT_ATTEMPT', req, { shortcode });

    if (!shortcode) {
      const error: ErrorResponse = { error: 'Shortcode is required' };
      log('REDIRECT_ERROR', req, { error: error.error });
      return res.status(400).json(error);
    }

    // Find URL record
    const urlRecord = urlDatabase.find(record => record.shortcode === shortcode);

    if (!urlRecord) {
      const error: ErrorResponse = { error: 'Shortened URL not found' };
      log('REDIRECT_ERROR', req, { error: error.error, shortcode });
      return res.status(404).json(error);
    }

    // Check if expired
    const now = new Date();
    const expiryTime = new Date(urlRecord.expiryTime);
    
    if (now > expiryTime) {
      urlRecord.isExpired = true;
      const error: ErrorResponse = { error: 'Shortened URL has expired' };
      log('REDIRECT_ERROR', req, { error: error.error, shortcode });
      return res.status(410).json(error);
    }

    // Record click
    const clickData: ClickData = {
      timestamp: new Date().toISOString(),
      source: req.get('Referer') || 'Direct',
      location: getLocationFromIP(req.ip || 'unknown'),
      userAgent: req.get('User-Agent') || 'unknown',
      ip: req.ip || 'unknown'
    };

    urlRecord.clicks.push(clickData);
    urlRecord.totalClicks++;

    log('REDIRECT_SUCCESS', req, { 
      shortcode, 
      originalUrl: urlRecord.originalUrl,
      totalClicks: urlRecord.totalClicks 
    });

    const response: RedirectResponse = {
      originalUrl: urlRecord.originalUrl,
      success: true
    };

    res.json(response);
  } catch (error) {
    log('REDIRECT_ERROR', req, { error: error.message });
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(500).json(errorResponse);
  }
};

// Statistics endpoint
export const getStatistics: RequestHandler = (req, res) => {
  try {
    log('STATISTICS_REQUEST', req);

    // Update expired status for all URLs
    const now = new Date();
    urlDatabase.forEach(record => {
      if (new Date(record.expiryTime) < now) {
        record.isExpired = true;
      }
    });

    const totalUrls = urlDatabase.length;
    const totalClicks = urlDatabase.reduce((sum, record) => sum + record.totalClicks, 0);
    const activeUrls = urlDatabase.filter(record => !record.isExpired).length;

    const response: StatisticsResponse = {
      urls: urlDatabase.map(record => ({ ...record })), // Create copies
      totalUrls,
      totalClicks,
      activeUrls
    };

    log('STATISTICS_SUCCESS', req, { totalUrls, totalClicks, activeUrls });

    res.json(response);
  } catch (error) {
    log('STATISTICS_ERROR', req, { error: error.message });
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(500).json(errorResponse);
  }
};

// Get logs endpoint (for debugging)
export const getLogs: RequestHandler = (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const recentLogs = logs.slice(-limit);
    
    res.json({ logs: recentLogs, total: logs.length });
  } catch (error) {
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    res.status(500).json(errorResponse);
  }
};
