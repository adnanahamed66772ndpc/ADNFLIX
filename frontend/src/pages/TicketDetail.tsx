import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

const POLL_INTERVAL_MS = 1000;

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthContext();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    if (!id) return;
    try {
      const data = await apiClient.get<Ticket>(`/tickets/${id}`);
      setTicket(data);
    } catch {
      setTicket(null);
    }
  };

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetchTicket().finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !ticket) return;
    const t = setInterval(fetchTicket, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [id, ticket?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.replies?.length]);

  const handleReply = async () => {
    if (!id || !replyMessage.trim()) {
      toast({ title: "Error", description: "Please enter a message", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post(`/tickets/${id}/replies`, { message: replyMessage });
      setReplyMessage('');
      await fetchTicket();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to send reply";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !ticket) {
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

  if (!ticket) {
    toast({ title: "Error", description: "Ticket not found", variant: "destructive" });
    navigate('/support');
    return null;
  }

  const messages: { id: string; message: string; is_admin: boolean; created_at: string; user_name?: string }[] = [
    { id: 'initial', message: ticket.message, is_admin: false, created_at: ticket.created_at, user_name: ticket.user_name },
    ...(ticket.replies || []).map((r) => ({ id: r.id, message: r.message, is_admin: r.is_admin, created_at: r.created_at, user_name: r.user_name })),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 flex-1 flex flex-col max-w-3xl">
        <div className="py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/support')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{ticket.subject}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="capitalize text-xs">{ticket.status.replace('_', ' ')}</Badge>
              <span className="text-xs text-muted-foreground">Live chat · updates every second</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.is_admin
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.is_admin ? (
                      <Shield className="w-3.5 h-3.5 opacity-90" />
                    ) : (
                      <User className="w-3.5 h-3.5 opacity-70" />
                    )}
                    <span className="text-xs font-medium opacity-90">
                      {msg.is_admin ? 'Support' : (msg.user_name || 'You')}
                    </span>
                    <span className="text-[10px] opacity-75">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm break-words">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-border bg-background/50">
            <div className="flex gap-2">
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type a message..."
                rows={2}
                className="min-h-[52px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
              />
              <Button
                onClick={handleReply}
                disabled={isSubmitting || !replyMessage.trim()}
                className="shrink-0 h-[52px] px-4"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TicketDetail;
