
export interface LineItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id?: number; // Primary key from DB
  user_id?: string; // Foreign key to auth.users
  invoiceNumber: string;
  date: string;
  clinicName: string;
  clinicAddress: string;
  patientName: string;
  patientAddress: string;
  patientContact: string;
  items: LineItem[];
  notes: string;
  taxRate: number;
}