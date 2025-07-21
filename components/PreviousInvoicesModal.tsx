
import React from 'react';
import { Invoice } from '../types';
import { CloseIcon, TrashIcon } from './ui/Icons';

interface PreviousInvoicesModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoices: Invoice[];
    onLoad: (invoice: Invoice) => void;
    onDelete: (invoiceNumber: string) => void;
}

const PreviousInvoicesModal: React.FC<PreviousInvoicesModalProps> = ({ isOpen, onClose, invoices, onLoad, onDelete }) => {
    if (!isOpen) return null;

    const sortedInvoices = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-5 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Past Invoices</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-600">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-5 overflow-y-auto">
                    {sortedInvoices.length > 0 ? (
                        <ul className="space-y-3">
                            {sortedInvoices.map((invoice) => (
                                <li key={invoice.invoiceNumber} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-primary">{invoice.invoiceNumber}</p>
                                        <p className="text-sm text-slate-500">
                                            {invoice.patientName} - {new Date(invoice.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => onLoad(invoice)}
                                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                        >
                                            Load
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
                                                    onDelete(invoice.invoiceNumber);
                                                }
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-slate-500">No saved invoices found.</p>
                            <p className="text-sm text-slate-400 mt-2">Create and save an invoice to see it here.</p>
                        </div>
                    )}
                </div>
                <div className="p-5 border-t text-right">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreviousInvoicesModal;
