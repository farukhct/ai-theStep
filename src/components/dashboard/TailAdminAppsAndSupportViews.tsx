import React, { useMemo, useState } from 'react';
import {
  Search,
  Send,
  MessageSquare,
  LifeBuoy,
  Mail,
  Star,
  Inbox,
  Send as SendIcon,
  Archive,
  Plus,
  Folder,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Order, Product } from '../../types';
import { useNotification } from '../../context/NotificationContext';

/* ============================================================================
   1. TAILADMIN SUPPORT CHAT / MESSAGES VIEW
============================================================================ */
interface ChatMessage {
  id: string;
  sender: 'customer' | 'agent';
  text: string;
  time: string;
}

interface ChatConversation {
  id: string;
  name: string;
  role: string;
  orderRef?: string;
  unread: number;
  messages: ChatMessage[];
}

const INITIAL_CHATS: ChatConversation[] = [
  {
    id: 'chat-1',
    name: 'Tanvir Ahmed',
    role: 'Buyer · Gulshan-2, Dhaka',
    orderRef: 'SD-26-8891',
    unread: 1,
    messages: [
      {
        id: 'm1',
        sender: 'customer',
        text: 'Hello, I completed payment via bKash for SD-26-8891. Can you confirm Steadfast pickup time?',
        time: '10:12 AM'
      },
      {
        id: 'm2',
        sender: 'agent',
        text: 'Thank you Tanvir! Your EPS bKash payment is verified. Our Dhaka hub has packed your smartwatch & earbuds.',
        time: '10:15 AM'
      },
      {
        id: 'm3',
        sender: 'customer',
        text: 'Great! Please ask the rider to call me 15 minutes before reaching Road 113.',
        time: '10:18 AM'
      }
    ]
  },
  {
    id: 'chat-2',
    name: 'Samira Rahman',
    role: 'Buyer · Rajpara, Rajshahi',
    orderRef: 'SD-26-8892',
    unread: 0,
    messages: [
      {
        id: 'm4',
        sender: 'customer',
        text: 'Hi! Is Lumina Niacinamide batch seal intact before dispatch?',
        time: 'Yesterday'
      },
      {
        id: 'm5',
        sender: 'agent',
        text: 'Yes, batch code verified and sealed from our Rajshahi Hub. Tracking SD-TRK-44910 is already active.',
        time: 'Yesterday'
      }
    ]
  },
  {
    id: 'chat-3',
    name: 'Nusrat Jahan',
    role: 'Vendor Inquiry · Dhaka Loom House',
    unread: 0,
    messages: [
      {
        id: 'm6',
        sender: 'customer',
        text: 'Uploading restock inventory sheet for Heritage Jacquard Panjabi sizes L and XL.',
        time: '2 days ago'
      }
    ]
  }
];

