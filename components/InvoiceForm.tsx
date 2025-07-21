import React from 'react';
import { Invoice, LineItem } from '../types';
import { PlusIcon, TrashIcon, UploadIcon, SaveIcon, DownloadIcon, SparklesIcon } from './ui/Icons';

interface InvoiceFormProps {
    invoice: Invoice;
    onInvoiceChange: <K extends keyof Invoice>(key: K, value: Invoice[K]) => void;
    onItemChange: <K extends keyof LineItem>(index: number, key: K, value: LineItem[K]) => void;
    onAddItem: () => void;
    onRemoveItem: (index: number) => void;
    logo: string | null;
    setLogo: (logo: string | null) => Promise<void>;
    onSave: () => void;
    onDownload: () => void;
    onGenerateSummary: () => void;
    isGeneratingSummary: boolean;
}

const InputField: React.FC<{ label: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; type?: string; placeholder?: string; area?: boolean }> = ({ label, value, onChange, type = 'text', placeholder, area = false }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        {area ? (
            <textarea value={value} onChange={onChange} placeholder={placeholder} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" rows={3}></textarea>
        ) : (
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
        )}
    </div>
);

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onInvoiceChange, onItemChange, onAddItem, onRemoveItem, logo, setLogo, onSave, onDownload, onGenerateSummary, isGeneratingSummary }) => {

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setLogo(event.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    return (
        <div className="p-6 bg-white rounded-xl shadow-lg space-y-6">
            
            <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-slate-700">Invoice Editor</h2>
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={onGenerateSummary}
                        disabled={isGeneratingSummary || !invoice.patientName || invoice.items.length === 0}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                        aria-label="Generate AI Summary for Notes"
                    >
                        <SparklesIcon />
                        {isGeneratingSummary ? 'Generating...' : 'AI Summary'}
                    </button>
                    <button onClick={onSave} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"><SaveIcon/> Save</button>
                    <button onClick={onDownload} className="flex items-center gap-2 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"><DownloadIcon/> Download</button>
                </div>
            </div>

            {/* Clinic & Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <InputField label="Invoice Number" value={invoice.invoiceNumber} onChange={e => onInvoiceChange('invoiceNumber', e.target.value)} />
                <InputField label="Date" type="date" value={invoice.date} onChange={e => onInvoiceChange('date', e.target.value)} />
                <InputField label="Clinic Name" value={invoice.clinicName} onChange={e => onInvoiceChange('clinicName', e.target.value)} />
                <InputField label="Clinic Address" value={invoice.clinicAddress} onChange={e => onInvoiceChange('clinicAddress', e.target.value)} />
                <div>
                     <label className="block text-sm font-medium text-slate-600 mb-1">Clinic Logo</label>
                    <label htmlFor="logo-upload" className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                        <UploadIcon/> {logo ? 'Change Logo' : 'Upload Logo'}
                    </label>
                    <input id="logo-upload" type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                </div>
            </div>

            {/* Patient Details */}
            <div className="border-t pt-4">
                 <h3 className="text-lg font-semibold text-slate-700 mb-2">Bill To</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Patient Name" value={invoice.patientName} onChange={e => onInvoiceChange('patientName', e.target.value)} placeholder="e.g. John Doe"/>
                    <InputField label="Patient Contact Number" value={invoice.patientContact} onChange={e => onInvoiceChange('patientContact', e.target.value)} placeholder="e.g. (555) 123-4567" />
                    <div className="md:col-span-2">
                        <InputField label="Patient Address" value={invoice.patientAddress} onChange={e => onInvoiceChange('patientAddress', e.target.value)} placeholder="e.g. 456 Patient Ave"/>
                    </div>
                </div>
            </div>
            
            {/* Items */}
            <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Services</h3>
                <div className="space-y-3">
                    {invoice.items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-6">
                                <input type="text" placeholder="Service Description" value={item.description} onChange={e => onItemChange(index, 'description', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                            </div>
                            <div className="col-span-2">
                                <input type="number" placeholder="Qty" value={item.quantity} onChange={e => onItemChange(index, 'quantity', parseFloat(e.target.value))} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                            </div>
                            <div className="col-span-3">
                                <input type="number" placeholder="Price" value={item.price} onChange={e => onItemChange(index, 'price', parseFloat(e.target.value))} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                            </div>
                            <div className="col-span-1">
                                <button onClick={() => onRemoveItem(index)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"><TrashIcon/></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={onAddItem} className="mt-4 flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
                    <PlusIcon />
                    Add Service
                </button>
            </div>

            {/* Notes & Tax */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                 <InputField label="Notes" area={true} value={invoice.notes} onChange={e => onInvoiceChange('notes', e.target.value)} />
                 <InputField label="Tax Rate (%)" type="number" value={invoice.taxRate} onChange={e => onInvoiceChange('taxRate', parseFloat(e.target.value) || 0)} />
            </div>

        </div>
    );
};

export default InvoiceForm;