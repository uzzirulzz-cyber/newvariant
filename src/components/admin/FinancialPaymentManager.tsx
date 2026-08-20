import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  Smartphone,
  Bitcoin,
  RefreshCw,
  Download,
  Filter,
  Check,
  X
} from 'lucide-react';

interface Transaction {
  id: string;
  orderId: string;
  gateway: 'jazzcash' | 'easypaisa' | 'stripe' | 'lemonsqueezy' | 'bank_transfer' | 'crypto_usdt';
  amount: number;
  fee: number;
  net: number;
  currency: string;
  customer: string;
  status: 'settled' | 'pending_verification' | 'disputed' | 'refunded';
  proofUrl?: string;
  createdAt: string;
}

export const FinancialPaymentManager: React.FC = () => {
  const { formatPrice, addToast } = useStore();

  const [activeGatewayTab, setActiveGatewayTab] = useState<'all' | 'pakistan' | 'international' | 'crypto'>('all');
  const [selectedProof, setSelectedProof] = useState<Transaction | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-9941',
      orderId: 'ORD-1095',
      gateway: 'jazzcash',
      amount: 499.99,
      fee: 4.99,
      net: 495.00,
      currency: 'USD (PKR Eqv)',
      customer: 'bilal.khan@cyber.pk',
      status: 'pending_verification',
      proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      createdAt: '2026-08-20T11:45:00Z'
    },
    {
      id: 'tx-9940',
      orderId: 'ORD-1094',
      gateway: 'stripe',
      amount: 89.99,
      fee: 2.91,
      net: 87.08,
      currency: 'USD',
      customer: 'damian.t@outlook.com',
      status: 'settled',
      createdAt: '2026-08-20T08:12:00Z'
    },
    {
      id: 'tx-9939',
      orderId: 'ORD-1093',
      gateway: 'crypto_usdt',
      amount: 140.00,
      fee: 1.00,
      net: 139.00,
      currency: 'USDT (TRC20)',
      customer: '0x9a8f...4e12',
      status: 'settled',
      createdAt: '2026-08-19T21:30:00Z'
    },
    {
      id: 'tx-9938',
      orderId: 'ORD-1092',
      gateway: 'easypaisa',
      amount: 29.99,
      fee: 0.30,
      net: 29.69,
      currency: 'USD (PKR Eqv)',
      customer: 'alex.rivers@gmail.com',
      status: 'settled',
      createdAt: '2026-08-19T14:32:00Z'
    },
    {
      id: 'tx-9937',
      orderId: 'ORD-1091',
      gateway: 'lemonsqueezy',
      amount: 49.99,
      fee: 2.75,
      net: 47.24,
      currency: 'USD',
      customer: 'sophie.m@designstudio.io',
      status: 'settled',
      createdAt: '2026-08-18T16:00:00Z'
    }
  ]);

  const handleApproveTransaction = (txId: string) => {
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'settled' } : t));
    setSelectedProof(null);
    addToast('success', 'Payment Verified & Settled', 'Funds cleared and automated digital delivery dispatched.');
  };

  const handleRejectTransaction = (txId: string) => {
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'disputed' } : t));
    setSelectedProof(null);
    addToast('error', 'Payment Flagged', 'Manual receipt rejected. Customer notified via email/SMS.');
  };

  const totalGross = transactions.filter(t => t.status === 'settled').reduce((sum, t) => sum + t.amount, 0);
  const totalFees = transactions.filter(t => t.status === 'settled').reduce((sum, t) => sum + t.fee, 0);
  const netProfit = totalGross - totalFees;
  const pendingVerification = transactions.filter(t => t.status === 'pending_verification').reduce((sum, t) => sum + t.amount, 0);

  const getGatewayBadge = (gw: Transaction['gateway']) => {
    switch (gw) {
      case 'jazzcash':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF304F]/15 text-[#FF304F] border border-[#FF304F]/30">JazzCash Auto</span>;
      case 'easypaisa':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D99A]/15 text-[#00D99A] border border-[#00D99A]/30">Easypaisa</span>;
      case 'stripe':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1769FF]/15 text-[#287BFF] border border-[#1769FF]/30">Stripe CC</span>;
      case 'lemonsqueezy':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFC928]/15 text-[#FFC928] border border-[#FFC928]/30">Lemon Squeezy</span>;
      case 'crypto_usdt':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">Crypto USDT</span>;
      case 'bank_transfer':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-700/50 text-slate-300 border border-slate-600">Bank Wire (IBAN)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#10182A] border border-[#26334A] shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-[#1769FF] text-xs font-mono font-bold uppercase tracking-widest mb-1">
            <DollarSign className="w-4 h-4 text-[#00D99A]" />
            <span>Financial Balance & Multi-Gateway Reconciliation</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Payment Gateways & Ledger Center</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live multi-currency reconciliation for JazzCash, Easypaisa, Stripe, Lemon Squeezy, Bank Wire, and TRC20 Crypto.
          </p>
        </div>

        <button
          onClick={() => addToast('info', 'Ledger Exported', 'CSV statement generated for accounting.')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl btn-secondary text-xs text-slate-200 hover:text-white"
        >
          <Download className="w-4 h-4" />
          <span>Export Ledger (CSV)</span>
        </button>
      </div>

      {/* FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#10182A] border border-[#26334A]">
          <div className="text-xs text-slate-400 font-mono uppercase">Settled Gross Volume</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{formatPrice(totalGross)}</div>
          <div className="text-[11px] text-[#00D99A] mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+18.4% this week</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#10182A] border border-[#00D99A]/30">
          <div className="text-xs text-[#00D99A] font-mono uppercase">Net Profit Margin</div>
          <div className="text-2xl font-bold text-[#00D99A] font-mono mt-1">{formatPrice(netProfit)}</div>
          <div className="text-[11px] text-slate-400 mt-1">96.8% Average Efficiency</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#10182A] border border-[#FFC928]/30">
          <div className="text-xs text-[#FFC928] font-mono uppercase">Pending Proofs / In Escrow</div>
          <div className="text-2xl font-bold text-[#FFC928] font-mono mt-1">{formatPrice(pendingVerification)}</div>
          <div className="text-[11px] text-[#FFC928] mt-1">1 manual proof awaiting review</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#10182A] border border-[#26334A]">
          <div className="text-xs text-slate-400 font-mono uppercase">Gateway Processing Fees</div>
          <div className="text-2xl font-bold text-slate-300 font-mono mt-1">{formatPrice(totalFees)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Automated tax withholding applied</div>
        </div>
      </div>

      {/* GATEWAY CONNECTION STATUS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { name: 'JazzCash Direct', status: 'Active (Instant API)', fee: '1.2%', color: 'border-[#FF304F]/40' },
          { name: 'Easypaisa QR', status: 'Active (Direct Merchant)', fee: '1.0%', color: 'border-[#00D99A]/40' },
          { name: 'Stripe Global', status: 'Active (TLS 1.3 Verified)', fee: '2.9% + $0.30', color: 'border-[#1769FF]/40' },
          { name: 'Lemon Squeezy', status: 'Active (MoR Auto-Tax)', fee: '5.0% + $0.50', color: 'border-[#FFC928]/40' },
          { name: 'Crypto USDT TRC20', status: 'Active (Hot Wallet)', fee: '$1.00 Flat', color: 'border-purple-500/40' }
        ].map((gw, i) => (
          <div key={i} className={`p-3 rounded-xl bg-[#10182A] border ${gw.color}`}>
            <div className="text-xs font-bold text-white truncate">{gw.name}</div>
            <div className="text-[10px] text-[#00D99A] font-mono mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D99A] animate-pulse" />
              <span>{gw.status}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Fee: {gw.fee}</div>
          </div>
        ))}
      </div>

      {/* TRANSACTIONS RECONCILIATION TABLE */}
      <div className="rounded-2xl bg-[#10182A] border border-[#26334A] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#26334A] flex items-center justify-between">
          <div className="font-bold text-white text-sm uppercase tracking-wider font-mono">
            Recent Multi-Gateway Transactions
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time sync</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#08152F] border-b border-[#26334A] text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Transaction / Order</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Gross Amount</th>
                <th className="py-3 px-4">Gateway Fee</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26334A]/50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#121C30] transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <div className="font-bold text-white">{tx.orderId}</div>
                    <div className="text-[10px] text-slate-500">{tx.id}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    {getGatewayBadge(tx.gateway)}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {formatPrice(tx.amount)}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    -{formatPrice(tx.fee)}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-[#00D99A]">
                    {formatPrice(tx.net)}
                  </td>

                  <td className="py-3.5 px-4 text-slate-300 truncate max-w-xs">
                    {tx.customer}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      tx.status === 'settled'
                        ? 'bg-[#00D99A]/15 text-[#00D99A] border border-[#00D99A]/30'
                        : tx.status === 'pending_verification'
                        ? 'bg-[#FFC928]/15 text-[#FFC928] border border-[#FFC928]/30 animate-pulse'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}>
                      {tx.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {tx.status === 'pending_verification' && tx.proofUrl ? (
                      <button
                        onClick={() => setSelectedProof(tx)}
                        className="px-3 py-1 rounded-lg bg-[#FFC928]/20 text-[#FFC928] hover:bg-[#FFC928]/30 border border-[#FFC928]/40 text-xs font-bold"
                      >
                        Review Receipt
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-500">Auto-Reconciled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROOF REVIEW MODAL */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#10182A] border border-[#26334A] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#26334A] pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Manual Payment Proof Review</h3>
                <div className="text-xs text-slate-400 font-mono">Order {selectedProof.orderId} • {formatPrice(selectedProof.amount)}</div>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-[#26334A] max-h-60 bg-black flex items-center justify-center">
                <img src={selectedProof.proofUrl} alt="Payment Receipt" className="object-contain max-h-60 w-full" />
              </div>
              <div className="text-xs text-slate-300 bg-[#08152F] p-3 rounded-xl border border-[#26334A] space-y-1 font-mono">
                <div>Customer: {selectedProof.customer}</div>
                <div>Gateway: {selectedProof.gateway.toUpperCase()}</div>
                <div>Submitted At: {new Date(selectedProof.createdAt).toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleRejectTransaction(selectedProof.id)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-950/40 text-[#FF304F] border border-[#FF304F]/40 hover:bg-[#FF304F]/20 text-xs font-bold"
              >
                <X className="w-4 h-4" />
                <span>Reject Proof</span>
              </button>
              <button
                onClick={() => handleApproveTransaction(selectedProof.id)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#00D99A]/20 text-[#00D99A] border border-[#00D99A]/40 hover:bg-[#00D99A]/30 text-xs font-bold"
              >
                <Check className="w-4 h-4" />
                <span>Approve & Deliver</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
