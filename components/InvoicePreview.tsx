import React from 'react';
import { Invoice } from '../types';

interface InvoicePreviewProps {
    invoice: Invoice;
    logo: string | null;
    subtotal: number;
    taxAmount: number;
    total: number;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, logo, subtotal, taxAmount, total }) => {
    
    const currencyFormatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    });

    return (
        <div className="sticky top-8">
            <h2 className="text-xl font-bold text-slate-700 mb-4">Invoice Preview</h2>
            <div id="invoice-preview" className="bg-white p-10 rounded-xl shadow-lg border border-slate-100">
                <header className="flex justify-between items-start pb-6 border-b-2 border-slate-200">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">{invoice.clinicName || 'Your Clinic Name'}</h1>
                        <p className="text-slate-500 mt-1">{invoice.clinicAddress || '123 Health St, Wellness City'}</p>
                    </div>
                    {logo ? (
                        <img src={logo} alt="Clinic Logo" className="max-h-20 max-w-[200px] object-contain" />
                    ) : (
                        <div className="w-32 h-20 bg-slate-100 flex items-center justify-center text-slate-400 text-sm rounded">
                            Your Logo
                        </div>
                    )}
                </header>

                <section className="grid grid-cols-2 gap-8 mt-8">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Bill To</h3>
                        <p className="text-lg font-semibold text-slate-700 mt-1">{invoice.patientName || 'Patient Name'}</p>
                        <p className="text-slate-500">{invoice.patientAddress || 'Patient Address'}</p>
                        {invoice.patientContact && <p className="text-slate-500">{invoice.patientContact}</p>}
                    </div>
                    <div className="text-right">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Invoice Details</h3>
                        <p className="text-slate-700 mt-1"><span className="font-semibold">Invoice #:</span> {invoice.invoiceNumber}</p>
                        <p className="text-slate-700"><span className="font-semibold">Date:</span> {invoice.date}</p>
                    </div>
                </section>

                <section className="mt-10">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="p-3 text-sm font-semibold text-slate-600 uppercase rounded-l-lg">Service</th>
                                <th className="p-3 text-center text-sm font-semibold text-slate-600 uppercase">Qty</th>
                                <th className="p-3 text-right text-sm font-semibold text-slate-600 uppercase">Price</th>
                                <th className="p-3 text-right text-sm font-semibold text-slate-600 uppercase rounded-r-lg">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map(item => (
                                <tr key={item.id} className="border-b border-slate-100">
                                    <td className="p-3">{item.description || 'Service Description'}</td>
                                    <td className="p-3 text-center">{item.quantity}</td>
                                    <td className="p-3 text-right">{currencyFormatter.format(item.price)}</td>
                                    <td className="p-3 text-right">{currencyFormatter.format(item.quantity * item.price)}</td>
                                </tr>
                            ))}
                             {invoice.items.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center p-8 text-slate-400">No services added yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>

                <section className="grid grid-cols-2 mt-8">
                    <div className="text-slate-500">
                        <h4 className="font-semibold mb-1">Notes</h4>
                        <p className="text-sm">{invoice.notes}</p>
                    </div>
                    <div className="text-right space-y-2">
                        <div className="flex justify-end items-center gap-4">
                            <span className="font-semibold text-slate-600">Subtotal:</span>
                            <span className="w-28">{currencyFormatter.format(subtotal)}</span>
                        </div>
                         <div className="flex justify-end items-center gap-4">
                            <span className="font-semibold text-slate-600">Tax ({invoice.taxRate}%):</span>
                            <span className="w-28">{currencyFormatter.format(taxAmount)}</span>
                        </div>
                        <div className="flex justify-end items-center gap-4 border-t border-slate-200 pt-2 mt-2">
                            <span className="font-bold text-lg text-slate-800">Total:</span>
                            <span className="w-28 font-bold text-lg">{currencyFormatter.format(total)}</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default InvoicePreview;