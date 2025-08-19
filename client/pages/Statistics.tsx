import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Clock, Copy, ExternalLink, MousePointer, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClickData {
  timestamp: string;
  source: string;
  location: string;
}

interface UrlStats {
  id: string;
  originalUrl: string;
  shortenedUrl: string;
  shortcode: string;
  createdAt: string;
  expiryTime: string;
  totalClicks: number;
  clicks: ClickData[];
  isExpired: boolean;
}

export default function Statistics() {
  const [urlStats, setUrlStats] = useState<UrlStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/statistics');
      const data = await response.json();
      setUrlStats(data.urls || []);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast({
        title: "Error",
        description: "Failed to load statistics.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTotalClicks = () => {
    return urlStats.reduce((total, url) => total + url.totalClicks, 0);
  };

  const getActiveUrls = () => {
    return urlStats.filter(url => !url.isExpired).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                URL Statistics
              </h1>
            </div>
            <p className="text-lg text-gray-600">
              Track the performance of your shortened URLs
            </p>
          </div>
          <Button asChild>
            <a href="/">← Back to Shortener</a>
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total URLs</p>
                  <p className="text-2xl font-bold">{urlStats.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active URLs</p>
                  <p className="text-2xl font-bold">{getActiveUrls()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <MousePointer className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold">{getTotalClicks()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* URLs Table */}
        {urlStats.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No URLs Created Yet</h3>
              <p className="text-gray-600 mb-4">Start shortening URLs to see statistics here.</p>
              <Button asChild>
                <a href="/">Create Your First URL</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Shortened URLs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Original URL</TableHead>
                      <TableHead>Shortened URL</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {urlStats.map((url) => (
                      <TableRow key={url.id}>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={url.originalUrl}>
                            {url.originalUrl}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {url.shortenedUrl}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(url.shortenedUrl)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(url.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(url.expiryTime)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={url.isExpired ? "destructive" : "default"}>
                            {url.isExpired ? "Expired" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{url.totalClicks}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(url.originalUrl, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Click Details */}
        {urlStats.some(url => url.clicks.length > 0) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Click Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {urlStats
                  .filter(url => url.clicks.length > 0)
                  .map(url => (
                    <div key={url.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {url.shortcode}
                        </code>
                        <Badge variant="outline">{url.clicks.length} clicks</Badge>
                      </div>
                      <div className="space-y-2">
                        {url.clicks.slice(0, 5).map((click, index) => (
                          <div key={index} className="flex items-center justify-between text-sm text-gray-600">
                            <span>{formatDate(click.timestamp)}</span>
                            <span>{click.source}</span>
                            <span>{click.location}</span>
                          </div>
                        ))}
                        {url.clicks.length > 5 && (
                          <p className="text-sm text-gray-500">
                            +{url.clicks.length - 5} more clicks...
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
