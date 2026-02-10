import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Code, Lock, ChevronDown, ChevronRight, Copy, Check, Smartphone, Server, Key, Film, CreditCard, MessageSquare, FileText, Layers, Play, Video, List, Wallet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDisplayApiUrl } from '@/api/client';

interface EndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth?: boolean;
  requestBody?: object;
  responseExample?: object;
  queryParams?: { name: string; type: string; description: string; required?: boolean }[];
  pathParams?: { name: string; type: string; description: string }[];
  notes?: string;
}

const MethodBadge = ({ method }: { method: string }) => {
  const colors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-500 border-green-500/30',
    POST: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    PUT: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    DELETE: 'bg-red-500/20 text-red-500 border-red-500/30',
  };
  return (
    <Badge variant="outline" className={`${colors[method]} font-mono text-xs px-2`}>
      {method}
    </Badge>
  );
};

const CodeBlock = ({ code, language = 'json' }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-secondary/50 border border-border rounded-lg p-4 overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        onClick={handleCopy}
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
};

const EndpointCard = ({ endpoint, baseUrl }: { endpoint: EndpointProps; baseUrl?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = baseUrl
    ? (baseUrl.replace(/\/api\/?$/, '') || (typeof window !== 'undefined' ? window.location.origin : '')) + endpoint.path
    : endpoint.path;

  const handleCopyEndpoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-mono flex-1 truncate">{endpoint.path}</code>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopyEndpoint}
            title="Copy endpoint URL"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
          {endpoint.auth && <Badge variant="outline" className="text-xs">Auth Required</Badge>}
        </div>
      </button>
      
      {isOpen && (
        <div className="border-t border-border p-4 space-y-4 bg-secondary/10">
          <p className="text-muted-foreground">{endpoint.description}</p>
          
          {endpoint.notes && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
              <strong>Note:</strong> {endpoint.notes}
            </div>
          )}
          
          {endpoint.pathParams && endpoint.pathParams.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">Path Parameters</h4>
              <div className="space-y-1">
                {endpoint.pathParams.map((param) => (
                  <div key={param.name} className="flex gap-2 text-sm flex-wrap">
                    <code className="text-primary">{param.name}</code>
                    <span className="text-muted-foreground">({param.type})</span>
                    <span className="text-muted-foreground">- {param.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">Query Parameters</h4>
              <div className="space-y-1">
                {endpoint.queryParams.map((param) => (
                  <div key={param.name} className="flex gap-2 text-sm flex-wrap">
                    <code className="text-primary">{param.name}</code>
                    <span className="text-muted-foreground">({param.type})</span>
                    {param.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                    <span className="text-muted-foreground">- {param.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {endpoint.requestBody && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">Request Body</h4>
              <CodeBlock code={JSON.stringify(endpoint.requestBody, null, 2)} />
            </div>
          )}
          
          {endpoint.responseExample && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">Response Example</h4>
              <CodeBlock code={JSON.stringify(endpoint.responseExample, null, 2)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const APIDocs = () => {
  const { isAdmin } = useAuthContext();
  const navigate = useNavigate();
  
  // Dynamic API URL based on current domain
  const apiBaseUrl = useMemo(() => getDisplayApiUrl(), []);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  // ============= USER API ENDPOINTS - MATCHING WEB FEATURES 1:1 =============

  // Authentication Endpoints
  const authEndpoints: EndpointProps[] = [
    {
      method: 'POST',
      path: '/api/auth/register',
      description: 'Register a new user account. Returns JWT token for immediate authentication.',
      requestBody: {
        email: 'user@example.com',
        password: 'securePassword123',
        displayName: 'John Doe'
      },
      responseExample: {
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid-string',
          email: 'user@example.com',
          displayName: 'John Doe',
          avatarUrl: null,
          subscriptionPlan: 'free',
          subscriptionExpiresAt: null,
          roles: ['user'],
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      },
      notes: 'Password must be 6-128 characters. Email must be unique.'
    },
    {
      method: 'POST',
      path: '/api/auth/login',
      description: 'Login with email and password. Returns JWT token and user profile.',
      requestBody: {
        email: 'user@example.com',
        password: 'securePassword123'
      },
      responseExample: {
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid-string',
          email: 'user@example.com',
          displayName: 'John Doe',
          avatarUrl: null,
          subscriptionPlan: 'premium',
          subscriptionExpiresAt: '2024-12-31T23:59:59.000Z',
          roles: ['user'],
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      }
    },
    {
      method: 'POST',
      path: '/api/auth/logout',
      description: 'Logout current user and invalidate session.',
      auth: true,
      responseExample: {
        success: true,
        message: 'Logged out successfully'
      }
    },
    {
      method: 'GET',
      path: '/api/auth/me',
      description: 'Get current authenticated user profile. Use this to check if user is logged in.',
      auth: true,
      responseExample: {
        id: 'uuid-string',
        email: 'user@example.com',
        displayName: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        subscriptionPlan: 'premium',
        subscriptionExpiresAt: '2024-12-31T23:59:59.000Z',
        roles: ['user'],
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      notes: 'Returns 401 if not authenticated. subscriptionPlan can be: free, with-ads, or premium.'
    },
    {
      method: 'PUT',
      path: '/api/auth/profile',
      description: 'Update current user profile (display name and avatar).',
      auth: true,
      requestBody: {
        displayName: 'John Updated',
        avatarUrl: 'https://example.com/new-avatar.jpg'
      },
      responseExample: {
        success: true,
        message: 'Profile updated successfully'
      },
      notes: 'Both fields are optional. Only provided fields will be updated.'
    }
  ];

  // Titles/Content Endpoints
  const titlesEndpoints: EndpointProps[] = [
    {
      method: 'GET',
      path: '/api/titles',
      description: 'Get all titles (movies and series). Includes seasons and episodes for series.',
      queryParams: [
        { name: 'type', type: 'string', description: 'Filter by "movie" or "series"' },
        { name: 'search', type: 'string', description: 'Search by title name' }
      ],
      responseExample: [
        {
          id: 'uuid-string',
          type: 'movie',
          name: 'Space Documentary',
          synopsis: 'An amazing journey through space...',
          year: 2024,
          language: 'English',
          maturity: 'PG-13',
          premium: false,
          posterUrl: 'https://example.com/poster.jpg',
          backdropUrl: 'https://example.com/backdrop.jpg',
          trailerUrl: 'https://example.com/trailer.mp4',
          videoUrl: '/api/videos/movie-file.mp4',
          duration: 120,
          rating: 4.5,
          genres: ['Documentary', 'Science'],
          cast: ['Neil deGrasse Tyson'],
          audioTracks: [
            { id: 0, lang: 'en', name: 'English' },
            { id: 1, lang: 'hi', name: 'Hindi' }
          ],
          trending: true,
          newRelease: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          seasons: []
        },
        {
          id: 'uuid-string-2',
          type: 'series',
          name: 'Science Explained',
          synopsis: 'Educational science series...',
          year: 2024,
          language: 'English',
          maturity: 'PG',
          premium: true,
          posterUrl: 'https://example.com/poster2.jpg',
          backdropUrl: 'https://example.com/backdrop2.jpg',
          trailerUrl: null,
          videoUrl: null,
          duration: null,
          rating: 4.8,
          genres: ['Education', 'Science'],
          cast: ['Host Name'],
          audioTracks: [],
          trending: false,
          newRelease: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          seasons: [
            {
              id: 'season-uuid',
              seasonNumber: 1,
              name: 'Season 1',
              episodes: [
                {
                  id: 'episode-uuid',
                  episodeNumber: 1,
                  name: 'Introduction',
                  synopsis: 'Episode description...',
                  duration: 45,
                  thumbnailUrl: 'https://example.com/ep-thumb.jpg',
                  videoUrl: '/api/videos/episode-file.mp4',
                  audioTracks: [
                    { id: 0, lang: 'en', name: 'English' }
                  ]
                }
              ]
            }
          ]
        }
      ],
      notes: 'premium=true means content requires with-ads or premium subscription. Free users can only access premium=false content.'
    },
    {
      method: 'GET',
      path: '/api/titles/:id',
      description: 'Get a specific title by ID with full details including seasons and episodes.',
      pathParams: [
        { name: 'id', type: 'string', description: 'Title UUID' }
      ],
      responseExample: {
        id: 'uuid-string',
        type: 'series',
        name: 'Science Explained',
        synopsis: 'Educational science series...',
        year: 2024,
        language: 'English',
        maturity: 'PG',
        premium: true,
        posterUrl: 'https://example.com/poster.jpg',
        backdropUrl: 'https://example.com/backdrop.jpg',
        trailerUrl: 'https://example.com/trailer.mp4',
        videoUrl: null,
        duration: null,
        rating: 4.8,
        genres: ['Education', 'Science'],
        cast: ['Host Name', 'Guest Expert'],
        audioTracks: [],
        trending: true,
        newRelease: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        seasons: [
          {
            id: 'season-uuid',
            seasonNumber: 1,
            name: 'Season 1',
            episodes: [
              {
                id: 'episode-uuid',
                episodeNumber: 1,
                name: 'Introduction',
                synopsis: 'First episode...',
                duration: 45,
                thumbnailUrl: 'https://example.com/ep1-thumb.jpg',
                videoUrl: '/api/videos/s1e1.mp4',
                audioTracks: [{ id: 0, lang: 'en', name: 'English' }]
              },
              {
                id: 'episode-uuid-2',
                episodeNumber: 2,
                name: 'Deep Dive',
                synopsis: 'Second episode...',
                duration: 50,
                thumbnailUrl: 'https://example.com/ep2-thumb.jpg',
                videoUrl: '/api/videos/s1e2.mp4',
                audioTracks: [{ id: 0, lang: 'en', name: 'English' }]
              }
            ]
          }
        ]
      }
    }
  ];

  // Categories Endpoints
  const categoriesEndpoints: EndpointProps[] = [
    {
      method: 'GET',
      path: '/api/categories',
      description: 'Get all content categories.',
      responseExample: [
        {
          id: 'uuid-string',
          name: 'Science',
          description: 'Science documentaries and educational content',
          created_at: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'uuid-string-2',
          name: 'Technology',
          description: 'Tech tutorials and documentaries',
          created_at: '2024-01-01T00:00:00.000Z'
        }
      ]
    },
    {
      method: 'GET',
      path: '/api/categories/:id',
      description: 'Get a specific category by ID.',
      pathParams: [
        { name: 'id', type: 'string', description: 'Category UUID' }
      ],
      responseExample: {
        id: 'uuid-string',
        name: 'Science',
        description: 'Science documentaries and educational content',
        created_at: '2024-01-01T00:00:00.000Z'
      }
    }
  ];

  // Video Streaming Endpoints
  const videosEndpoints: EndpointProps[] = [
    {
      method: 'GET',
      path: '/api/videos/:filename',
      description: 'Stream a video file. Supports HTTP Range requests for seeking.',
      pathParams: [
        { name: 'filename', type: 'string', description: 'Video filename (from title.videoUrl or episode.videoUrl)' }
      ],
      responseExample: {
        note: 'Returns video stream with Content-Range headers. Use ExoPlayer (Android) or AVPlayer (iOS) for playback.'
      },
      notes: 'Video URLs in titles are relative paths like /api/videos/filename.mp4. This endpoint handles seeking via Range headers.'
    },
    {
      method: 'GET',
      path: '/api/videos/audio/:filename',
      description: 'Stream an audio track file for multi-language support.',
      pathParams: [
        { name: 'filename', type: 'string', description: 'Audio filename (from audioTracks[].url)' }
      ],
      responseExample: {
        note: 'Returns audio stream. Sync with video for multi-language playback.'
      }
    }
  ];

  // Watchlist Endpoints
  const watchlistEndpoints: EndpointProps[] = [
    {
      method: 'GET',
      path: '/api/watchlist',
      description: 'Get current user\'s watchlist.',
      auth: true,
      responseExample: [
        {
          id: 'watchlist-entry-uuid',
          titleId: 'title-uuid',
          addedAt: '2024-01-01T00:00:00.000Z'
        }
      ],
      notes: 'Returns list of title IDs. Fetch full title details separately using /api/titles/:id.'
    },
    {
      method: 'POST',
      path: '/api/watchlist',
      description: 'Add a title to watchlist.',
      auth: true,
      requestBody: {
        titleId: 'title-uuid'
      },
      responseExample: {
        success: true
      }
    },
    {
      method: 'DELETE',
      path: '/api/watchlist/:titleId',
      description: 'Remove a title from watchlist.',
      auth: true,
      pathParams: [
        { name: 'titleId', type: 'string', description: 'Title UUID to remove' }
      ],
      responseExample: {
        success: true
      }
    }
  ];

  // Playback Progress Endpoints
  const playbackEndpoints: EndpointProps[] = [
    {
      method: 'GET',
      path: '/api/playback',
      description: 'Get all playback progress for current user. Used to show "Continue Watching" section.',
      auth: true,
      responseExample: [
        {
          titleId: 'movie-uuid',
          episodeId: null,
          progressSeconds: 1800,
          durationSeconds: 7200,
          updatedAt: '2024-01-15T10:30:00.000Z'
        },
        {
          titleId: 'series-uuid',
          episodeId: 'episode-uuid',
          progressSeconds: 600,
          durationSeconds: 2700,
          updatedAt: '2024-01-15T11:00:00.000Z'
        }
      ],
      notes: 'For movies, episodeId is null. For series, episodeId indicates which episode was watched.'
    },
    {
      method: 'POST',
      path: '/api/playback',
      description: 'Save playback progress. Call this periodically during video playback (every 5-10 seconds).',
      auth: true,
      requestBody: {
        titleId: 'title-uuid',
        episodeId: 'episode-uuid (optional, only for series)',
        progressSeconds: 1800,
        durationSeconds: 7200
      },
      responseExample: {
        success: true
      },
      notes: 'For movies, omit episodeId. For series episodes, include episodeId.'
    },
    {
      method: 'GET',
      path: '/api/playback/:titleId',
      description: 'Get progress for a specific title (movie).',
      auth: true,
      pathParams: [
        { name: 'titleId', type: 'string', description: 'Title UUID' }
      ],
      responseExample: {
        progressSeconds: 1800,
        durationSeconds: 7200
      }
    },
    {
      method: 'GET',
      path: '/api/playback/movie/:titleId',
      description: 'Get movie playback progress.',
      auth: true,
      pathParams: [
        { name: 'titleId', type: 'string', description: 'Movie UUID' }
      ],
      responseExample: {
        progressSeconds: 1800,
        durationSeconds: 7200,
        updatedAt: '2024-01-15T10:30:00.000Z'
      }
    },
    {
      method: 'DELETE',
      path: '/api/playback/movie/:titleId',
      description: 'Delete/reset movie playback progress.',
      auth: true,
      pathParams: [
        { name: 'titleId', type: 'string', description: 'Movie UUID' }
      ],
      responseExample: {
        success: true
      }
    },
    {
      method: 'GET',
      path: '/api/playback/series/:titleId',
      description: 'Get all episode progress for a series.',
      auth: true,
      pathParams: [
        { name: 'titleId', type: 'string', description: 'Series UUID' }
      ],
      responseExample: [
        {
          episodeId: 'episode-1-uuid',
          progressSeconds: 2700,
          durationSeconds: 2700
        },
        {
          episodeId: 'episode-2-uuid',
          progressSeconds: 600,
          durationSeconds: 2700
        }
      ],
      notes: 'progressSeconds = durationSeconds means episode is completed.'
    },
    {
      method: 'DELETE',
      path: '/api/playback/series/:titleId',
      description: 'Delete/reset all series playback progress.',
      auth: true,
      pathParams: [
        { name: 'titleId', type: 'string', description: 'Series UUID' }
      ],
      responseExample: {
        success: true
      }
    }
  ];

  // Transactions/Payments Endpoints
  const transactionsEndpoints: EndpointProps[] = [
    {
      method: 'GET',
      path: '/api/transactions',
      description: 'Get current user\'s payment transactions/subscription requests.',
      auth: true,
      responseExample: [
        {
          id: 'transaction-uuid',
          orderId: 'ORD-1704067200000',
          userId: 'user-uuid',
          planId: 'premium',
          paymentMethod: 'bKash',
          transactionId: 'TXN123456789',
          senderNumber: '01712345678',
          amount: 299,
          status: 'pending',
          rejectionReason: null,
          processedAt: null,
          processedBy: null,
          createdAt: '2024-01-01T10:00:00.000Z'
        },
        {
          id: 'transaction-uuid-2',
          orderId: 'ORD-1703980800000',
          userId: 'user-uuid',
          planId: 'with-ads',
          paymentMethod: 'Nagad',
          transactionId: 'TXN987654321',
          senderNumber: '01812345678',
          amount: 99,
          status: 'approved',
          rejectionReason: null,
          processedAt: '2024-01-01T12:00:00.000Z',
          processedBy: 'admin-uuid',
          createdAt: '2023-12-31T10:00:00.000Z'
        }
      ],
      notes: 'status can be: pending, approved, or rejected.'
    },
    {
      method: 'POST',
      path: '/api/transactions',
      description: 'Create a new payment transaction (subscription upgrade request).',
      auth: true,
      requestBody: {
        planId: 'premium',
        paymentMethod: 'bKash',
        transactionId: 'TXN123456789',
        amount: 299,
        senderNumber: '01712345678'
      },
      responseExample: {
        success: true,
        id: 'new-transaction-uuid'
      },
      notes: 'planId options: with-ads (99 BDT/month), premium (299 BDT/month). Payment methods: bKash, Nagad, Rocket.'
    }
  ];

  // Ads Endpoints
  const adsEndpoints: EndpointProps[] = [
    {
      method: 'GET',
      path: '/api/ads/settings',
      description: 'Get ad configuration settings. Check if ads are enabled and when to show them.',
      responseExample: {
        enabled: true,
        pre_roll: true,
        mid_roll: true,
        mid_roll_interval: 600,
        skip_after: 5
      },
      notes: 'pre_roll: show ad before content. mid_roll: show ads during content every mid_roll_interval seconds. skip_after: seconds before skip button appears.'
    },
    {
      method: 'GET',
      path: '/api/ads/videos/active',
      description: 'Get list of active ad videos to play.',
      responseExample: [
        {
          id: 'ad-uuid',
          title: 'Product Advertisement',
          video_url: '/api/videos/ad-video.mp4',
          click_url: 'https://advertiser.com/landing',
          duration: 30,
          type: 'pre-roll'
        },
        {
          id: 'ad-uuid-2',
          title: 'Service Advertisement',
          video_url: '/api/videos/ad-video-2.mp4',
          click_url: 'https://advertiser2.com/landing',
          duration: 15,
          type: 'mid-roll'
        }
      ],
      notes: 'Only shown to free and with-ads subscription users. Premium users skip ads.'
    },
    {
      method: 'POST',
      path: '/api/ads/impressions',
      description: 'Track ad impression (view) or click for analytics.',
      requestBody: {
        ad_id: 'ad-uuid',
        type: 'impression',
        user_id: 'user-uuid (optional)'
      },
      responseExample: {
        success: true
      },
      notes: 'type can be: impression (ad was viewed) or click (ad was clicked).'
    }
  ];

  // Support Tickets Endpoints
  const ticketsEndpoints: EndpointProps[] = [
    {
      method: 'GET',
      path: '/api/tickets',
      description: 'Get current user\'s support tickets.',
      auth: true,
      responseExample: [
        {
          id: 'ticket-uuid',
          subject: 'Payment Issue',
          message: 'I made a payment but my subscription was not upgraded...',
          status: 'open',
          priority: 'high',
          created_at: '2024-01-15T10:00:00.000Z',
          reply_count: 2
        },
        {
          id: 'ticket-uuid-2',
          subject: 'Video Not Playing',
          message: 'The video keeps buffering...',
          status: 'resolved',
          priority: 'medium',
          created_at: '2024-01-10T15:00:00.000Z',
          reply_count: 3
        }
      ],
      notes: 'status: open, in_progress, resolved, closed. priority: low, medium, high, urgent.'
    },
    {
      method: 'GET',
      path: '/api/tickets/:id',
      description: 'Get a specific ticket with all replies.',
      auth: true,
      pathParams: [
        { name: 'id', type: 'string', description: 'Ticket UUID' }
      ],
      responseExample: {
        id: 'ticket-uuid',
        user_id: 'user-uuid',
        subject: 'Payment Issue',
        message: 'I made a payment but my subscription was not upgraded...',
        status: 'in_progress',
        priority: 'high',
        created_at: '2024-01-15T10:00:00.000Z',
        replies: [
          {
            id: 'reply-uuid',
            user_id: 'admin-uuid',
            message: 'Thank you for contacting us. Can you provide your transaction ID?',
            is_admin: true,
            created_at: '2024-01-15T10:30:00.000Z'
          },
          {
            id: 'reply-uuid-2',
            user_id: 'user-uuid',
            message: 'The transaction ID is TXN123456789',
            is_admin: false,
            created_at: '2024-01-15T11:00:00.000Z'
          }
        ]
      }
    },
    {
      method: 'POST',
      path: '/api/tickets',
      description: 'Create a new support ticket.',
      auth: true,
      requestBody: {
        subject: 'Payment Issue',
        message: 'Detailed description of the issue...',
        priority: 'high'
      },
      responseExample: {
        success: true,
        id: 'new-ticket-uuid'
      },
      notes: 'priority options: low, medium, high, urgent.'
    },
    {
      method: 'POST',
      path: '/api/tickets/:id/replies',
      description: 'Add a reply to an existing ticket.',
      auth: true,
      pathParams: [
        { name: 'id', type: 'string', description: 'Ticket UUID' }
      ],
      requestBody: {
        message: 'Your reply message...'
      },
      responseExample: {
        success: true,
        id: 'new-reply-uuid'
      }
    }
  ];

  // Static Pages Endpoints
  const pagesEndpoints: EndpointProps[] = [
    {
      method: 'GET',
      path: '/api/pages/:key',
      description: 'Get static page content (terms, privacy policy, help, etc.).',
      pathParams: [
        { name: 'key', type: 'string', description: 'Page key: terms, privacy, help, about, faq' }
      ],
      responseExample: {
        key: 'terms',
        title: 'Terms of Service',
        content: '<h1>Terms of Service</h1><p>Content here...</p>',
        updated_at: '2024-01-01T00:00:00.000Z'
      },
      notes: 'Content may be in HTML or Markdown format. Render accordingly in your app.'
    }
  ];

  // Config: Plans & Payment Methods (payment numbers from DB, editable in Admin → Settings)
  const staticDataEndpoints: EndpointProps[] = [
    {
      method: 'GET',
      path: '/api/config',
      description: 'Get full config: plans, payment methods (with numbers), app version. Used by website and app on load.',
      responseExample: { plans: [], paymentMethods: [], appVersion: '1.0.0', maintenanceMode: false },
      notes: 'Payment method numbers are set in Admin → Settings → Payment numbers and shown on website Subscription page and in the app.'
    },
    {
      method: 'GET',
      path: '/api/config/plans',
      description: 'Get subscription plans (Free, With Ads, Premium).',
      responseExample: [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          interval: 'free',
          hasAds: false,
          features: [
            'Access to free content only',
            'Standard quality (480p)',
            'Watch on 1 device',
            'Limited library'
          ]
        },
        {
          id: 'with-ads',
          name: 'Basic (With Ads)',
          price: 99,
          interval: 'monthly',
          hasAds: true,
          features: [
            'Access to all content',
            'HD quality (720p)',
            'Watch on 2 devices',
            'Contains advertisements',
            'Download for offline'
          ]
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 299,
          interval: 'monthly',
          hasAds: false,
          popular: true,
          features: [
            'Access to all content',
            'Ultra HD quality (4K)',
            'Watch on 4 devices',
            'No advertisements',
            'Download for offline',
            'Early access to new releases',
            'Exclusive content'
          ]
        }
      ],
      notes: 'Price is in BDT (Bangladeshi Taka). This data can be hardcoded or fetched on app launch.'
    },
    {
      method: 'GET',
      path: '/api/config/payment-methods',
      description: 'Get payment method send-money numbers (bKash, Nagad, Rocket). Set in Admin → Settings; website and mobile use this endpoint so numbers update everywhere.',
      responseExample: [
        {
          id: 'bkash',
          name: 'bKash',
          number: '01XXXXXXXXX',
          instructions: [
            'Open bKash App or dial *247#',
            'Select "Send Money"',
            'Enter the number: 01XXXXXXXXX',
            'Enter the amount',
            'Enter your PIN and confirm',
            'Copy the Transaction ID'
          ]
        },
        {
          id: 'nagad',
          name: 'Nagad',
          number: '01XXXXXXXXX',
          instructions: [
            'Open Nagad App or dial *167#',
            'Select "Send Money"',
            'Enter the number: 01XXXXXXXXX',
            'Enter the amount',
            'Enter your PIN and confirm',
            'Copy the Transaction ID'
          ]
        },
        {
          id: 'rocket',
          name: 'Rocket',
          number: '01XXXXXXXXX',
          instructions: [
            'Open Rocket App or dial *322#',
            'Select "Send Money"',
            'Enter the number: 01XXXXXXXXX',
            'Enter the amount',
            'Enter your PIN and confirm',
            'Copy the Transaction ID'
          ]
        }
      ],
      notes: 'No auth. Use this URL in website and mobile app; when admin updates numbers in Admin panel, all clients get the same data.'
    },
    {
      method: 'GET',
      path: '/api/config',
      description: 'Get all configuration data in one request. Recommended for initial app load.',
      responseExample: {
        plans: [
          { id: 'free', name: 'Free', price: 0, '...': '...' },
          { id: 'with-ads', name: 'Basic', price: 99, '...': '...' },
          { id: 'premium', name: 'Premium', price: 299, '...': '...' }
        ],
        paymentMethods: [
          { id: 'bkash', name: 'bKash', '...': '...' },
          { id: 'nagad', name: 'Nagad', '...': '...' },
          { id: 'rocket', name: 'Rocket', '...': '...' }
        ],
        appVersion: '1.0.0',
        minAppVersion: '1.0.0',
        maintenanceMode: false
      },
      notes: 'Fetch this on app launch to get all config data. Check maintenanceMode to show maintenance screen if needed.'
    }
  ];

  const apiSections = [
    { id: 'auth', label: 'Auth', icon: Key, endpoints: authEndpoints, description: 'User registration, login, logout and profile management' },
    { id: 'titles', label: 'Content', icon: Film, endpoints: titlesEndpoints, description: 'Movies and series with seasons/episodes' },
    { id: 'categories', label: 'Categories', icon: Layers, endpoints: categoriesEndpoints, description: 'Content categories' },
    { id: 'videos', label: 'Streaming', icon: Play, endpoints: videosEndpoints, description: 'Video and audio streaming' },
    { id: 'watchlist', label: 'Watchlist', icon: List, endpoints: watchlistEndpoints, description: 'Save titles for later' },
    { id: 'playback', label: 'Progress', icon: Video, endpoints: playbackEndpoints, description: 'Continue watching & playback tracking' },
    { id: 'transactions', label: 'Payments', icon: CreditCard, endpoints: transactionsEndpoints, description: 'Subscription payments' },
    { id: 'ads', label: 'Ads', icon: Video, endpoints: adsEndpoints, description: 'Advertisement playback' },
    { id: 'tickets', label: 'Support', icon: MessageSquare, endpoints: ticketsEndpoints, description: 'Help & support tickets' },
    { id: 'pages', label: 'Pages', icon: FileText, endpoints: pagesEndpoints, description: 'Terms, privacy, help pages' },
    { id: 'config', label: 'Config', icon: Wallet, endpoints: staticDataEndpoints, description: 'Plans & payment methods. Payment numbers editable in Admin → Settings.' },
  ];

  const downloadEndpointsAsMarkdown = () => {
    const base = apiBaseUrl.replace(/\/api\/?$/, '') || window.location.origin;
    const lines: string[] = [
      '# ADNFLIX API Endpoints',
      '',
      '## Base URL',
      '',
      '```',
      base,
      '```',
      '',
      'API prefix: `/api` — full base for endpoints: `' + base + '/api`',
      '',
      '---',
      ''
    ];
    apiSections.forEach((section) => {
      lines.push('## ' + section.label);
      lines.push('');
      lines.push(section.description + '.');
      lines.push('');
      section.endpoints.forEach((ep: EndpointProps) => {
        lines.push('### `' + ep.method + '` ' + ep.path);
        lines.push('');
        lines.push(ep.description + (ep.auth ? ' **(Auth required)**' : '') + '.');
        if (ep.notes) lines.push('**Note:** ' + ep.notes);
        lines.push('');
        lines.push('**Full URL:** `' + base + ep.path + '`');
        lines.push('');
      });
      lines.push('---');
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adnflix-api-endpoints.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Code className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">API Documentation</h1>
              <p className="text-muted-foreground">Complete API Reference for Mobile App Development</p>
            </div>
          </div>

          {/* Admin Only Warning */}
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
            <Lock className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-500">Admin Only</p>
              <p className="text-sm text-muted-foreground">This documentation is only accessible to administrators.</p>
            </div>
          </div>

          {/* Mobile App Notice */}
          <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-primary">Mobile App Integration</p>
              <p className="text-sm text-muted-foreground">
                This API provides 1:1 feature parity with the web app. All user features available on web are accessible via these endpoints.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Base URL & Auth Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Base URL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock code={apiBaseUrl} language="text" />
                  <p className="text-sm text-muted-foreground mt-3">
                    All API requests should use this base URL.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Authentication
                  </CardTitle>
                  <CardDescription>JWT Token-based authentication</CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock code={`// Include in all authenticated requests:
Authorization: Bearer <jwt_token>

// Get token from login/register response
// Store securely in your app`} language="javascript" />
                </CardContent>
              </Card>
            </div>

            {/* Feature Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Summary (Web = Mobile)</CardTitle>
                <CardDescription>All features from the web app are available via API</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold">User Account</h4>
                    <ul className="text-muted-foreground space-y-1">
                      <li>- Register & Login</li>
                      <li>- Profile management</li>
                      <li>- Subscription status</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Content</h4>
                    <ul className="text-muted-foreground space-y-1">
                      <li>- Browse movies & series</li>
                      <li>- Seasons & episodes</li>
                      <li>- Categories & search</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Playback</h4>
                    <ul className="text-muted-foreground space-y-1">
                      <li>- Video streaming</li>
                      <li>- Multi-language audio</li>
                      <li>- Continue watching</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">User Features</h4>
                    <ul className="text-muted-foreground space-y-1">
                      <li>- Watchlist</li>
                      <li>- Playback progress</li>
                      <li>- Ad playback</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Payments</h4>
                    <ul className="text-muted-foreground space-y-1">
                      <li>- Subscription plans</li>
                      <li>- bKash/Nagad/Rocket</li>
                      <li>- Transaction history</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Support</h4>
                    <ul className="text-muted-foreground space-y-1">
                      <li>- Create tickets</li>
                      <li>- Reply to tickets</li>
                      <li>- Help pages</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Start Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Start - Mobile App Flow</CardTitle>
                <CardDescription>Step-by-step integration guide</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">1. Authentication</h4>
                    <CodeBlock code={`// Register
POST /api/auth/register
{ email, password, displayName }

// Login
POST /api/auth/login
{ email, password }

// Store token from response
// Use for all subsequent requests`} language="javascript" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">2. Load Content</h4>
                    <CodeBlock code={`// Get all content
GET /api/titles

// Get categories
GET /api/categories

// Get single title
GET /api/titles/:id`} language="javascript" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">3. Video Playback</h4>
                    <CodeBlock code={`// Stream video (use in player)
GET /api/videos/:filename

// Save progress (every 5-10 sec)
POST /api/playback
{ titleId, progressSeconds, durationSeconds }

// Check ads (for free/with-ads users)
GET /api/ads/settings
GET /api/ads/videos/active`} language="javascript" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">4. User Features</h4>
                    <CodeBlock code={`// Watchlist
GET /api/watchlist
POST /api/watchlist { titleId }
DELETE /api/watchlist/:titleId

// Continue watching
GET /api/playback

// Support
POST /api/tickets { subject, message }`} language="javascript" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Endpoints by Section */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>API Endpoints</CardTitle>
                    <CardDescription>Detailed documentation for all endpoints</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={downloadEndpointsAsMarkdown}>
                    <Download className="w-4 h-4" />
                    Download as .md
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="auth" className="w-full">
                  <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                    {apiSections.map((section) => (
                      <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-1 text-xs sm:text-sm">
                        <section.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{section.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {apiSections.map((section) => (
                    <TabsContent key={section.id} value={section.id} className="space-y-3">
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <section.icon className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">{section.label}</h3>
                        <Badge variant="outline">{section.endpoints.length} endpoints</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                      {section.endpoints.map((endpoint, idx) => (
                        <EndpointCard key={idx} endpoint={endpoint} baseUrl={apiBaseUrl} />
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Error Handling */}
            <Card>
              <CardHeader>
                <CardTitle>Error Handling</CardTitle>
                <CardDescription>Standard error response format</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock code={`// All errors return this format:
{
  "error": "Human-readable error message"
}

// HTTP Status Codes:
200 - Success
201 - Created
400 - Bad Request (invalid input)
401 - Unauthorized (not logged in or invalid token)
403 - Forbidden (no permission, e.g., premium content)
404 - Not Found
500 - Server Error (report to support)`} language="javascript" />
              </CardContent>
            </Card>

            {/* Best Practices */}
            <Card>
              <CardHeader>
                <CardTitle>Mobile App Best Practices</CardTitle>
                <CardDescription>Recommendations for optimal implementation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Token Storage</h4>
                    <p className="text-sm text-muted-foreground">
                      Android: Use EncryptedSharedPreferences<br />
                      iOS: Use Keychain Services
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Video Player</h4>
                    <p className="text-sm text-muted-foreground">
                      Android: ExoPlayer<br />
                      iOS: AVPlayer
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Caching</h4>
                    <p className="text-sm text-muted-foreground">
                      Cache titles and categories locally. Refresh on app launch or pull-to-refresh.
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Offline Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Queue playback progress updates when offline. Sync when connection restored.
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Progress Saving</h4>
                    <p className="text-sm text-muted-foreground">
                      Save progress every 5-10 seconds during playback. Also save on pause/exit.
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Ad Integration</h4>
                    <p className="text-sm text-muted-foreground">
                      Check user's subscriptionPlan. Skip ads for premium users.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Logic */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Logic</CardTitle>
                <CardDescription>How to handle content access in your app</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock code={`// Check user subscription from /api/auth/me response
const user = await fetch('/api/auth/me');

// Content access logic:
if (title.premium === true) {
  // Premium content - requires paid subscription
  if (user.subscriptionPlan === 'free') {
    // Show upgrade prompt
  } else {
    // Allow access (with-ads or premium)
  }
}

// Ad playback logic:
if (user.subscriptionPlan === 'premium') {
  // Skip all ads
} else if (user.subscriptionPlan === 'with-ads' || user.subscriptionPlan === 'free') {
  // Show ads based on /api/ads/settings
  const settings = await fetch('/api/ads/settings');
  if (settings.pre_roll) {
    // Play pre-roll ad before content
  }
  if (settings.mid_roll) {
    // Play mid-roll ads every settings.mid_roll_interval seconds
  }
}`} language="javascript" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default APIDocs;
