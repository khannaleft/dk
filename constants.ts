import { Invoice } from './types';

export const INITIAL_INVOICE: Invoice = {
  invoiceNumber: `INV-${String(Date.now()).slice(-6)}`,
  date: new Date().toISOString().split('T')[0],
  clinicName: 'SmileBright Dental Clinic',
  clinicAddress: '123 Dental Way, Toothville, ST 12345',
  patientName: '',
  patientAddress: '',
  patientContact: '',
  items: [
    { id: 1, description: 'Routine Check-up & Cleaning', quantity: 1, price: 1000 },
    { id: 2, description: 'X-Rays (Bitewing)', quantity: 2, price: 250 },
  ],
  notes: 'Thank you for your visit! Please schedule your next appointment in 6 months.',
  taxRate: 0, // Medical services are often not taxed
};
