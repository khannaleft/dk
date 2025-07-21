
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Invoice, LineItem } from './types';
import { INITIAL_INVOICE } from './constants';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import PreviousInvoicesModal from './components/PreviousInvoicesModal';
import { HistoryIcon } from './components/ui/Icons';
import { GoogleGenAI } from '@google/genai';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';


// Declare global variables from CDN scripts
declare const jspdf: any;
declare const html2canvas: any;

function App(): React.ReactNode {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice>(INITIAL_INVOICE);
  const [logo, setLogo] = useState<string | null>(null);
  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('id, user_id, invoiceNumber, date, clinicName, clinicAddress, patientName, patientAddress, patientContact, items, notes, taxRate')
            .eq('user_id', userId);

        if (invoicesError) throw invoicesError;
        setSavedInvoices(invoices || []);

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('logo')
            .eq('id', userId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') { // Ignore 'missing row' error
           throw profileError;
        }
        setLogo(profile?.logo || null);

    } catch(error: any) {
        const errorMessage = error?.message || JSON.stringify(error);
        console.error("Error fetching data:", error);
        alert(`Error fetching data: ${errorMessage}\n\nThis might be a CORS issue. Please ensure your app's URL is added to the CORS origins in your Supabase project settings (Settings > API).`);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
        fetchData(session.user.id);
    } else {
        // Clear data when user logs out
        setSavedInvoices([]);
        setLogo(null);
        setInvoice(INITIAL_INVOICE);
    }
  }, [session, fetchData]);

  const subtotal = useMemo(() => {
    return invoice.items.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
  }, [invoice.items]);

  const taxAmount = useMemo(() => {
    return subtotal * (invoice.taxRate / 100);
  }, [subtotal, invoice.taxRate]);

  const total = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const handleInvoiceChange = useCallback(<K extends keyof Invoice>(key: K, value: Invoice[K]) => {
    setInvoice(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleItemChange = useCallback(<K extends keyof LineItem>(index: number, key: K, value: LineItem[K]) => {
    const newItems = [...invoice.items];
    newItems[index] = { ...newItems[index], [key]: value };
    handleInvoiceChange('items', newItems);
  }, [invoice.items, handleInvoiceChange]);

  const handleAddItem = useCallback(() => {
    const newItem: LineItem = { id: Date.now(), description: '', quantity: 1, price: 0 };
    handleInvoiceChange('items', [...invoice.items, newItem]);
  }, [invoice.items, handleInvoiceChange]);

  const handleRemoveItem = useCallback((index: number) => {
    const newItems = invoice.items.filter((_, i) => i !== index);
    handleInvoiceChange('items', newItems);
  }, [invoice.items, handleInvoiceChange]);

  const handleDownloadPdf = useCallback(() => {
    const input = document.getElementById('invoice-preview');
    if (input) {
      html2canvas(input, { scale: 2, useCORS: true, logging: false }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        const imgWidth = pdfWidth;
        const imgHeight = imgWidth / ratio;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        while (heightLeft > 0) {
          position -= pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
        pdf.save(`invoice-${invoice.invoiceNumber || 'draft'}.pdf`);
      });
    }
  }, [invoice.invoiceNumber]);
  
  const handleSaveInvoice = useCallback(async () => {
    if (!session?.user) {
        alert("You must be logged in to save an invoice.");
        return;
    }
    if (!invoice.patientName || invoice.items.length === 0) {
        alert('Patient name and at least one service are required to save.');
        return;
    }
    const newInvoice = { 
        ...invoice, 
        user_id: session.user.id,
        date: new Date().toISOString().split('T')[0] 
    };
    
    // Explicitly select columns to ensure data consistency
    const { data, error } = await supabase
        .from('invoices')
        .upsert(newInvoice, { onConflict: 'user_id,"invoiceNumber"' })
        .select('id, user_id, invoiceNumber, date, clinicName, clinicAddress, patientName, patientAddress, patientContact, items, notes, taxRate')
        .single();
    
    if (error) {
        const errorMessage = error?.message || JSON.stringify(error);
        console.error("Error saving invoice:", error);
        alert(`Failed to save invoice: ${errorMessage}`);
        return;
    }

    if(data) {
        setInvoice(data);
        const existingIndex = savedInvoices.findIndex(inv => inv.invoiceNumber === data.invoiceNumber);
        let updatedInvoices;
        if (existingIndex > -1) {
            updatedInvoices = [...savedInvoices];
            updatedInvoices[existingIndex] = data;
        } else {
            updatedInvoices = [...savedInvoices, data];
        }
        setSavedInvoices(updatedInvoices);
        alert(`Invoice ${data.invoiceNumber} has been saved.`);
    }

  }, [invoice, savedInvoices, session]);

  const handleSetLogo = useCallback(async (newLogo: string | null) => {
    if(!session?.user) return;
    setLogo(newLogo);
    const { error } = await supabase.from('profiles').upsert({ id: session.user.id, logo: newLogo });
    if(error) {
        const errorMessage = error?.message || JSON.stringify(error);
        console.error("Error saving logo:", error);
        alert(`Could not save your logo: ${errorMessage}`);
    }
  }, [session]);

  const handleLoadInvoice = useCallback((loadedInvoice: Invoice) => {
      setInvoice(loadedInvoice);
      setIsModalOpen(false);
  }, []);

  const handleDeleteInvoice = useCallback(async (invoiceNumber: string) => {
      if(!session?.user) return;
      const { error } = await supabase.from('invoices').delete().match({ invoiceNumber: invoiceNumber, user_id: session.user.id });
      if(error) {
          const errorMessage = error?.message || JSON.stringify(error);
          console.error("Error deleting invoice:", error);
          alert(`Could not delete invoice: ${errorMessage}`);
          return;
      }
      setSavedInvoices(savedInvoices.filter(inv => inv.invoiceNumber !== invoiceNumber));
  }, [savedInvoices, session]);
  
  const handleGenerateSummary = useCallback(async () => {
    if (!invoice.patientName || invoice.items.length === 0) {
        alert('Please enter a patient name and at least one service to generate a summary.');
        return;
    }
    setIsGeneratingSummary(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const serviceDescriptions = invoice.items.map(item => `- ${item.description}`).join('\n');
        const prompt = `
            You are a friendly and helpful dental clinic assistant.
            Your task is to generate a brief, patient-friendly summary for an invoice that will be placed in the 'notes' section.
            Be positive, encouraging, and clear. Do not mention prices or costs.
            If the services include a 'check-up' or 'cleaning', gently remind the patient to schedule their next appointment in 6 months.
            Keep the summary to 2-3 short sentences.
            Here are the details:
            Clinic Name: ${invoice.clinicName}
            Patient Name: ${invoice.patientName}
            Services Rendered:\n${serviceDescriptions}\n
            Generate a summary based on these details.`;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const summary = response.text;
        if (summary) {
            handleInvoiceChange('notes', summary.trim());
        } else {
             throw new Error('Failed to generate summary. The response was empty.');
        }
    } catch (error: any) {
        const errorMessage = error?.message || JSON.stringify(error);
        console.error('Error generating summary:', error);
        alert(`There was an error generating the patient summary: ${errorMessage}`);
    } finally {
        setIsGeneratingSummary(false);
    }
  }, [invoice, handleInvoiceChange]);

  const handleSignOut = async () => {
      await supabase.auth.signOut();
  }

  if (loading) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <p className="text-xl text-slate-500">Loading...</p>
          </div>
      );
  }

  if (!session) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-primary text-center mb-2">Dental Invoice Pro</h1>
                <p className="text-center text-slate-500 mb-8">Sign in to manage your invoices</p>
                <Auth
                    supabaseClient={supabase}
                    providers={['google']}
                    theme="default"
                    view="sign_in"
                />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Dental Invoice Pro</h1>
          <div className="flex items-center gap-4">
             <span className="text-slate-600 text-sm hidden sm:block">Welcome, {session.user.email}</span>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <HistoryIcon />
              <span>Past Invoices</span>
            </button>
            <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
                Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
            <InvoiceForm 
                invoice={invoice}
                onInvoiceChange={handleInvoiceChange}
                onItemChange={handleItemChange}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                logo={logo}
                setLogo={handleSetLogo}
                onSave={handleSaveInvoice}
                onDownload={handleDownloadPdf}
                onGenerateSummary={handleGenerateSummary}
                isGeneratingSummary={isGeneratingSummary}
            />
        </div>
        <div className="lg:col-span-3">
            <InvoicePreview 
                invoice={invoice}
                logo={logo}
                subtotal={subtotal}
                taxAmount={taxAmount}
                total={total}
            />
        </div>
      </main>

      <PreviousInvoicesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invoices={savedInvoices}
        onLoad={handleLoadInvoice}
        onDelete={handleDeleteInvoice}
      />
    </div>
  );
}

export default App;
