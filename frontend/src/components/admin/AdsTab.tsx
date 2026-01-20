import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Film,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  ExternalLink,
  Settings,
  Loader2,
  Globe,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { VideoUpload } from '@/components/admin/VideoUpload';
import { useAdSettings, AdVideo, AdSource } from '@/hooks/useAdSettings';
import { fetchVASTAd } from '@/lib/vastParser';
import { fetchVMAP } from '@/lib/vmapParser';

export const AdsTab = () => {
  const {
    settings,
    adVideos,
    isLoading,
    updateSettings,
    addAdVideo,
    updateAdVideo,
    deleteAdVideo,
  } = useAdSettings();

  const [isAddingAd, setIsAddingAd] = useState(false);
  const [editingAd, setEditingAd] = useState<AdVideo | null>(null);
  const [newAd, setNewAd] = useState<Partial<AdVideo>>({
    name: '',
    video_url: '',
    type: 'pre_roll',
    active: true,
    click_url: '',
  });
  
  // VAST/VMAP testing state
  const [testingTag, setTestingTag] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSaveAd = async () => {
    if (!newAd.name || !newAd.video_url) return;

    if (editingAd) {
      await updateAdVideo(editingAd.id, newAd);
    } else {
      await addAdVideo(newAd as Omit<AdVideo, 'id' | 'created_at'>);
    }

    setIsAddingAd(false);
    setEditingAd(null);
    setNewAd({ name: '', video_url: '', type: 'pre_roll', active: true, click_url: '' });
  };

  const handleEditAd = (ad: AdVideo) => {
    setEditingAd(ad);
    setNewAd({
      name: ad.name,
      video_url: ad.video_url,
      type: ad.type,
      active: ad.active,
      click_url: ad.click_url || '',
    });
    setIsAddingAd(true);
  };

  const handleTestVastTag = async (tagUrl: string, tagType: string) => {
    setTestingTag(tagType);
    setTestResult(null);
    
    try {
      const response = await fetchVASTAd(tagUrl);
      if (response.ads.length > 0) {
        setTestResult({
          success: true,
          message: `Found ${response.ads.length} ad(s). Duration: ${response.ads[0].duration}s`,
        });
      } else {
        setTestResult({
          success: false,
          message: 'No ads returned from VAST tag',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Failed to fetch VAST tag'}`,
      });
    } finally {
      setTestingTag(null);
    }
  };

  const handleTestVmapUrl = async () => {
    setTestingTag('vmap');
    setTestResult(null);
    
    try {
      if (!settings.vmapUrl) {
        setTestResult({ success: false, message: 'No VMAP URL configured' });
        return;
      }
      
      const response = await fetchVMAP(settings.vmapUrl);
      if (response.adBreaks.length > 0) {
        const preRoll = response.adBreaks.filter(b => b.timeOffset === 'start').length;
        const postRoll = response.adBreaks.filter(b => b.timeOffset === 'end').length;
        const midRoll = response.adBreaks.length - preRoll - postRoll;
        
        setTestResult({
          success: true,
          message: `Found ${response.adBreaks.length} ad break(s): ${preRoll} pre-roll, ${midRoll} mid-roll, ${postRoll} post-roll`,
        });
      } else {
        setTestResult({
          success: false,
          message: 'No ad breaks found in VMAP',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Failed to fetch VMAP'}`,
      });
    } finally {
      setTestingTag(null);
    }
  };

  const preRollAds = adVideos.filter(a => a.type === 'pre_roll');
  const midRollAds = adVideos.filter(a => a.type === 'mid_roll');
  const postRollAds = adVideos.filter(a => a.type === 'post_roll');

  return (
    <motion.div
      key="ads"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ad Management</h1>
          <p className="text-muted-foreground">Configure video ads for your platform</p>
        </div>
        {settings.adSource === 'custom' && (
          <Button onClick={() => setIsAddingAd(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Ad Video
          </Button>
        )}
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Global Ad Settings
          </CardTitle>
          <CardDescription>Configure ad behavior across your platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div>
              <Label className="text-base font-semibold">Enable Ads</Label>
              <p className="text-sm text-muted-foreground">Master switch for all ads</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
            />
          </div>

          {/* Ad Source Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Ad Source</Label>
            <Tabs 
              value={settings.adSource} 
              onValueChange={(value) => updateSettings({ adSource: value as AdSource })}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="custom" className="gap-2">
                  <Film className="w-4 h-4" />
                  Custom Videos
                </TabsTrigger>
                <TabsTrigger value="vast" className="gap-2">
                  <LinkIcon className="w-4 h-4" />
                  VAST Tags
                </TabsTrigger>
                <TabsTrigger value="vmap" className="gap-2">
                  <Globe className="w-4 h-4" />
                  VMAP Playlist
                </TabsTrigger>
              </TabsList>

              <TabsContent value="custom" className="mt-4">
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Use your own uploaded video ads. Perfect for direct sponsorships and in-house promotions.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="vast" className="mt-4 space-y-4">
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect to ad networks using VAST (Video Ad Serving Template) tags. Enter the tag URLs for each ad position.
                  </p>
                  
                  {/* Pre-roll VAST Tag */}
                  <div className="space-y-2 mb-4">
                    <Label>Pre-roll VAST Tag URL</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://ad-network.com/vast?position=preroll"
                        value={settings.vastPreRollTag || ''}
                        onChange={(e) => updateSettings({ vastPreRollTag: e.target.value || null })}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => settings.vastPreRollTag && handleTestVastTag(settings.vastPreRollTag, 'pre')}
                        disabled={!settings.vastPreRollTag || testingTag === 'pre'}
                      >
                        {testingTag === 'pre' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                      </Button>
                    </div>
                  </div>

                  {/* Mid-roll VAST Tag */}
                  <div className="space-y-2 mb-4">
                    <Label>Mid-roll VAST Tag URL</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://ad-network.com/vast?position=midroll"
                        value={settings.vastMidRollTag || ''}
                        onChange={(e) => updateSettings({ vastMidRollTag: e.target.value || null })}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => settings.vastMidRollTag && handleTestVastTag(settings.vastMidRollTag, 'mid')}
                        disabled={!settings.vastMidRollTag || testingTag === 'mid'}
                      >
                        {testingTag === 'mid' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                      </Button>
                    </div>
                  </div>

                  {/* Post-roll VAST Tag */}
                  <div className="space-y-2">
                    <Label>Post-roll VAST Tag URL</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://ad-network.com/vast?position=postroll"
                        value={settings.vastPostRollTag || ''}
                        onChange={(e) => updateSettings({ vastPostRollTag: e.target.value || null })}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => settings.vastPostRollTag && handleTestVastTag(settings.vastPostRollTag, 'post')}
                        disabled={!settings.vastPostRollTag || testingTag === 'post'}
                      >
                        {testingTag === 'post' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="vmap" className="mt-4 space-y-4">
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    Use a VMAP (Video Multiple Ad Playlist) URL to let the ad server define the complete ad schedule including timing and positions.
                  </p>
                  
                  <div className="space-y-2">
                    <Label>VMAP Playlist URL</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://ad-network.com/vmap?content_id=xxx"
                        value={settings.vmapUrl || ''}
                        onChange={(e) => updateSettings({ vmapUrl: e.target.value || null })}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        onClick={handleTestVmapUrl}
                        disabled={!settings.vmapUrl || testingTag === 'vmap'}
                      >
                        {testingTag === 'vmap' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Test Result Display */}
            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                testResult.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}

            {/* Fallback Toggle (for VAST/VMAP) */}
            {(settings.adSource === 'vast' || settings.adSource === 'vmap') && (
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div>
                  <Label>Fallback to Custom Ads</Label>
                  <p className="text-xs text-muted-foreground">
                    Use custom video ads if VAST/VMAP fails to load
                  </p>
                </div>
                <Switch
                  checked={settings.fallbackToCustom}
                  onCheckedChange={(fallbackToCustom) => updateSettings({ fallbackToCustom })}
                />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Pre-roll Toggle */}
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div>
                <Label>Pre-roll Ads</Label>
                <p className="text-xs text-muted-foreground">Before video starts</p>
              </div>
              <Switch
                checked={settings.preRollEnabled}
                onCheckedChange={(preRollEnabled) => updateSettings({ preRollEnabled })}
              />
            </div>

            {/* Mid-roll Toggle */}
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div>
                <Label>Mid-roll Ads</Label>
                <p className="text-xs text-muted-foreground">During video playback</p>
              </div>
              <Switch
                checked={settings.midRollEnabled}
                onCheckedChange={(midRollEnabled) => updateSettings({ midRollEnabled })}
              />
            </div>

            {/* Post-roll Toggle */}
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div>
                <Label>Post-roll Ads</Label>
                <p className="text-xs text-muted-foreground">After video ends</p>
              </div>
              <Switch
                checked={settings.postRollEnabled}
                onCheckedChange={(postRollEnabled) => updateSettings({ postRollEnabled })}
              />
            </div>
          </div>

          {/* Timing Settings */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Mid-roll Interval (minutes)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.midRollIntervalMinutes]}
                  min={5}
                  max={30}
                  step={1}
                  onValueChange={(values) => {
                    const midRollIntervalMinutes = values[0];
                    updateSettings({ midRollIntervalMinutes });
                  }}
                  className="flex-1"
                />
                <span className="w-12 text-center font-mono">
                  {settings.midRollIntervalMinutes}m
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                How often mid-roll ads appear during long videos
              </p>
            </div>

            <div className="space-y-3">
              <Label>Skip Button Delay (seconds)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.skipAfterSeconds]}
                  min={3}
                  max={15}
                  step={1}
                  onValueChange={(values) => {
                    const skipAfterSeconds = values[0];
                    updateSettings({ skipAfterSeconds });
                  }}
                  className="flex-1"
                />
                <span className="w-12 text-center font-mono">
                  {settings.skipAfterSeconds}s
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Seconds before "Skip Ad" button appears
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Minimum Video Duration for Mid-roll (seconds)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[settings.minVideoDurationForMidroll]}
                min={60}
                max={900}
                step={30}
                onValueChange={(values) => {
                  const minVideoDurationForMidroll = values[0];
                  updateSettings({ minVideoDurationForMidroll });
                }}
                className="flex-1"
              />
              <span className="w-16 text-center font-mono">
                {Math.floor(settings.minVideoDurationForMidroll / 60)}m
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Videos shorter than this won't show mid-roll ads
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Custom Ad Videos (only show when using custom source) */}
      {settings.adSource === 'custom' && (
        <div className="grid gap-6">
          {/* Pre-roll Ads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Badge className="bg-green-500">Pre-roll</Badge>
                  Ads ({preRollAds.length})
                </span>
              </CardTitle>
              <CardDescription>Shown before the video starts</CardDescription>
            </CardHeader>
            <CardContent>
              <AdVideoList
                videos={preRollAds}
                onEdit={handleEditAd}
                onDelete={deleteAdVideo}
                onToggle={(id, active) => updateAdVideo(id, { active })}
              />
            </CardContent>
          </Card>

          {/* Mid-roll Ads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Badge className="bg-yellow-500">Mid-roll</Badge>
                  Ads ({midRollAds.length})
                </span>
              </CardTitle>
              <CardDescription>Shown during video playback at calculated intervals</CardDescription>
            </CardHeader>
            <CardContent>
              <AdVideoList
                videos={midRollAds}
                onEdit={handleEditAd}
                onDelete={deleteAdVideo}
                onToggle={(id, active) => updateAdVideo(id, { active })}
              />
            </CardContent>
          </Card>

          {/* Post-roll Ads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Badge className="bg-blue-500">Post-roll</Badge>
                  Ads ({postRollAds.length})
                </span>
              </CardTitle>
              <CardDescription>Shown after the video ends</CardDescription>
            </CardHeader>
            <CardContent>
              <AdVideoList
                videos={postRollAds}
                onEdit={handleEditAd}
                onDelete={deleteAdVideo}
                onToggle={(id, active) => updateAdVideo(id, { active })}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Ad Dialog */}
      <Dialog open={isAddingAd} onOpenChange={(open) => {
        if (!open) {
          setIsAddingAd(false);
          setEditingAd(null);
          setNewAd({ name: '', video_url: '', type: 'pre_roll', active: true, click_url: '' });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAd ? 'Edit Ad Video' : 'Add New Ad Video'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ad Name</Label>
              <Input
                placeholder="e.g., Brand Promo Summer 2024"
                value={newAd.name}
                onChange={(e) => setNewAd({ ...newAd, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Ad Type</Label>
              <Select
                value={newAd.type}
                onValueChange={(type: 'pre_roll' | 'mid_roll' | 'post_roll') =>
                  setNewAd({ ...newAd, type })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_roll">Pre-roll (Before video)</SelectItem>
                  <SelectItem value="mid_roll">Mid-roll (During video)</SelectItem>
                  <SelectItem value="post_roll">Post-roll (After video)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Video URL</Label>
              <VideoUpload
                onUploadComplete={(url) => setNewAd({ ...newAd, video_url: url })}
                currentUrl={newAd.video_url}
              />
            </div>

            <div className="space-y-2">
              <Label>Click-through URL (optional)</Label>
              <Input
                placeholder="https://example.com/landing-page"
                value={newAd.click_url || ''}
                onChange={(e) => setNewAd({ ...newAd, click_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Where users go when they click "Learn More"
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={newAd.active}
                onCheckedChange={(active) => setNewAd({ ...newAd, active })}
              />
              <Label>Active (show this ad to users)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddingAd(false);
              setEditingAd(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAd}
              disabled={!newAd.name || !newAd.video_url}
            >
              {editingAd ? 'Save Changes' : 'Add Ad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Ad Video List Component
const AdVideoList = ({
  videos,
  onEdit,
  onDelete,
  onToggle,
}: {
  videos: AdVideo[];
  onEdit: (ad: AdVideo) => void;
  onDelete: (id: string) => Promise<boolean>;
  onToggle: (id: string, active: boolean) => void;
}) => {
  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Film className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No ads configured for this type</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {videos.map((video) => (
        <div
          key={video.id}
          className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg"
        >
          <div className="w-32 h-18 bg-black rounded overflow-hidden flex-shrink-0">
            <video
              src={video.video_url}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{video.name}</h4>
            <p className="text-sm text-muted-foreground truncate">{video.video_url}</p>
            {video.click_url && (
              <a
                href={video.click_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
              >
                <ExternalLink className="w-3 h-3" />
                {video.click_url}
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onToggle(video.id, !video.active)}
              title={video.active ? 'Deactivate' : 'Activate'}
            >
              {video.active ? (
                <Eye className="w-4 h-4 text-green-500" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(video)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(video.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdsTab;