export const SupportChatView: React.FC = () => {
  const { addToast } = useNotification();
  const [chats, setChats] = useState<ChatConversation[]>(INITIAL_CHATS);
  const [activeId, setActiveId] = useState<string>(INITIAL_CHATS[0].id);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');

  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chats.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.orderRef || '').toLowerCase().includes(q)
    );
  }, [chats, search]);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeId) || filteredChats[0] || null,
    [chats, filteredChats, activeId]
  );

  const handleSelectChat = (id: string) => {
    setActiveId(id);
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeChat) return;
    const nowLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              unread: 0,
              messages: [
                ...c.messages,
                { id: `msg-${Date.now()}`, sender: 'agent', text: draft.trim(), time: nowLabel }
              ]
            }
          : c
      )
    );
    setDraft('');
    addToast('Reply Sent', `Message delivered to ${activeChat.name}.`, 'success');
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden grid grid-cols-12 min-h-[560px]">
      {/* Left Conversation List */}
      <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#465FFF]" />
              <span>Messages</span>
            </h3>
            <span className="text-xs font-mono-num text-gray-500">{chats.length} threads</span>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or order..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs focus:outline-none focus:border-[#465FFF]"
            />
          </div>
        </div>

        <div className="flex-1 divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto">
          {filteredChats.map((c) => {
            const isSelected = activeChat?.id === c.id;
            const lastMsg = c.messages[c.messages.length - 1];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectChat(c.id)}
                className={`w-full text-left p-4 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#ECF3FF]/70 dark:bg-[#465FFF]/15'
                    : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {c.name}
                  </span>
                  <span className="text-[11px] font-mono-num text-gray-400 shrink-0">
                    {lastMsg?.time}
                  </span>
                </div>
                <p className="text-[11px] text-[#465FFF] dark:text-[#7592FF] mt-0.5 truncate">
                  {c.role} {c.orderRef ? `· ${c.orderRef}` : ''}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {lastMsg?.text}
                  </p>
                  {c.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#465FFF] text-white text-[10px] font-mono-num font-bold flex items-center justify-center shrink-0">
                      {c.unread}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Active Thread */}
      <div className="col-span-12 md:col-span-8 flex flex-col justify-between bg-gray-50/40 dark:bg-gray-950/30">
        {activeChat ? (
          <>
            <div className="px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#465FFF] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {activeChat.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {activeChat.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {activeChat.role} {activeChat.orderRef ? `· Order ${activeChat.orderRef}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[380px]">
              {activeChat.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'agent' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      m.sender === 'agent'
                        ? 'bg-[#465FFF] text-white'
                        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="mt-1 text-[10px] font-mono-num text-gray-400">{m.time}</span>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSend}
              className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Reply to ${activeChat.name}...`}
                className="flex-1 h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-xs focus:outline-none focus:border-[#465FFF]"
              />
              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="p-12 text-center text-xs text-gray-500">Select a conversation to view messages.</div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   2. TAILADMIN SUPPORT TICKETS VIEW
============================================================================ */
interface SupportTicket {
  id: string;
  subject: string;
  requester: string;
  category: 'Payment / EPS' | 'Courier Dispatch' | 'Warranty / Return' | 'Account';
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  notes: string;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-4091',
    subject: 'Verify corporate bank deposit reference for bulk order',
    requester: 'Mehedi Hasan · Sylhet',
    category: 'Payment / EPS',
    priority: 'high',
    status: 'open',
    createdAt: '2026-11-22 09:15',
    notes: 'Customer attached BRAC Bank deposit slip reference; awaiting finance verification.'
  },
  {
    id: 'TKT-4088',
    subject: 'Update delivery phone number before Steadfast rider dispatch',
    requester: 'Tanvir Ahmed · Dhaka',
    category: 'Courier Dispatch',
    priority: 'medium',
    status: 'in_progress',
    createdAt: '2026-11-21 16:40',
    notes: 'Assigned to Dhaka Uttara Hub dispatch desk.'
  },
  {
    id: 'TKT-4084',
    subject: 'Confirm 1-year Amazfit warranty registration on invoice',
    requester: 'Nabila Chowdhury · Chittagong',
    category: 'Warranty / Return',
    priority: 'low',
    status: 'resolved',
    createdAt: '2026-11-20 11:20',
    notes: 'Sent stamped tax invoice & serial warranty certificate via email.'
  }
];

export const SupportTicketsView: React.FC = () => {
  const { addToast } = useNotification();
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [statusFilter, setStatusFilter] = useState<'all' | SupportTicket['status']>('all');
  const [selectedId, setSelectedId] = useState<string>(INITIAL_TICKETS[0].id);
  const [noteInput, setNoteInput] = useState('');

  const filtered = useMemo(
    () => tickets.filter((t) => statusFilter === 'all' || t.status === statusFilter),
    [tickets, statusFilter]
  );

  const activeTicket = useMemo(
    () => tickets.find((t) => t.id === selectedId) || filtered[0] || null,
    [tickets, filtered, selectedId]
  );

  const updateTicketStatus = (id: string, status: SupportTicket['status']) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    addToast('Ticket Updated', `${id} marked as ${status.replace('_', ' ')}.`, 'success');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || !activeTicket) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === activeTicket.id ? { ...t, notes: noteInput.trim() } : t))
    );
    setNoteInput('');
    addToast('Resolution Note Saved', `Updated internal note for ${activeTicket.id}.`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-xs text-gray-500 dark:text-gray-400">Open Tickets</span>
          <h4 className="mt-2 text-2xl font-bold font-mono-num text-gray-900 dark:text-white">
            {tickets.filter((t) => t.status === 'open').length}
          </h4>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-xs text-gray-500 dark:text-gray-400">In Progress</span>
          <h4 className="mt-2 text-2xl font-bold font-mono-num text-[#465FFF]">
            {tickets.filter((t) => t.status === 'in_progress').length}
          </h4>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-xs text-gray-500 dark:text-gray-400">Resolved</span>
          <h4 className="mt-2 text-2xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
            {tickets.filter((t) => t.status === 'resolved').length}
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-7 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-[#465FFF]" />
              <span>Support Ticket Queue</span>
            </h3>
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900">
              {(['all', 'open', 'in_progress', 'resolved'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize cursor-pointer ${
                    statusFilter === s
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                  activeTicket?.id === t.id
                    ? 'border-[#465FFF] bg-[#ECF3FF]/60 dark:bg-[#465FFF]/15'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono-num font-bold text-[#465FFF]">{t.id}</span>
                  <span className="capitalize font-semibold text-gray-600 dark:text-gray-300">
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold text-gray-900 dark:text-white">{t.subject}</p>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  {t.requester} · {t.category} · {t.priority} priority
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
          {activeTicket ? (
            <>
              <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-mono-num font-bold text-[#465FFF]">
                  {activeTicket.id} · {activeTicket.createdAt}
                </span>
                <h4 className="mt-1 text-base font-bold text-gray-900 dark:text-white">
                  {activeTicket.subject}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activeTicket.requester} · {activeTicket.category}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-gray-700 dark:text-gray-300">
                  Resolution Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['open', 'in_progress', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateTicketStatus(activeTicket.id, st)}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold capitalize cursor-pointer ${
                        activeTicket.status === st
                          ? 'border-[#465FFF] bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/20'
                          : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Latest Agent Note</p>
                <p>{activeTicket.notes}</p>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-3">
                <textarea
                  rows={3}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add resolution note or dispatch update..."
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs focus:outline-none focus:border-[#465FFF]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold cursor-pointer"
                >
                  Update Ticket Note
                </button>
              </form>
            </>
          ) : (
            <p className="py-12 text-center text-xs text-gray-500">Select a ticket to inspect.</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   3. TAILADMIN EMAIL INBOX VIEW
============================================================================ */
interface EmailMessage {
  id: string;
  folder: 'inbox' | 'sent' | 'archive';
  from: string;
  email: string;
  subject: string;
  body: string;
  time: string;
  starred: boolean;
  unread: boolean;
}

const INITIAL_EMAILS: EmailMessage[] = [
  {
    id: 'em-1',
    folder: 'inbox',
    from: 'EPS Payment Settlement',
    email: 'settlements@eps.com.bd',
    subject: 'Daily Merchant Settlement Batch #BD-2026-1122 Cleared',
    body: 'Dear TheSteps Merchant Team,\n\nYour daily EPS settlement batch covering bKash, Nagad, and VISA transactions has been settled to your BRAC Bank corporate account.',
    time: '09:30 AM',
    starred: true,
    unread: true
  },
  {
    id: 'em-2',
    folder: 'inbox',
    from: 'Motion View Distribution',
    email: 'b2b@motionview-bd.com',
    subject: 'Amazfit Active Titanium Restock Shipment Dispatched',
    body: 'Hi Operations,\n\n25 units of WTCH-TIT-BLK and 15 units of WTCH-TIT-GRY have left our Gulshan depot for your Rajshahi & Uttara fulfillment hubs.',
    time: 'Yesterday',
    starred: false,
    unread: false
  },
  {
    id: 'em-3',
    folder: 'sent',
    from: 'TheSteps Support',
    email: 'support@thesteps.com.bd',
    subject: 'Tax Invoice SD-26-8892 & Steadfast Tracking',
    body: 'Hello Samira,\n\nPlease find your order confirmation and Steadfast tracking ID SD-TRK-44910 attached.',
    time: 'Nov 20',
    starred: false,
    unread: false
  }
];

export const EmailInboxView: React.FC = () => {
  const { addToast } = useNotification();
  const [emails, setEmails] = useState<EmailMessage[]>(INITIAL_EMAILS);
  const [folder, setFolder] = useState<'inbox' | 'starred' | 'sent' | 'archive'>('inbox');
  const [selectedId, setSelectedId] = useState<string>(INITIAL_EMAILS[0].id);
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const visibleEmails = useMemo(() => {
    if (folder === 'starred') return emails.filter((e) => e.starred);
    return emails.filter((e) => e.folder === folder);
  }, [emails, folder]);

  const activeEmail = useMemo(
    () => emails.find((e) => e.id === selectedId) || visibleEmails[0] || null,
    [emails, visibleEmails, selectedId]
  );

  const toggleStar = (id: string) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e)));
  };

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim()) return;
    const sentMsg: EmailMessage = {
      id: `em-${Date.now()}`,
      folder: 'sent',
      from: 'TheSteps Admin',
      email: composeTo.trim(),
      subject: composeSubject.trim(),
      body: composeBody.trim(),
      time: 'Just now',
      starred: false,
      unread: false
    };
    setEmails((prev) => [sentMsg, ...prev]);
    setIsComposing(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    setFolder('sent');
    setSelectedId(sentMsg.id);
    addToast('Email Sent', `Dispatched message to ${sentMsg.email}.`, 'success');
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden grid grid-cols-12 min-h-[540px]">
      {/* Left Folders */}
      <div className="col-span-12 lg:col-span-3 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 p-4 space-y-4">
        <button
          type="button"
          onClick={() => setIsComposing((p) => !p)}
          className="w-full py-2.5 px-4 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Compose Email</span>
        </button>

        <div className="space-y-1 text-xs">
          {[
            { id: 'inbox', label: 'Inbox', icon: Inbox },
            { id: 'starred', label: 'Starred', icon: Star },
            { id: 'sent', label: 'Sent', icon: SendIcon },
            { id: 'archive', label: 'Archive', icon: Archive }
          ].map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFolder(f.id as any);
                  setIsComposing(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium cursor-pointer ${
                  folder === f.id
                    ? 'bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{f.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle Message List */}
      <div className="col-span-12 lg:col-span-4 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto">
        {visibleEmails.length === 0 ? (
          <p className="p-8 text-center text-xs text-gray-500">No messages in {folder}.</p>
        ) : (
          visibleEmails.map((em) => (
            <div
              key={em.id}
              onClick={() => {
                setSelectedId(em.id);
                setIsComposing(false);
                setEmails((prev) =>
                  prev.map((x) => (x.id === em.id ? { ...x, unread: false } : x))
                );
              }}
              className={`p-4 cursor-pointer transition-colors ${
                activeEmail?.id === em.id && !isComposing
                  ? 'bg-[#ECF3FF]/60 dark:bg-[#465FFF]/15'
                  : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {em.from}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(em.id);
                  }}
                  className="text-gray-400 hover:text-amber-500 cursor-pointer"
                  aria-label="Toggle star"
                >
                  <Star className={`w-3.5 h-3.5 ${em.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
              </div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate mt-1">
                {em.subject}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {em.time} · {em.email}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Right Reader or Compose */}
      <div className="col-span-12 lg:col-span-5 p-5 sm:p-6">
        {isComposing ? (
          <form onSubmit={handleComposeSubmit} className="space-y-4 text-xs">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">New Email</h4>
            <input
              type="email"
              required
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              placeholder="Recipient email..."
              className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            />
            <input
              type="text"
              required
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder="Subject line..."
              className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            />
            <textarea
              rows={7}
              required
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder="Write your message..."
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white font-semibold cursor-pointer"
              >
                Send Message
              </button>
            </div>
          </form>
        ) : activeEmail ? (
          <div className="space-y-4">
            <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                {activeEmail.subject}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                From: {activeEmail.from} ({activeEmail.email}) · {activeEmail.time}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {activeEmail.body}
            </p>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setComposeTo(activeEmail.email);
                  setComposeSubject(`Re: ${activeEmail.subject}`);
                  setIsComposing(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#465FFF] text-white text-xs font-semibold cursor-pointer"
              >
                Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmails((prev) =>
                    prev.map((e) => (e.id === activeEmail.id ? { ...e, folder: 'archive' } : e))
                  );
                  addToast('Archived', 'Message moved to Archive.', 'info');
                }}
                className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold cursor-pointer"
              >
                Archive
              </button>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-gray-500">
            <Mail className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            Select an email to read.
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   4. TAILADMIN FILE MANAGER VIEW
============================================================================ */
interface FileManagerViewProps {
  products: Product[];
  orders: Order[];
  onPrintInvoice: (order: Order) => void;
}

export const FileManagerView: React.FC<FileManagerViewProps> = ({
  products,
  orders,
  onPrintInvoice
}) => {
  const { addToast } = useNotification();
  const [folderFilter, setFolderFilter] = useState<'all' | 'media' | 'invoices'>('all');
  const [customFiles, setCustomFiles] = useState<{ id: string; name: string; size: string; type: string }[]>([
    { id: 'doc-1', name: 'TheSteps-BIN-Certificate-2026.pdf', size: '420 KB', type: 'Compliance' },
    { id: 'doc-2', name: 'Steadfast-Courier-Rate-Card-BD.xlsx', size: '185 KB', type: 'Logistics' }
  ]);

  const handleUploadTrigger = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomFiles((prev) => [
      {
        id: `doc-${Date.now()}`,
        name: file.name,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        type: 'Uploaded'
      },
      ...prev
    ]);
    addToast('File Added', `${file.name} indexed in File Manager.`, 'success');
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Storage Summary + Upload */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1 max-w-md">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-900 dark:text-white">Cloud Storage Utilization</span>
            <span className="font-mono-num text-gray-500">1.84 GB / 10 GB</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div className="h-full rounded-full bg-[#465FFF]" style={{ width: '18.4%' }} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-900">
            {(['all', 'media', 'invoices'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFolderFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize cursor-pointer ${
                  folderFilter === f
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <label className="px-4 py-2 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Upload File</span>
            <input type="file" onChange={handleUploadTrigger} className="sr-only" />
          </label>
        </div>
      </div>

      {/* Folders Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => setFolderFilter('media')}
          className="text-left rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:border-[#465FFF] transition-colors cursor-pointer"
        >
          <Folder className="w-8 h-8 text-[#465FFF] mb-3" />
          <p className="text-sm font-bold text-gray-900 dark:text-white">Product Catalog Media</p>
          <p className="text-xs font-mono-num text-gray-500 mt-1">{products.length} product assets</p>
        </button>

        <button
          type="button"
          onClick={() => setFolderFilter('invoices')}
          className="text-left rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:border-[#465FFF] transition-colors cursor-pointer"
        >
          <FileText className="w-8 h-8 text-emerald-500 mb-3" />
          <p className="text-sm font-bold text-gray-900 dark:text-white">Order Tax Invoices</p>
          <p className="text-xs font-mono-num text-gray-500 mt-1">{orders.length} generated receipts</p>
        </button>

        <button
          type="button"
          onClick={() => setFolderFilter('all')}
          className="text-left rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:border-[#465FFF] transition-colors cursor-pointer"
        >
          <Clock className="w-8 h-8 text-amber-500 mb-3" />
          <p className="text-sm font-bold text-gray-900 dark:text-white">Compliance &amp; Docs</p>
          <p className="text-xs font-mono-num text-gray-500 mt-1">{customFiles.length} merchant documents</p>
        </button>
      </div>

      {/* Files Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Indexed Files &amp; Assets</h3>
        <div className="overflow-x-auto">
          <table className="min-w-[540px] w-full text-left text-xs">
            <thead>
              <tr className="border-y border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                <th className="py-2.5 pr-3 font-medium">File Name</th>
                <th className="py-2.5 px-3 font-medium">Category</th>
                <th className="py-2.5 px-3 font-medium">Reference</th>
                <th className="py-2.5 pl-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {folderFilter !== 'invoices' &&
                products.slice(0, 6).map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-3 flex items-center gap-2.5 font-semibold text-gray-900 dark:text-white">
                      <ImageIcon className="w-4 h-4 text-[#465FFF] shrink-0" />
                      <span className="truncate max-w-[260px]">{p.slug}.jpg</span>
                    </td>
                    <td className="py-3 px-3 text-gray-500">Product Image</td>
                    <td className="py-3 px-3 font-mono-num text-gray-500">{p.sku}</td>
                    <td className="py-3 pl-3 text-right">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    </td>
                  </tr>
                ))}

              {folderFilter !== 'media' &&
                orders.map((ord) => (
                  <tr key={ord.id}>
                    <td className="py-3 pr-3 flex items-center gap-2.5 font-semibold text-gray-900 dark:text-white">
                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Invoice-{ord.orderNumber}.html</span>
                    </td>
                    <td className="py-3 px-3 text-gray-500">Tax Invoice</td>
                    <td className="py-3 px-3 font-mono-num text-gray-500">
                      ৳{ord.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() => onPrintInvoice(ord)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#465FFF] hover:underline cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Open / Print</span>
                      </button>
                    </td>
                  </tr>
                ))}

              {folderFilter === 'all' &&
                customFiles.map((cf) => (
                  <tr key={cf.id}>
                    <td className="py-3 pr-3 flex items-center gap-2.5 font-semibold text-gray-900 dark:text-white">
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{cf.name}</span>
                    </td>
                    <td className="py-3 px-3 text-gray-500">{cf.type}</td>
                    <td className="py-3 px-3 font-mono-num text-gray-500">{cf.size}</td>
                    <td className="py-3 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() => setCustomFiles((prev) => prev.filter((x) => x.id !== cf.id))}
                        className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
