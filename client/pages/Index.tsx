import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Link, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UrlEntry {
  id: string;
  originalUrl: string;
  validityMinutes: number;
  customShortcode: string;
  shortenedUrl?: string;
  expiryTime?: Date;
  isProcessing?: boolean;
  error?: string;
}

export default function Index() {
  const [urlEntries, setUrlEntries] = useState<UrlEntry[]>([
    { id: '1', originalUrl: '', validityMinutes: 30, customShortcode: '' }
  ]);
  const { toast } = useToast();

  const addUrlEntry = () => {
    if (urlEntries.length < 5) {
      setUrlEntries([...urlEntries, {
        id: Date.now().toString(),
        originalUrl: '',
        validityMinutes: 30,
        customShortcode: ''
      }]);
    }
  };

  const removeUrlEntry = (id: string) => {
    setUrlEntries(urlEntries.filter(entry => entry.id !== id));
  };

  const updateUrlEntry = (id: string, field: keyof UrlEntry, value: any) => {
    setUrlEntries(urlEntries.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateShortcode = (shortcode: string): boolean => {
    return /^[a-zA-Z0-9]*$/.test(shortcode);
  };

  const shortenUrl = async (entry: UrlEntry) => {
    // Client-side validation
    if (!validateUrl(entry.originalUrl)) {
      updateUrlEntry(entry.id, 'error', 'Invalid URL format');
      return;
    }

    if (entry.customShortcode && !validateShortcode(entry.customShortcode)) {
      updateUrlEntry(entry.id, 'error', 'Shortcode must be alphanumeric');
      return;
    }

    if (entry.validityMinutes <= 0 || !Number.isInteger(entry.validityMinutes)) {
      updateUrlEntry(entry.id, 'error', 'Validity must be a positive integer');
      return;
    }

    updateUrlEntry(entry.id, 'isProcessing', true);
    updateUrlEntry(entry.id, 'error', undefined);

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: entry.originalUrl,
          validityMinutes: entry.validityMinutes,
          customShortcode: entry.customShortcode || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        updateUrlEntry(entry.id, 'shortenedUrl', data.shortenedUrl);
        updateUrlEntry(entry.id, 'expiryTime', new Date(data.expiryTime));
        toast({
          title: "URL Shortened Successfully!",
          description: "Your shortened URL is ready to use.",
        });
      } else {
        updateUrlEntry(entry.id, 'error', data.error || 'Failed to shorten URL');
      }
    } catch (error) {
      updateUrlEntry(entry.id, 'error', 'Network error occurred');
    } finally {
      updateUrlEntry(entry.id, 'isProcessing', false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              URL Shortener
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your long URLs into short, manageable links. Create up to 5 links at once with custom expiration times.
          </p>
        </div>

        {/* URL Entries */}
        <div className="max-w-4xl mx-auto space-y-6">
          {urlEntries.map((entry, index) => (
            <Card key={entry.id} className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    URL Entry
                  </span>
                  {urlEntries.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUrlEntry(entry.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor={`url-${entry.id}`}>Original URL *</Label>
                    <Input
                      id={`url-${entry.id}`}
                      placeholder="https://example.com/very-long-url"
                      value={entry.originalUrl}
                      onChange={(e) => updateUrlEntry(entry.id, 'originalUrl', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`validity-${entry.id}`}>Validity (minutes)</Label>
                    <Input
                      id={`validity-${entry.id}`}
                      type="number"
                      min="1"
                      value={entry.validityMinutes}
                      onChange={(e) => updateUrlEntry(entry.id, 'validityMinutes', parseInt(e.target.value) || 30)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`shortcode-${entry.id}`}>Custom Shortcode (optional)</Label>
                  <Input
                    id={`shortcode-${entry.id}`}
                    placeholder="my-custom-code"
                    value={entry.customShortcode}
                    onChange={(e) => updateUrlEntry(entry.id, 'customShortcode', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty for auto-generation. Only alphanumeric characters allowed.
                  </p>
                </div>

                {entry.error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{entry.error}</span>
                  </div>
                )}

                {entry.shortenedUrl && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">URL Shortened Successfully!</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded border flex-1 text-sm">
                          {entry.shortenedUrl}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(entry.shortenedUrl!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      {entry.expiryTime && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Expires: {entry.expiryTime.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => shortenUrl(entry)}
                  disabled={entry.isProcessing || !entry.originalUrl}
                  className="w-full"
                >
                  {entry.isProcessing ? 'Shortening...' : 'Shorten URL'}
                </Button>
              </CardContent>
            </Card>
          ))}

          {urlEntries.length < 5 && (
            <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
              <CardContent className="py-8">
                <Button
                  variant="ghost"
                  onClick={addUrlEntry}
                  className="w-full text-blue-600 hover:text-blue-700"
                >
                  + Add Another URL ({urlEntries.length}/5)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Statistics Link */}
        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <a href="/statistics">View URL Statistics</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
