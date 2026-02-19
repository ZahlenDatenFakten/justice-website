
export interface User {
  fullName: string;
  position: string;
  email: string;
  password?: string;
  signature: string; // Base64 data URL
  createdAt: string;
  lastIp?: string; // For ban system
}

export type DocumentType = 'resolution' | 'decree';
export type DocumentStatus = 'published' | 'draft';

export interface OGPDocument {
  id: string;
  type: DocumentType;
  number: string;
  date: string;
  subject: string;
  basis: string;
  points: string;
  deadline: string;
  responsibility: string;
  effective: string;
  warning: string;
  author: string;
  authorPosition: string;
  authorEmail: string;
  authorSignature: string;
  status: DocumentStatus;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export type FineStatus = 'pending' | 'paid' | 'overdue';

export interface FineComment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface Fine {
  id: string;
  documentNumber: string; // The resolution number (e.g. DJP-XXX)
  defendant: string;      // Who was fined
  amount: string;         // e.g. 10.000$
  article: string;        // e.g. 15.6 UAK
  deadline: string;       // ISO Date string (creation + 48h)
  status: FineStatus;
  author: string;         // Prosecutor name
  createdAt: string;
  comments: FineComment[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  relatedFineId?: string;
}

export interface CaseFile {
  id: string;
  number: string; // DJC-XXX
  status: 'OPEN' | 'CLOSED';
  accessLevel: 'OPEN' | 'CLOSED'; // Access status text
  reason: string; // Reason for opening
  dateOpened: string;
  dateClosed: string; // Can be empty
  author: string;
  authorPosition: string;
  authorSignature: string;
  
  // Content Sections
  plaintiff: string; // Plaintiff info
  defendant: string; // Defendant info
  protocol: string; // Chronological log
  description: string; // Description of incident
  measures: string; // Investigative measures
  materials: string; // Evidence/Links
  conclusion: string; // Conclusion
  decision: string; // Final decision
  
  createdAt: string;
}

export interface PromotionRequest {
  id: string;
  userEmail: string;
  userName: string;
  currentPosition: string;
  requestedPosition: string;
  date: string;
}

export interface GlobalSettings {
    nextDJG: number;
    nextDJP: number;
}