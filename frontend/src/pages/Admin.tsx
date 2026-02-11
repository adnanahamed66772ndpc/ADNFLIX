import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Film,
  Tv,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  Menu,
  X,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Save,
  Layers,
  Phone,
  Loader2,
  Video,
  MessageSquare,
  Send,
  Image as ImageIcon,
  Play,
  MoreVertical,
  Copy,
  Code,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VideoUpload } from '@/components/admin/VideoUpload';
import { AdsTab } from '@/components/admin/AdsTab';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTitlesContext } from '@/contexts/TitlesContext';
import { useTitlesAdmin, Title, Season, Episode } from '@/hooks/useTitles';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { useAdminUsers, AdminUser } from '@/hooks/useAdminUsers';
import { useCategories, Category } from '@/hooks/useCategories';
import { useTickets, Ticket } from '@/hooks/useTickets';
import apiClient, { getDisplayApiUrl } from '@/api/client';
// Removed Supabase types - using API types instead

type SubscriptionPlan = 'free' | 'with-ads' | 'premium';
type AppRole = 'admin' | 'user';

// Tab types
type TabType = 'dashboard' | 'movies' | 'series' | 'categories' | 'users' | 'payments' | 'ads' | 'analytics' | 'tickets' | 'api-docs' | 'settings';

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAdmin } = useAuthContext();
  
  // Database hooks
  const { titles, isLoading: titlesLoading, refresh: refreshTitles } = useTitlesContext();
  const { addTitle, updateTitle, deleteTitle, addSeason, deleteSeason, addEpisode, deleteEpisode } = useTitlesAdmin();
  const { transactions, isLoading: transactionsLoading, approveTransaction, rejectTransaction, refresh: refreshTransactions } = useTransactions();
  const { users, isLoading: usersLoading, updateUserRole, updateUserSubscription, refresh: refreshUsers } = useAdminUsers();
  const { categories, isLoading: categoriesLoading, addCategory, updateCategory, deleteCategory, refresh: refreshCategories } = useCategories();
  const { tickets, isLoading: ticketsLoading, refresh: refreshTickets, updateTicketStatus, getTicketById } = useTickets();

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);
  const [isAddingTitle, setIsAddingTitle] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [managingSeasons, setManagingSeasons] = useState<Title | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive"
      });
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render admin content for non-admins
  if (!user || !isAdmin) {
    return null;
  }

  // Filter content based on search
  const filteredTitles = titles.filter(title =>
    title.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const pendingTransactionsCount = transactions.filter(t => t.status === 'pending').length;
  const totalRevenue = transactions
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + t.amount, 0);

  // Handlers
  const handleAddTitle = async (titleData: Partial<Title>) => {
    // Validate required fields
    if (!titleData.name || titleData.name.trim() === '') {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    const titleType = (titleData.type === 'movie' || titleData.type === 'series') 
      ? titleData.type 
      : 'movie';
    
    // Validate year - ensure it's a valid number
    const year = titleData.year 
      ? (typeof titleData.year === 'number' ? titleData.year : parseInt(String(titleData.year), 10))
      : new Date().getFullYear();
    
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 10) {
      toast({ 
        title: "Invalid year", 
        description: "Please enter a valid year between 1900 and " + (new Date().getFullYear() + 10),
        variant: "destructive" 
      });
      return;
    }

    // Ensure type is always set - default to 'movie' if not provided
    const newTitle = {
      name: titleData.name.trim(),
      type: titleType,
      synopsis: titleData.synopsis || '',
      year: year,
      duration: titleData.duration || 120,
      rating: titleData.rating || 0,
      maturity: titleData.maturity || 'PG-13',
      language: titleData.language || 'English',
      genres: titleData.genres || [],
      cast: titleData.cast || [],
      posterUrl: titleData.posterUrl || '',
      backdropUrl: titleData.backdropUrl || '',
      videoUrl: titleData.videoUrl || '',
      trailerUrl: titleData.trailerUrl || '',
      premium: titleData.premium || false,
      trending: titleData.trending || false,
      newRelease: titleData.newRelease || false,
    };

    const result = await addTitle(newTitle as Omit<Title, 'id' | 'createdAt' | 'seasons'>);
    if (result.success) {
      toast({ title: "Title added successfully" });
      // Add a small delay to ensure backend has processed the insert
      setTimeout(() => {
        refreshTitles();
      }, 500);
      setIsAddingTitle(false);
    } else {
      toast({ 
        title: "Failed to add title", 
        description: result.error || "Please check all required fields and try again",
        variant: "destructive" 
      });
    }
  };

  const handleUpdateTitle = async (id: string, updates: Partial<Title>) => {
    // Find the original title to preserve type if not provided
    const originalTitle = titles.find(t => t.id === id);
    
    // Ensure type is always preserved - never update type to undefined
    const safeUpdates = {
      ...updates,
      // Only update type if explicitly provided, otherwise preserve original
      type: updates.type !== undefined ? updates.type : (originalTitle?.type || 'movie'),
    };
    
    const success = await updateTitle(id, safeUpdates);
    if (success) {
      toast({ title: "Title updated successfully" });
      refreshTitles();
      setEditingTitle(null);
    } else {
      toast({ title: "Failed to update title", variant: "destructive" });
    }
  };

  const handleDeleteTitle = async (id: string) => {
    const success = await deleteTitle(id);
    if (success) {
      toast({ title: "Title deleted successfully" });
      refreshTitles();
    } else {
      toast({ title: "Failed to delete title", variant: "destructive" });
    }
  };

  const handleApproveTransaction = async (id: string) => {
    const result = await approveTransaction(id);
    if (result.success) {
      toast({ title: "Transaction approved", description: "User subscription has been activated." });
      refreshTransactions();
    } else {
      toast({ title: "Failed to approve", description: result.error ?? "Try again.", variant: "destructive" });
    }
  };

  const handleRejectTransaction = async (id: string, reason: string) => {
    const result = await rejectTransaction(id, reason);
    if (result.success) {
      toast({ title: "Transaction rejected" });
      refreshTransactions();
    } else {
      toast({ title: "Failed to reject", description: result.error ?? "Try again.", variant: "destructive" });
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<AdminUser>) => {
    let success = true;
    
    if (updates.role) {
      success = await updateUserRole(userId, updates.role);
    }
    
    if (success && updates.subscriptionPlan) {
      success = await updateUserSubscription(userId, updates.subscriptionPlan);
    }
    
    if (success) {
      toast({ title: "User updated successfully" });
      refreshUsers();
      setEditingUser(null);
    } else {
      toast({ title: "Failed to update user", variant: "destructive" });
    }
  };

  const handleAddSeason = async (titleId: string, seasonNumber: number) => {
    const id = await addSeason(titleId, seasonNumber);
    if (id) {
      toast({ title: "Season added" });
      refreshTitles();
    }
  };

  const handleDeleteSeason = async (seasonId: string) => {
    const success = await deleteSeason(seasonId);
    if (success) {
      toast({ title: "Season deleted" });
      refreshTitles();
    }
  };

  const handleAddEpisode = async (seasonId: string, episode: Omit<Episode, 'id'>) => {
    const id = await addEpisode(seasonId, episode);
    if (id) {
      toast({ title: "Episode added" });
      refreshTitles();
    }
  };

  const handleDeleteEpisode = async (episodeId: string) => {
    const success = await deleteEpisode(episodeId);
    if (success) {
      toast({ title: "Episode deleted" });
      refreshTitles();
    }
  };

  // Sidebar navigation items
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'movies' as TabType, label: 'Movies', icon: Film },
    { id: 'series' as TabType, label: 'Series', icon: Tv },
    { id: 'categories' as TabType, label: 'Categories', icon: Layers },
    { id: 'users' as TabType, label: 'Users', icon: Users },
    { id: 'payments' as TabType, label: 'Payments', icon: CreditCard, badge: pendingTransactionsCount },
    { id: 'tickets' as TabType, label: 'Tickets', icon: MessageSquare, badge: tickets.filter(t => t.status === 'open').length },
    { id: 'ads' as TabType, label: 'Ads', icon: Video },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'api-docs' as TabType, label: 'API Docs', icon: Code },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-full md:w-64' : 'w-0 md:w-16'} bg-card border-r border-border transition-all duration-300 flex flex-col fixed md:relative inset-y-0 left-0 z-50 md:z-auto overflow-hidden`}>
        <div className="p-3 sm:p-4 flex items-center justify-between border-b border-border">
          {sidebarOpen && <h1 className="text-lg sm:text-xl font-bold text-primary">Admin</h1>}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
        
        <nav className="flex-1 p-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? 'secondary' : 'ghost'}
              className={`w-full justify-start mb-1 ${sidebarOpen ? '' : 'justify-center px-2'}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="w-4 h-4" />
              {sidebarOpen && <span className="ml-2">{item.label}</span>}
              {sidebarOpen && item.badge && item.badge > 0 && (
                <Badge className="ml-auto bg-primary">{item.badge}</Badge>
              )}
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
            {sidebarOpen ? 'Back to Site' : '←'}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-0">
        <div className="p-3 sm:p-4 md:p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <DashboardTab
                titlesCount={titles.length}
                usersCount={users.length}
                pendingPayments={pendingTransactionsCount}
                totalRevenue={totalRevenue}
                recentTransactions={transactions.slice(0, 5)}
              />
            )}

            {activeTab === 'movies' && (
              <MoviesTab
                titles={filteredTitles.filter(t => t.type === 'movie')}
                isLoading={titlesLoading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddTitle={() => setIsAddingTitle(true)}
                onEditTitle={setEditingTitle}
                onDeleteTitle={handleDeleteTitle}
              />
            )}

            {activeTab === 'series' && (
              <SeriesTab
                titles={filteredTitles.filter(t => t.type === 'series')}
                isLoading={titlesLoading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddTitle={() => setIsAddingTitle(true)}
                onEditTitle={setEditingTitle}
                onDeleteTitle={handleDeleteTitle}
                onManageSeasons={setManagingSeasons}
              />
            )}

            {activeTab === 'users' && (
              <UsersTab
                users={filteredUsers}
                isLoading={usersLoading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onEditUser={setEditingUser}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesTab
                categories={categories}
                isLoading={categoriesLoading}
                onAddCategory={async (category) => {
                  try {
                    await addCategory(category);
                    await refreshCategories();
                  } catch (error) {
                    throw error;
                  }
                }}
                onUpdateCategory={async (id, updates) => {
                  try {
                    await updateCategory(id, updates);
                    await refreshCategories();
                  } catch (error) {
                    throw error;
                  }
                }}
                onDeleteCategory={async (id) => {
                  try {
                    await deleteCategory(id);
                    await refreshCategories();
                  } catch (error) {
                    throw error;
                  }
                }}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsTab
                transactions={transactions}
                isLoading={transactionsLoading}
                onApprove={handleApproveTransaction}
                onReject={handleRejectTransaction}
              />
            )}

            {activeTab === 'tickets' && (
              <TicketsTab
                tickets={tickets}
                isLoading={ticketsLoading}
                onUpdateStatus={updateTicketStatus}
                refreshTickets={refreshTickets}
                getTicketById={getTicketById}
              />
            )}
            {activeTab === 'ads' && <AdsTab />}
            {activeTab === 'analytics' && <AnalyticsTab titles={titles} users={users} transactions={transactions} />}
            {activeTab === 'api-docs' && <APIDocsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </AnimatePresence>
        </div>
      </main>

      {/* Dialogs */}
      <TitleDialog
        title={editingTitle}
        isOpen={!!editingTitle || isAddingTitle}
        categories={categories}
        forcedType={activeTab === 'movies' ? 'movie' : activeTab === 'series' ? 'series' : undefined}
        onClose={() => { setEditingTitle(null); setIsAddingTitle(false); }}
        onSave={(data) => {
          if (editingTitle) {
            handleUpdateTitle(editingTitle.id, data);
          } else {
            handleAddTitle(data);
          }
        }}
      />

      <UserDialog
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={(updates) => {
          if (editingUser) {
            handleUpdateUser(editingUser.id, updates);
          }
        }}
      />

      <SeasonDialog
        title={managingSeasons}
        isOpen={!!managingSeasons}
        onClose={() => { setManagingSeasons(null); refreshTitles(); }}
        onAddSeason={(seasonNumber) => managingSeasons && handleAddSeason(managingSeasons.id, seasonNumber)}
        onDeleteSeason={handleDeleteSeason}
        onAddEpisode={handleAddEpisode}
        onDeleteEpisode={handleDeleteEpisode}
      />
    </div>
  );
};

// ============= Dashboard Tab =============
const DashboardTab = ({
  titlesCount,
  usersCount,
  pendingPayments,
  totalRevenue,
  recentTransactions
}: {
  titlesCount: number;
  usersCount: number;
  pendingPayments: number;
  totalRevenue: number;
  recentTransactions: Transaction[];
}) => (
  <motion.div
    key="dashboard"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
    
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Film className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{titlesCount}</p>
              <p className="text-sm text-muted-foreground">Total Titles</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{usersCount}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingPayments}</p>
              <p className="text-sm text-muted-foreground">Pending Payments</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Latest payment activities</CardDescription>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium">{t.planId}</p>
                  <p className="text-sm text-muted-foreground">{t.paymentMethod}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${t.amount}</p>
                  <Badge variant={t.status === 'approved' ? 'default' : t.status === 'pending' ? 'secondary' : 'destructive'}>
                    {t.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

// ============= Movies Tab =============
const MoviesTab = ({
  titles,
  isLoading,
  searchQuery,
  onSearchChange,
  onAddTitle,
  onEditTitle,
  onDeleteTitle
}: {
  titles: Title[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddTitle: () => void;
  onEditTitle: (title: Title) => void;
  onDeleteTitle: (id: string) => void;
}) => (
  <motion.div
    key="movies"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold">Movies</h1>
        <p className="text-muted-foreground">Manage and upload movies</p>
      </div>
      <Button onClick={onAddTitle}>
        <Plus className="w-4 h-4 mr-2" />
        Add Movie
      </Button>
    </div>

    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search movies..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>

    {isLoading ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    ) : titles.length === 0 ? (
      <Card>
        <CardContent className="py-12 text-center">
          <Film className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No movies yet</h3>
          <p className="text-muted-foreground mb-4">Add your first movie to get started.</p>
          <Button onClick={onAddTitle}>
            <Plus className="w-4 h-4 mr-2" />
            Add Movie
          </Button>
        </CardContent>
      </Card>
    ) : (
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-4 font-medium">Title</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">Year</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {titles.map((title) => (
                <tr key={title.id} className="hover:bg-secondary/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 bg-secondary rounded overflow-hidden flex-shrink-0">
                        {title.posterUrl && (
                          <img src={title.posterUrl} alt={title.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{title.name}</p>
                        <p className="text-sm text-muted-foreground">{title.genres.join(', ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">{title.year}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {title.premium && <Badge className="bg-amber-500/20 text-amber-400">Premium</Badge>}
                      {title.trending && <Badge className="bg-blue-500/20 text-blue-400">Trending</Badge>}
                      {title.newRelease && <Badge className="bg-green-500/20 text-green-400">New</Badge>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onEditTitle(title)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDeleteTitle(title.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )}
  </motion.div>
);

// ============= Series Tab =============
const SeriesTab = ({
  titles,
  isLoading,
  searchQuery,
  onSearchChange,
  onAddTitle,
  onEditTitle,
  onDeleteTitle,
  onManageSeasons
}: {
  titles: Title[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddTitle: () => void;
  onEditTitle: (title: Title) => void;
  onDeleteTitle: (id: string) => void;
  onManageSeasons: (title: Title) => void;
}) => (
  <motion.div
    key="series"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold">Series</h1>
        <p className="text-muted-foreground">Manage and upload series</p>
      </div>
      <Button onClick={onAddTitle}>
        <Plus className="w-4 h-4 mr-2" />
        Add Series
      </Button>
    </div>

    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search series..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>

    {isLoading ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    ) : titles.length === 0 ? (
      <Card>
        <CardContent className="py-12 text-center">
          <Tv className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No series yet</h3>
          <p className="text-muted-foreground mb-4">Add your first series to get started.</p>
          <Button onClick={onAddTitle}>
            <Plus className="w-4 h-4 mr-2" />
            Add Series
          </Button>
        </CardContent>
      </Card>
    ) : (
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-4 font-medium">Title</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">Year</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {titles.map((title) => (
                <tr key={title.id} className="hover:bg-secondary/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 bg-secondary rounded overflow-hidden flex-shrink-0">
                        {title.posterUrl && (
                          <img src={title.posterUrl} alt={title.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{title.name}</p>
                        <p className="text-sm text-muted-foreground">{title.genres.join(', ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">{title.year}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {title.premium && <Badge className="bg-amber-500/20 text-amber-400">Premium</Badge>}
                      {title.trending && <Badge className="bg-blue-500/20 text-blue-400">Trending</Badge>}
                      {title.newRelease && <Badge className="bg-green-500/20 text-green-400">New</Badge>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onManageSeasons(title)} title="Manage Seasons & Episodes">
                        <Layers className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onEditTitle(title)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDeleteTitle(title.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )}
  </motion.div>
);

// ============= Users Tab =============
const UsersTab = ({
  users,
  isLoading,
  searchQuery,
  onSearchChange,
  onEditUser
}: {
  users: AdminUser[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEditUser: (user: AdminUser) => void;
}) => (
  <motion.div
    key="users"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and subscriptions</p>
      </div>
    </div>

    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>

    {isLoading ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    ) : users.length === 0 ? (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No users yet</h3>
          <p className="text-muted-foreground">Users will appear here after they register.</p>
        </CardContent>
      </Card>
    ) : (
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium hidden md:table-cell">Role</th>
                <th className="text-left p-4 font-medium hidden sm:table-cell">Subscription</th>
                <th className="text-left p-4 font-medium hidden lg:table-cell">Joined</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-primary font-medium">{user.displayName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <Badge variant="outline" className={
                      user.subscriptionPlan === 'premium' ? 'bg-amber-500/20 text-amber-400' :
                      user.subscriptionPlan === 'with-ads' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-secondary'
                    }>
                      {user.subscriptionPlan}
                    </Badge>
                  </td>
                  <td className="p-4 hidden lg:table-cell text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <Button size="sm" variant="ghost" onClick={() => onEditUser(user)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )}
  </motion.div>
);

// Payment method type for payment numbers edit (used inside Payments tab)
type PaymentMethodSetting = { id: string; name: string; number: string | null; updated_at?: string };

// ============= Payments Tab =============
const PaymentsTab = ({
  transactions,
  isLoading,
  onApprove,
  onReject,
}: {
  transactions: Transaction[];
  isLoading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) => {
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Payment numbers (sub-tab state)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSetting[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [savingPaymentId, setSavingPaymentId] = useState<string | null>(null);
  const [paymentEdits, setPaymentEdits] = useState<Record<string, { name: string; number: string }>>({});

  const filteredTransactions = filterStatus === 'all' 
    ? transactions 
    : transactions.filter(t => t.status === filterStatus);

  const pendingCount = transactions.filter(t => t.status === 'pending').length;
  const approvedCount = transactions.filter(t => t.status === 'approved').length;
  const rejectedCount = transactions.filter(t => t.status === 'rejected').length;

  const handleReject = () => {
    if (selectedTransaction && rejectReason.trim()) {
      onReject(selectedTransaction.id, rejectReason);
      setShowRejectDialog(false);
      setSelectedTransaction(null);
      setRejectReason('');
    }
  };

  const fetchPaymentMethods = async () => {
    setPaymentMethodsLoading(true);
    try {
      const data = await apiClient.get<PaymentMethodSetting[]>('/admin/config/payment-methods');
      setPaymentMethods(data);
      const edits: Record<string, { name: string; number: string }> = {};
      data.forEach((pm) => {
        edits[pm.id] = { name: pm.name || '', number: pm.number || '' };
      });
      setPaymentEdits(edits);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      toast({ title: "Error", description: "Could not load payment methods", variant: "destructive" });
    } finally {
      setPaymentMethodsLoading(false);
    }
  };

  const handleSavePaymentMethod = async (id: string) => {
    const edit = paymentEdits[id];
    if (!edit) return;
    setSavingPaymentId(id);
    try {
      await apiClient.put(`/admin/config/payment-methods/${id}`, { name: edit.name.trim() || undefined, number: edit.number.trim() || undefined });
      toast({ title: "Saved", description: "Payment number updated. Website and app will show the new number." });
      fetchPaymentMethods();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save", variant: "destructive" });
    } finally {
      setSavingPaymentId(null);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
  };

  return (
    <motion.div
      key="payments"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Transactions and payment numbers for website & app</p>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payment-numbers">Payment numbers</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-0">
      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setFilterStatus('pending')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => setFilterStatus('approved')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-500/50 transition-colors" onClick={() => setFilterStatus('rejected')}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'pending' | 'approved' | 'rejected')} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All ({transactions.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Transactions Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left p-4 font-medium">Transaction</th>
                  <th className="text-left p-4 font-medium hidden md:table-cell">Plan</th>
                  <th className="text-left p-4 font-medium hidden sm:table-cell">Payment</th>
                  <th className="text-left p-4 font-medium">Amount</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-secondary/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium font-mono text-sm">{transaction.transactionId}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="font-medium">{transaction.planId}</span>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{transaction.paymentMethod}</p>
                          {transaction.senderNumber && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />{transaction.senderNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-lg font-bold">${transaction.amount}</span>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="p-4">
                        {transaction.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => onApprove(transaction.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="payment-numbers" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Payment numbers (website & app)</CardTitle>
              <CardDescription>Set the send-money numbers for bKash, Nagad, and Rocket. These appear on the website Subscription page and in the app Payment details.</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethodsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((pm) => (
                    <div key={pm.id} className="p-4 border border-border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold capitalize">{pm.id}</h3>
                        <Button
                          size="sm"
                          onClick={() => handleSavePaymentMethod(pm.id)}
                          disabled={savingPaymentId === pm.id}
                        >
                          {savingPaymentId === pm.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                          Save
                        </Button>
                      </div>
                      <div className="grid gap-2">
                        <Label>Display name</Label>
                        <Input
                          value={paymentEdits[pm.id]?.name ?? pm.name ?? ''}
                          onChange={(e) => setPaymentEdits((prev) => ({ ...prev, [pm.id]: { ...prev[pm.id], name: e.target.value, number: prev[pm.id]?.number ?? pm.number ?? '' } }))}
                          placeholder="e.g. bKash"
                        />
                        <Label>Send money number (shown to users)</Label>
                        <Input
                          value={paymentEdits[pm.id]?.number ?? pm.number ?? ''}
                          onChange={(e) => setPaymentEdits((prev) => ({ ...prev, [pm.id]: { name: prev[pm.id]?.name ?? pm.name ?? '', number: e.target.value } }))}
                          placeholder="01XXXXXXXXX"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Details Dialog */}
      <Dialog open={!!selectedTransaction && !showRejectDialog} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              View detailed information about this transaction.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Order ID</Label>
                  <p className="font-mono">{selectedTransaction.orderId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Plan</Label>
                  <p className="font-medium">{selectedTransaction.planId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-lg font-bold text-primary">${selectedTransaction.amount}</p>
                </div>
              </div>
              
              <div className="p-4 bg-secondary rounded-lg">
                <Label className="text-muted-foreground">Payment Details</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="font-medium">{selectedTransaction.paymentMethod}</span>
                  </div>
                  {selectedTransaction.senderNumber && (
                    <div className="flex justify-between">
                      <span>Sender Number:</span>
                      <span className="font-mono">{selectedTransaction.senderNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-primary">{selectedTransaction.transactionId}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p>{formatDate(selectedTransaction.createdAt)}</p>
                </div>
                {selectedTransaction.processedAt && (
                  <div>
                    <Label className="text-muted-foreground">Processed</Label>
                    <p>{formatDate(selectedTransaction.processedAt)}</p>
                  </div>
                )}
              </div>
              
              {selectedTransaction.rejectionReason && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <Label className="text-destructive">Rejection Reason</Label>
                  <p className="text-sm mt-1">{selectedTransaction.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTransaction(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transaction</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for rejection</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejecting this transaction..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectReason(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>
              Reject Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// ============= Analytics Tab =============
const AnalyticsTab = ({ titles, users, transactions }: { titles: Title[]; users: AdminUser[]; transactions: Transaction[] }) => {
  const subscriptionCounts = {
    free: users.filter(u => u.subscriptionPlan === 'free').length,
    with_ads: users.filter(u => u.subscriptionPlan === 'with-ads').length,
    premium: users.filter(u => u.subscriptionPlan === 'premium').length,
  };

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Titles</span>
                <span className="font-bold">{titles.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Movies</span>
                <span className="font-bold">{titles.filter(t => t.type === 'movie').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Series</span>
                <span className="font-bold">{titles.filter(t => t.type === 'series').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Premium Content</span>
                <span className="font-bold">{titles.filter(t => t.premium).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Free</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-muted-foreground" style={{ width: `${(subscriptionCounts.free / Math.max(users.length, 1)) * 100}%` }} />
                  </div>
                  <span className="font-bold w-8">{subscriptionCounts.free}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Basic</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(subscriptionCounts.with_ads / Math.max(users.length, 1)) * 100}%` }} />
                  </div>
                  <span className="font-bold w-8">{subscriptionCounts.with_ads}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Premium</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${(subscriptionCounts.premium / Math.max(users.length, 1)) * 100}%` }} />
                  </div>
                  <span className="font-bold w-8">{subscriptionCounts.premium}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Transactions</span>
                <span className="font-bold">{transactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Approved</span>
                <span className="font-bold text-green-500">{transactions.filter(t => t.status === 'approved').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending</span>
                <span className="font-bold text-yellow-500">{transactions.filter(t => t.status === 'pending').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Revenue</span>
                <span className="font-bold text-primary">
                  ${transactions.filter(t => t.status === 'approved').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

// ============= Categories Tab =============
const CategoriesTab = ({
  categories,
  isLoading,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}: {
  categories: Category[];
  isLoading: boolean;
  onAddCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}) => {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', type: 'genre' as 'genre' | 'category', description: '' });

  const handleAdd = async () => {
    if (!formData.name || !formData.slug) {
      toast({ title: "Error", description: "Name and slug are required", variant: "destructive" });
      return;
    }
    try {
      await onAddCategory(formData);
      toast({ title: "Success", description: "Category added successfully" });
      setFormData({ name: '', slug: '', type: 'genre', description: '' });
      setIsAdding(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add category", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!editing || !formData.name || !formData.slug) {
      toast({ title: "Error", description: "Name and slug are required", variant: "destructive" });
      return;
    }
    try {
      await onUpdateCategory(editing.id, formData);
      toast({ title: "Success", description: "Category updated successfully" });
      setEditing(null);
      setFormData({ name: '', slug: '', type: 'genre', description: '' });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update category", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await onDeleteCategory(id);
      toast({ title: "Success", description: "Category deleted successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete category", variant: "destructive" });
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const genres = categories.filter(c => c.type === 'genre');
  const categoryList = categories.filter(c => c.type === 'category');

  return (
    <motion.div
      key="categories"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Categories & Genres</h1>
          <p className="text-muted-foreground">Manage categories and genres for titles</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Genres Section */}
          <Card>
            <CardHeader>
              <CardTitle>Genres</CardTitle>
              <CardDescription>Movie and series genres</CardDescription>
            </CardHeader>
            <CardContent>
              {genres.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No genres yet. Add your first genre.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {genres.map((category) => (
                    <div key={category.id} className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">{category.slug}</p>
                          {category.description && (
                            <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditing(category);
                            setFormData({ name: category.name, slug: category.slug, type: category.type, description: category.description || '' });
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories Section */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Content categories</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryList.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No categories yet. Add your first category.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryList.map((category) => (
                    <div key={category.id} className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">{category.slug}</p>
                          {category.description && (
                            <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditing(category);
                            setFormData({ name: category.name, slug: category.slug, type: category.type, description: category.description || '' });
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAdding || !!editing} onOpenChange={() => { setIsAdding(false); setEditing(null); setFormData({ name: '', slug: '', type: 'genre', description: '' }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the category information.' : 'Create a new category or genre.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({ ...formData, name, slug: generateSlug(name) });
                }}
                placeholder="e.g., Action, Drama, Comedy"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., action, drama, comedy"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as 'genre' | 'category' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="genre">Genre</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAdding(false); setEditing(null); setFormData({ name: '', slug: '', type: 'genre', description: '' }); }}>Cancel</Button>
            <Button onClick={editing ? handleUpdate : handleAdd}>
              <Save className="w-4 h-4 mr-2" />
              {editing ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const TICKET_POLL_MS = 3000;

// ============= Tickets Tab =============
const TicketsTab = ({
  tickets,
  isLoading,
  onUpdateStatus,
  refreshTickets,
  getTicketById
}: {
  tickets: Ticket[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: string, priority?: string) => Promise<boolean>;
  refreshTickets: () => void;
  getTicketById: (id: string) => Promise<{ id: string; subject: string; message: string; status: string; priority: string; created_at: string; user_name?: string; user_email?: string; replies: Array<{ id: string; message: string; is_admin: boolean; created_at: string; user_name?: string }> }>;
}) => {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketDetail, setTicketDetail] = useState<{ id: string; subject: string; message: string; status: string; user_name?: string; user_email?: string; replies: Array<{ id: string; message: string; is_admin: boolean; created_at: string; user_name?: string }> } | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTickets = statusFilter === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === statusFilter);

  const fetchTicketDetail = useCallback(async (ticketId: string) => {
    try {
      const data = await getTicketById(ticketId);
      setTicketDetail(data);
    } catch (_) {
      setTicketDetail(null);
    }
  }, [getTicketById]);

  useEffect(() => {
    if (!selectedTicket) {
      setTicketDetail(null);
      return;
    }
    fetchTicketDetail(selectedTicket.id);
  }, [selectedTicket?.id]);

  useEffect(() => {
    if (!selectedTicket?.id) return;
    const t = setInterval(() => fetchTicketDetail(selectedTicket.id), TICKET_POLL_MS);
    return () => clearInterval(t);
  }, [selectedTicket?.id, fetchTicketDetail]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await onUpdateStatus(ticketId, newStatus);
      toast({ title: "Success", description: "Ticket status updated" });
      refreshTickets();
      if (ticketDetail?.id === ticketId) setTicketDetail((d) => d ? { ...d, status: newStatus } : null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update status";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    setIsSubmitting(true);
    try {
      await apiClient.post(`/tickets/${selectedTicket.id}/replies`, { message: replyMessage });
      toast({ title: "Sent", description: "Reply sent. User will see it in a few seconds." });
      setReplyMessage('');
      await fetchTicketDetail(selectedTicket.id);
      refreshTickets();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to send reply";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      key="tickets"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Manage user support tickets</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
            <p className="text-muted-foreground">There are no tickets matching your filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => setSelectedTicket(ticket)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{ticket.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>From: {ticket.user_name || ticket.user_email || 'User'}</span>
                      <span>Priority: <span className="capitalize">{ticket.priority}</span></span>
                      <span>{new Date(ticket.created_at).toLocaleString()}</span>
                      {ticket.reply_count && ticket.reply_count > 0 && (
                        <span>{ticket.reply_count} {ticket.reply_count === 1 ? 'reply' : 'replies'}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={ticket.status}
                        onValueChange={(v) => handleStatusChange(ticket.id, v)}
                      >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Live chat dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) { setSelectedTicket(null); setTicketDetail(null); setReplyMessage(''); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle className="flex items-center gap-2">
              {selectedTicket?.subject}
              <span className="text-xs font-normal text-muted-foreground">· Live chat</span>
            </DialogTitle>
            <DialogDescription>
              {selectedTicket && (ticketDetail?.user_name || ticketDetail?.user_email || 'User')} · Updates every few seconds
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 max-h-[320px]">
                {!ticketDetail ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  (() => {
                    const initialCreatedAt = (ticketDetail as { created_at?: string }).created_at || new Date().toISOString();
                    const messages = [
                      { id: 'initial', message: ticketDetail.message, is_admin: false, created_at: initialCreatedAt, user_name: ticketDetail.user_name },
                      ...(ticketDetail.replies || []).map((r) => ({ id: r.id, message: r.message, is_admin: r.is_admin, created_at: r.created_at, user_name: r.user_name })),
                    ];
                    return messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.is_admin ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{msg.is_admin ? 'You (Admin)' : (msg.user_name || 'User')}</span>
                            <span className="text-[10px] opacity-75">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm break-words">{msg.message}</p>
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>
              <div className="p-4 border-t flex gap-2">
                <Select value={selectedTicket.status} onValueChange={(v) => handleStatusChange(selectedTicket.id, v)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  className="flex-1 min-h-[52px] resize-none"
                />
                <Button onClick={handleReply} disabled={isSubmitting || !replyMessage.trim()} className="shrink-0 h-[52px] px-4">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
              <div className="px-6 pb-4 pt-0">
                <Button variant="outline" size="sm" onClick={() => { setSelectedTicket(null); setTicketDetail(null); setReplyMessage(''); }}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// ============= API Docs Tab =============
const APIDocsTab = () => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">API Documentation</h2>
          <p className="text-muted-foreground">API Reference for Mobile App Development</p>
        </div>
        <Button onClick={() => navigate('/api-docs')} className="gap-2">
          <ExternalLink className="w-4 h-4" />
          Full Documentation
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              Base URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm bg-secondary p-2 rounded block break-all">
              {getDisplayApiUrl()}
            </code>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Authenticate using JWT Token. You will receive a token after login.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-green-500" />
              11 API Sections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Auth, Titles, Categories, Videos, Watchlist, Playback, Transactions, Admin, Ads, Tickets, Pages
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick API Overview</CardTitle>
          <CardDescription>Main API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">Authentication</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><code className="bg-secondary px-1 rounded">POST /api/auth/register</code></li>
                <li><code className="bg-secondary px-1 rounded">POST /api/auth/login</code></li>
                <li><code className="bg-secondary px-1 rounded">GET /api/auth/me</code></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Content</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><code className="bg-secondary px-1 rounded">GET /api/titles</code></li>
                <li><code className="bg-secondary px-1 rounded">GET /api/categories</code></li>
                <li><code className="bg-secondary px-1 rounded">GET /api/videos/:filename</code></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">User Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><code className="bg-secondary px-1 rounded">GET /api/watchlist</code></li>
                <li><code className="bg-secondary px-1 rounded">POST /api/playback</code></li>
                <li><code className="bg-secondary px-1 rounded">POST /api/tickets</code></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Payments</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><code className="bg-secondary px-1 rounded">GET /api/transactions</code></li>
                <li><code className="bg-secondary px-1 rounded">POST /api/transactions</code></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm">
              <strong>Full Documentation:</strong> View complete API documentation and learn about request/response formats for all endpoints 
              <Button variant="link" className="p-0 h-auto ml-1" onClick={() => navigate('/api-docs')}>
                Go to API Docs
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ============= Settings Tab =============
const SettingsTab = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState<Array<{ id: string; page_key: string; title: string; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [pageContent, setPageContent] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<Array<{ id: string; page_key: string; title: string; content: string }>>('/pages');
      setPages(data);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (page: { page_key: string; title: string; content: string }) => {
    setEditingPage(page.page_key);
    setPageContent({ title: page.title, content: page.content });
  };

  const handleSave = async () => {
    if (!editingPage) return;
    try {
      await apiClient.put(`/pages/${editingPage}`, pageContent);
      toast({ title: "Success", description: "Page content updated" });
      setEditingPage(null);
      fetchPages();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update page", variant: "destructive" });
    }
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Page Content Management</CardTitle>
          <CardDescription>Edit Help, Terms of Service, and Privacy Policy content. Changes appear on the website immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {pages.map((page) => (
                <div key={page.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{page.title}</h3>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(page)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Key: {page.page_key}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingPage} onOpenChange={() => { setEditingPage(null); setPageContent({ title: '', content: '' }); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Page Content</DialogTitle>
            <DialogDescription>
              Edit the HTML content for this page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={pageContent.title}
                onChange={(e) => setPageContent({ ...pageContent, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Content (HTML)</Label>
              <Textarea
                value={pageContent.content}
                onChange={(e) => setPageContent({ ...pageContent, content: e.target.value })}
                rows={20}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingPage(null); setPageContent({ title: '', content: '' }); }}>Cancel</Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// ============= Title Dialog =============
const TitleDialog = ({
  title,
  isOpen,
  onClose,
  onSave,
  categories = [],
  forcedType
}: {
  title: Title | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Title>) => void;
  categories?: Category[];
  forcedType?: 'movie' | 'series';
}) => {
  const [formData, setFormData] = useState<Partial<Title>>({});

  useEffect(() => {
    if (title) {
      setFormData(title);
    } else {
      setFormData({
        name: '',
        type: forcedType || 'movie',
        synopsis: '',
        year: new Date().getFullYear(),
        duration: 120,
        rating: 7,
        maturity: 'PG-13',
        language: 'English',
        genres: [],
        cast: [],
        posterUrl: '',
        backdropUrl: '',
        videoUrl: '',
        premium: false,
        trending: false,
        newRelease: false,
      });
    }
  }, [title, isOpen, forcedType]);

  const handleSubmit = () => {
    // Ensure type is always included and preserved
    const titleType = formData.type || (title?.type || 'movie');
    const dataToSave = {
      ...formData,
      type: titleType, // Preserve existing type or default to movie
    };
    
    // For series, clear videoUrl as videos are added through episodes
    if (titleType === 'series') {
      dataToSave.videoUrl = '';
    }
    
    onSave(dataToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[95vh] overflow-y-auto mx-2 sm:mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{title ? 'Edit Title' : 'Add New Title'}</DialogTitle>
          <DialogDescription className="text-sm">
            {title ? 'Update the title information below.' : 'Fill in the details to add a new title (movie or series).'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:gap-4 py-2 sm:py-4 max-h-[80vh] overflow-y-auto pr-1 sm:pr-2 pl-[5px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Title name"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type || (title?.type || forcedType || 'movie')}
                onValueChange={(v) => {
                  // Always ensure type is set - never allow undefined
                  const newType = (v === 'movie' || v === 'series') ? v : (title?.type || forcedType || 'movie');
                  setFormData({ ...formData, type: newType as 'movie' | 'series' });
                }}
                disabled={!!forcedType || (!!title && title.type === 'series' && (title.seasons?.length || 0) > 0)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Movie</SelectItem>
                  <SelectItem value="series">Series</SelectItem>
                </SelectContent>
              </Select>
              {forcedType && (
                <p className="text-xs text-muted-foreground">
                  ℹ️ Type is set to <strong>{forcedType}</strong> based on current section
                </p>
              )}
              {title && title.type === 'series' && (title.seasons?.length || 0) > 0 && (
                <p className="text-xs text-muted-foreground">
                  ⚠️ Cannot change type: Series already has seasons
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Synopsis</Label>
            <Textarea
              value={formData.synopsis || ''}
              onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
              placeholder="Brief description..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={formData.year || new Date().getFullYear()}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={formData.duration || 120}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Rating</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.rating || 7}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Input
                value={formData.language || 'English'}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Maturity Rating</Label>
              <Select
                value={formData.maturity || 'PG-13'}
                onValueChange={(v) => setFormData({ ...formData, maturity: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="G">G</SelectItem>
                  <SelectItem value="PG">PG</SelectItem>
                  <SelectItem value="PG-13">PG-13</SelectItem>
                  <SelectItem value="R">R</SelectItem>
                  <SelectItem value="TV-MA">TV-MA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Genres/Categories</Label>
            <div className="flex flex-wrap gap-2 p-3 border border-border rounded-md min-h-[60px] bg-secondary/50">
              {formData.genres && formData.genres.length > 0 ? (
                formData.genres.map((genre, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {genre}
                    <button
                      type="button"
                      onClick={() => {
                        const newGenres = formData.genres?.filter((_, i) => i !== idx) || [];
                        setFormData({ ...formData, genres: newGenres });
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No genres selected</span>
              )}
            </div>
            <Select
              value=""
              onValueChange={(value) => {
                const genreName = categories.find(c => c.id === value)?.name || value;
                const currentGenres = formData.genres || [];
                if (!currentGenres.includes(genreName)) {
                  setFormData({ ...formData, genres: [...currentGenres, genreName] });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select genres/categories..." />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(cat => cat.type === 'genre').map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Select genres from the categories you've created</p>
          </div>
          <div className="space-y-2">
            <Label>Cast Members</Label>
            <div className="flex flex-wrap gap-2 p-3 border border-border rounded-md min-h-[60px] bg-secondary/50">
              {formData.cast && formData.cast.length > 0 ? (
                formData.cast.map((member, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {member}
                    <button
                      type="button"
                      onClick={() => {
                        const newCast = formData.cast?.filter((_, i) => i !== idx) || [];
                        setFormData({ ...formData, cast: newCast });
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No cast members added</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter cast member name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget as HTMLInputElement;
                    const value = input.value.trim();
                    if (value) {
                      const currentCast = formData.cast || [];
                      if (!currentCast.includes(value)) {
                        setFormData({ ...formData, cast: [...currentCast, value] });
                        input.value = '';
                      }
                    }
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Press Enter to add cast member</p>
          </div>
          <div className="space-y-2">
            <Label>Poster URL</Label>
            <Input
              value={formData.posterUrl || ''}
              onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Backdrop URL</Label>
            <Input
              value={formData.backdropUrl || ''}
              onChange={(e) => setFormData({ ...formData, backdropUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          {/* Video Source - Only for Movies */}
          {(formData.type || title?.type || 'movie') === 'movie' && (
            <div className="space-y-2">
              <Label>Video Source</Label>
              <Tabs defaultValue="url" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">URL Link</TabsTrigger>
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="mt-2">
                  <Input
                    value={formData.videoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://...m3u8 or direct video URL"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter HLS (.m3u8) or direct video URL
                  </p>
                </TabsContent>
                <TabsContent value="upload" className="mt-2">
                  <VideoUpload
                    currentUrl={formData.videoUrl}
                    onUploadComplete={(url) => setFormData({ ...formData, videoUrl: url })}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {/* Series Video Info */}
          {(formData.type || title?.type || 'movie') === 'series' && (
            <div className="space-y-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-lg">ℹ️</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-300">Series Video Upload</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    For series, videos are added through episodes. After saving this series, click the <strong>"Manage Seasons & Episodes"</strong> button to add seasons and episodes with their videos.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.premium || false}
                onCheckedChange={(checked) => setFormData({ ...formData, premium: checked })}
              />
              <Label>Premium</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.trending || false}
                onCheckedChange={(checked) => setFormData({ ...formData, trending: checked })}
              />
              <Label>Trending</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.newRelease || false}
                onCheckedChange={(checked) => setFormData({ ...formData, newRelease: checked })}
              />
              <Label>New Release</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============= User Dialog =============
const UserDialog = ({
  user,
  isOpen,
  onClose,
  onSave
}: {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<AdminUser>) => void;
}) => {
  const [formData, setFormData] = useState<Partial<AdminUser>>({});

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user role and subscription settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={formData.displayName || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Display name cannot be changed by admin</p>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={formData.role || 'user'}
              onValueChange={(v) => setFormData({ ...formData, role: v as AppRole })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subscription Plan</Label>
            <Select
              value={formData.subscriptionPlan || 'free'}
              onValueChange={(v) => setFormData({ ...formData, subscriptionPlan: v as SubscriptionPlan })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic_with_ads">Basic with Ads</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(formData); onClose(); }}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============= Season Dialog =============
const SeasonDialog = ({
  title,
  isOpen,
  onClose,
  onAddSeason,
  onDeleteSeason,
  onAddEpisode,
  onDeleteEpisode
}: {
  title: Title | null;
  isOpen: boolean;
  onClose: () => void;
  onAddSeason: (seasonNumber: number) => void;
  onDeleteSeason: (seasonId: string) => void;
  onAddEpisode: (seasonId: string, episode: Omit<Episode, 'id'>) => void;
  onDeleteEpisode: (episodeId: string) => void;
}) => {
  const { toast } = useToast();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [isAddingSeason, setIsAddingSeason] = useState(false);
  const [isAddingEpisode, setIsAddingEpisode] = useState(false);
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);
  const [newSeasonNumber, setNewSeasonNumber] = useState(1);
  const [newEpisode, setNewEpisode] = useState<Partial<Episode>>({});
  const [editingEpisode, setEditingEpisode] = useState<Partial<Episode>>({});
  const [episodeSearch, setEpisodeSearch] = useState<string>('');

  useEffect(() => {
    if (title) {
      setNewSeasonNumber((title.seasons?.length || 0) + 1);
    }
  }, [title]);

  if (!title) return null;

  const handleAddSeason = () => {
    if (newSeasonNumber > 0) {
      onAddSeason(newSeasonNumber);
      setIsAddingSeason(false);
      setNewSeasonNumber(newSeasonNumber + 1);
    }
  };

  const handleAddEpisode = () => {
    if (!selectedSeasonId || !newEpisode.name || !newEpisode.videoUrl) {
      toast({ 
        title: "Missing required fields", 
        description: "Episode name and video (upload or URL) are required",
        variant: "destructive" 
      });
      return;
    }
    const season = title.seasons?.find(s => s.id === selectedSeasonId);
    onAddEpisode(selectedSeasonId, {
      episodeNumber: (season?.episodes.length || 0) + 1,
      name: newEpisode.name,
      synopsis: newEpisode.synopsis || '',
      duration: newEpisode.duration || 45,
      videoUrl: newEpisode.videoUrl,
      thumbnailUrl: newEpisode.thumbnailUrl || title.backdropUrl || '',
    });
    setIsAddingEpisode(false);
    setNewEpisode({});
  };

  const handleEditEpisode = (episode: Episode) => {
    setEditingEpisodeId(episode.id);
    setEditingEpisode({
      name: episode.name,
      synopsis: episode.synopsis || '',
      duration: episode.duration,
      videoUrl: episode.videoUrl || '',
      thumbnailUrl: episode.thumbnailUrl || '',
    });
  };

  const handleSaveEpisode = () => {
    // Note: Update episode functionality would need to be added to the backend
    // For now, this is just UI preparation
    setEditingEpisodeId(null);
    setEditingEpisode({});
  };

  const filteredEpisodes = (episodes: Episode[]) => {
    if (!episodeSearch) return episodes;
    return episodes.filter(ep => 
      ep.name.toLowerCase().includes(episodeSearch.toLowerCase()) ||
      ep.synopsis?.toLowerCase().includes(episodeSearch.toLowerCase())
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Layers className="w-6 h-6" />
            Manage Seasons & Episodes
          </DialogTitle>
          <DialogDescription>
            {title ? `Manage seasons and episodes for "${title.name}"` : 'Add and manage seasons and episodes for this series.'}
          </DialogDescription>
          <p className="text-sm text-muted-foreground mt-1">{title.name}</p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6 py-4">
            {/* Seasons Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Seasons</h3>
                  <p className="text-sm text-muted-foreground">
                    {title.seasons?.length || 0} season{(title.seasons?.length || 0) !== 1 ? 's' : ''} total
                  </p>
                </div>
                <Button onClick={() => setIsAddingSeason(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Season
                </Button>
              </div>

              {isAddingSeason && (
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label className="w-32">Season Number:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newSeasonNumber}
                        onChange={(e) => setNewSeasonNumber(parseInt(e.target.value) || 1)}
                        className="w-24"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setIsAddingSeason(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleAddSeason}>Add Season</Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-3">
                {title.seasons?.map((season) => {
                  const filtered = filteredEpisodes(season.episodes);
                  return (
                    <Card key={season.id} className="overflow-hidden">
                      <div
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedSeasonId === season.id 
                            ? 'bg-primary/10 border-l-4 border-l-primary' 
                            : 'hover:bg-secondary/50'
                        }`}
                        onClick={() => setSelectedSeasonId(selectedSeasonId === season.id ? null : season.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                              S{season.seasonNumber}
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">
                                {season.name || `Season ${season.seasonNumber}`}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {season.episodes.length} episode{season.episodes.length !== 1 ? 's' : ''}
                                {season.episodes.length > 0 && (
                                  <span className="ml-2">
                                    • {season.episodes.reduce((sum, ep) => sum + (ep.duration || 0), 0)} min total
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{season.episodes.length} eps</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (confirm(`Delete Season ${season.seasonNumber} and all its episodes?`)) {
                                  onDeleteSeason(season.id);
                                }
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <ChevronRight 
                              className={`w-5 h-5 transition-transform text-muted-foreground ${
                                selectedSeasonId === season.id ? 'rotate-90' : ''
                              }`} 
                            />
                          </div>
                        </div>
                      </div>

                      {selectedSeasonId === season.id && (
                        <div className="p-4 pt-0 space-y-4 border-t">
                          {/* Episode Search */}
                          {season.episodes.length > 0 && (
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Search episodes..."
                                value={episodeSearch}
                                onChange={(e) => setEpisodeSearch(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                          )}

                          {/* Add Episode Button */}
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                              Episodes
                            </h5>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setIsAddingEpisode(true)}
                              className="gap-2"
                            >
                              <Plus className="w-3 h-3" />
                              Add Episode
                            </Button>
                          </div>

                          {/* Add Episode Form */}
                          {isAddingEpisode && (
                            <Card className="p-4 bg-secondary/50 border-dashed">
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label>Episode Name *</Label>
                                    <Input
                                      placeholder="Episode name"
                                      value={newEpisode.name || ''}
                                      onChange={(e) => setNewEpisode({ ...newEpisode, name: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Duration (minutes) *</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      placeholder="45"
                                      value={newEpisode.duration || ''}
                                      onChange={(e) => setNewEpisode({ ...newEpisode, duration: parseInt(e.target.value) || 45 })}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Synopsis</Label>
                                  <Textarea
                                    placeholder="Episode description..."
                                    value={newEpisode.synopsis || ''}
                                    onChange={(e) => setNewEpisode({ ...newEpisode, synopsis: e.target.value })}
                                    rows={2}
                                  />
                                </div>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label className="text-base font-semibold">Video Source *</Label>
                                    <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-background min-h-[200px]">
                                      <VideoUpload
                                        currentUrl={newEpisode.videoUrl}
                                        onUploadComplete={(url) => {
                                          setNewEpisode({ ...newEpisode, videoUrl: url });
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Thumbnail URL</Label>
                                    <Input
                                      placeholder="https://..."
                                      value={newEpisode.thumbnailUrl || ''}
                                      onChange={(e) => setNewEpisode({ ...newEpisode, thumbnailUrl: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => { setIsAddingEpisode(false); setNewEpisode({}); }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={handleAddEpisode}
                                    disabled={!newEpisode.name || !newEpisode.videoUrl}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Episode
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          )}

                          {/* Episodes List */}
                          <div className="space-y-2">
                            {filtered.length > 0 ? (
                              filtered.map((episode) => (
                                editingEpisodeId === episode.id ? (
                                  <Card key={episode.id} className="p-4 bg-primary/5 border-primary/20">
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                          <Label>Episode Name</Label>
                                          <Input
                                            value={editingEpisode.name || ''}
                                            onChange={(e) => setEditingEpisode({ ...editingEpisode, name: e.target.value })}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Duration (min)</Label>
                                          <Input
                                            type="number"
                                            value={editingEpisode.duration || ''}
                                            onChange={(e) => setEditingEpisode({ ...editingEpisode, duration: parseInt(e.target.value) || 0 })}
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Synopsis</Label>
                                        <Textarea
                                          value={editingEpisode.synopsis || ''}
                                          onChange={(e) => setEditingEpisode({ ...editingEpisode, synopsis: e.target.value })}
                                          rows={2}
                                        />
                                      </div>
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label>Video Source</Label>
                                          <Tabs defaultValue="url" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                              <TabsTrigger value="url">URL Link</TabsTrigger>
                                              <TabsTrigger value="upload">Upload File</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="url" className="mt-2">
                                              <Input
                                                value={editingEpisode.videoUrl || ''}
                                                onChange={(e) => setEditingEpisode({ ...editingEpisode, videoUrl: e.target.value })}
                                                placeholder="https://...m3u8 or direct video URL"
                                              />
                                              <p className="text-xs text-muted-foreground mt-1">
                                                Enter HLS (.m3u8) or direct video URL
                                              </p>
                                            </TabsContent>
                                            <TabsContent value="upload" className="mt-2">
                                              <VideoUpload
                                                currentUrl={editingEpisode.videoUrl}
                                                onUploadComplete={(url) => setEditingEpisode({ ...editingEpisode, videoUrl: url })}
                                              />
                                            </TabsContent>
                                          </Tabs>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Thumbnail URL</Label>
                                          <Input
                                            value={editingEpisode.thumbnailUrl || ''}
                                            onChange={(e) => setEditingEpisode({ ...editingEpisode, thumbnailUrl: e.target.value })}
                                          />
                                        </div>
                                      </div>
                                      <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="outline" onClick={() => { setEditingEpisodeId(null); setEditingEpisode({}); }}>
                                          Cancel
                                        </Button>
                                        <Button size="sm" onClick={handleSaveEpisode}>
                                          <Save className="w-3 h-3 mr-1" />
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ) : (
                                  <Card key={episode.id} className="p-3 hover:bg-secondary/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                      <div className="relative w-24 h-14 rounded bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {episode.thumbnailUrl ? (
                                          <img 
                                            src={episode.thumbnailUrl} 
                                            alt={episode.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        ) : (
                                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                          <Play className="w-4 h-4 text-white" />
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Badge variant="outline" className="text-xs">
                                                E{episode.episodeNumber}
                                              </Badge>
                                              <h6 className="font-semibold truncate">{episode.name}</h6>
                                            </div>
                                            {episode.synopsis && (
                                              <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                                                {episode.synopsis}
                                              </p>
                                            )}
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                              <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {episode.duration}m
                                              </span>
                                              {episode.videoUrl && (
                                                <span className="flex items-center gap-1 text-green-600">
                                                  <Video className="w-3 h-3" />
                                                  Video
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleEditEpisode(episode)}
                                              className="h-8 w-8 p-0"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                if (confirm(`Delete "${episode.name}"?`)) {
                                                  onDeleteEpisode(episode.id);
                                                }
                                              }}
                                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                )
                              ))
                            ) : season.episodes.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No episodes yet</p>
                                <p className="text-xs mt-1">Click "Add Episode" to get started</p>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-muted-foreground text-sm">
                                No episodes match your search
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}

                {(!title.seasons || title.seasons.length === 0) && (
                  <Card className="p-12 text-center">
                    <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h4 className="font-semibold mb-2">No seasons yet</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add your first season to start organizing episodes
                    </p>
                    <Button onClick={() => setIsAddingSeason(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Season
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Admin;
