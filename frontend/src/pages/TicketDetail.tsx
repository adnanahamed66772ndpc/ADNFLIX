import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import apiClient from '@/api/client';
import { ArrowLeft, Send, Loader2, User, Shield } from 'lucide-react';

interface TicketReply {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_name?: string;
}

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  user_name?: string;
  replies: TicketReply[];
}

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthContext();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

  const fetchTicket = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<Ticket>(`/tickets/${id}`);
      setTicket(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load ticket", variant: "destructive" });
      navigate('/help');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      toast({ title: "Error", description: "Please enter a message", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(`/tickets/${id}/replies`, { message: replyMessage });
      toast({ title: "Success", description: "Reply sent successfully" });
      setReplyMessage('');
      fetchTicket();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send reply", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/help')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help Center
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{ticket.subject}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="capitalize">{ticket.status.replace('_', ' ')}</Badge>
                    <Badge variant="secondary" className="capitalize">{ticket.priority}</Badge>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(ticket.created_at).toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">From: {ticket.user_name || 'User'}</p>
                  <p className="whitespace-pre-wrap">{ticket.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Replies */}
          <div className="space-y-4 mb-6">
            <h2 className="text-xl font-semibold">Replies ({ticket.replies?.length || 0})</h2>
            {ticket.replies && ticket.replies.length > 0 ? (
              ticket.replies.map((reply) => (
                <Card key={reply.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${reply.is_admin ? 'bg-primary/10' : 'bg-secondary'}`}>
                        {reply.is_admin ? (
                          <Shield className="w-5 h-5 text-primary" />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{reply.user_name || (reply.is_admin ? 'Admin' : 'User')}</span>
                          {reply.is_admin && <Badge variant="outline" className="text-xs">Admin</Badge>}
                          <span className="text-xs text-muted-foreground">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{reply.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No replies yet</p>
            )}
          </div>

          {/* Reply Form */}
          <Card>
            <CardHeader>
              <CardTitle>Add Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Message</Label>
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleReply} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TicketDetail;
