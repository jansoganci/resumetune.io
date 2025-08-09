/**
 * Invoice Preview Modal Component
 * 
 * Displays invoice details in a modal overlay following design guardrails.
 * Uses consistent colors, spacing, and responsive design patterns.
 */

import React from 'react';
import { XIcon, DownloadIcon, MailIcon } from 'lucide-react';
import { UIInvoice as Invoice } from '../types';

interface InvoicePreviewModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (invoice: Invoice) => void;
  onResendEmail: (invoice: Invoice) => void;
}

export default function InvoicePreviewModal({ 
  invoice, 
  isOpen, 
  onClose, 
  onDownload, 
  onResendEmail 
}: InvoicePreviewModalProps) {
  if (!isOpen || !invoice) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-sm max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-6 space-y-6">
          {/* Invoice Header */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">ResumeTune</h3>
                <p className="text-xs text-gray-600">AI-powered career tools</p>
              </div>
              <div className="text-right">
                <h4 className="text-lg font-semibold text-gray-900">Invoice</h4>
                <p className="text-gray-600 font-mono text-xs">{invoice.id}</p>
                <p className="text-gray-600 text-xs">{formatDate(invoice.date)}</p>
              </div>
            </div>
          </div>

          {/* Invoice Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-1">Bill To:</label>
                <p className="text-gray-600">{invoice.customerEmail || 'customer@example.com'}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-1">Product:</label>
                <p className="text-gray-600">{invoice.productName}</p>
              </div>
              
              {invoice.creditsDelivered && (
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-1">Credits Delivered:</label>
                  <p className="text-gray-600">{invoice.creditsDelivered} AI credits</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-1">Payment Method:</label>
                <p className="text-gray-600">Credit Card (Stripe)</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-1">Status:</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-blue-600 text-white rounded-lg p-6 text-center">
            <p className="text-xs uppercase tracking-wide opacity-90 mb-2">Total Amount Paid</p>
            <p className="text-2xl font-bold">${invoice.amount} {invoice.currency}</p>
          </div>

          {/* Thank You Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-amber-800 font-medium">Thank you for choosing ResumeTune!</p>
            <p className="text-amber-800 text-xs mt-1">
              Your credits have been successfully added to your account and are ready to use.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => onDownload(invoice)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <DownloadIcon className="w-4 h-4" />
            Download PDF
          </button>
          
          <button
            onClick={() => onResendEmail(invoice)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <MailIcon className="w-4 h-4" />
            Resend Email
          </button>
          
          <button
            onClick={onClose}
            className="flex items-center justify-center px-4 py-2 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
