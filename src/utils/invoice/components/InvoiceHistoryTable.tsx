/**
 * Invoice History Table Component
 * 
 * Displays a clean, sortable table of user invoices following design guardrails.
 * Uses Tailwind utilities with neutral/brand colors, consistent spacing, and mobile-friendly design.
 */

import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, EyeIcon, DownloadIcon } from 'lucide-react';
import { UIInvoice as Invoice } from '../types';

interface InvoiceHistoryTableProps {
  onViewInvoice: (invoice: Invoice) => void;
  onDownloadInvoice: (invoice: Invoice) => void;
}

// Mock data - will be replaced with real API call
const mockInvoices: Invoice[] = [
  {
    id: 'INV-1703123456789',
    date: '2025-08-09',
    amount: '9.00',
    currency: 'USD',
    productName: '50 Credits',
    status: 'paid'
  },
  {
    id: 'INV-1703123456790',
    date: '2025-08-01', 
    amount: '19.00',
    currency: 'USD',
    productName: '200 Credits',
    status: 'paid'
  },
  {
    id: 'INV-1703123456791',
    date: '2025-07-15',
    amount: '9.00',
    currency: 'USD',
    productName: 'Pro Monthly',
    status: 'paid'
  }
];

type SortField = 'date' | 'amount' | 'productName';
type SortDirection = 'asc' | 'desc';

export default function InvoiceHistoryTable({ onViewInvoice, onDownloadInvoice }: InvoiceHistoryTableProps) {
  const [invoices] = useState<Invoice[]>(mockInvoices); // TODO: Replace with API call
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    let aValue: string | number = a[sortField];
    let bValue: string | number = b[sortField];
    
    if (sortField === 'amount') {
      aValue = parseFloat(a.amount);
      bValue = parseFloat(b.amount);
    }
    
    if (sortField === 'date') {
      aValue = new Date(a.date).getTime();
      bValue = new Date(b.date).getTime();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'failed':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-gray-900 font-semibold hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUpIcon className="w-4 h-4" />
        ) : (
          <ChevronDownIcon className="w-4 h-4" />
        )
      ) : (
        <ChevronUpIcon className="w-4 h-4 opacity-30" />
      )}
    </button>
  );

  if (invoices.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No invoices found.</p>
        <p className="text-xs text-gray-600 mt-2">Invoices will appear here after your first purchase.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <SortButton field="date">Date</SortButton>
              </th>
              <th className="px-6 py-3 text-left">Invoice ID</th>
              <th className="px-6 py-3 text-left">
                <SortButton field="productName">Product</SortButton>
              </th>
              <th className="px-6 py-3 text-left">
                <SortButton field="amount">Amount</SortButton>
              </th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-900">{formatDate(invoice.date)}</td>
                <td className="px-6 py-4 text-gray-600 font-mono text-xs">{invoice.id}</td>
                <td className="px-6 py-4 text-gray-900">{invoice.productName}</td>
                <td className="px-6 py-4 text-gray-900 font-medium">
                  ${invoice.amount} {invoice.currency}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewInvoice(invoice)}
                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="View Invoice"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDownloadInvoice(invoice)}
                      className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="Download PDF"
                    >
                      <DownloadIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {sortedInvoices.map((invoice) => (
          <div key={invoice.id} className="border-b border-gray-200 p-4 last:border-b-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-gray-900 font-medium">{invoice.productName}</p>
                <p className="text-xs text-gray-600 font-mono">{invoice.id}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-900 font-medium">${invoice.amount} {invoice.currency}</p>
                <p className="text-xs text-gray-600">{formatDate(invoice.date)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewInvoice(invoice)}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="View Invoice"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDownloadInvoice(invoice)}
                  className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Download PDF"
                >
                  <DownloadIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
