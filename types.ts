
export enum ProjectStatus {
  PLANNING = 'Planning',
  IN_PROGRESS = 'In Progress',
  ON_HOLD = 'On Hold',
  COMPLETED = 'Completed',
  DELAYED = 'Delayed',
}

export enum ProjectCategory {
  RELOCATION = 'Jalur Relokasi',
  OPERATOR = 'Jalur Operator', // Bisa digunakan untuk project khusus single operator
}

export enum MaterialStatus {
  ON_SITE = 'On Site',
  NOT_YET = 'Not Yet',
  PARTIAL = 'Parsial',
  NONE = '-'
}

export enum WorkStatus {
  DONE = 'Done',
  IN_PROGRESS = 'In Progress',
  NOT_STARTED = 'Not Started',
  NONE = '-'
}

export enum JointSurveyStatus {
  SCHEDULED = 'Scheduled',
  DONE = 'Done',
  PENDING = 'Pending',
  RESCHEDULED = 'Rescheduled',
  NOT_REQUIRED = '-'
}

// --- NEW ADM ENUMS ---
export enum AdminDocStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
  REVISION = 'Revision',
  PENDING = 'Pending'
}

export enum AdminPOStatus {
  NOT_ISSUED = 'Not Issued',
  PROCESSING = 'Processing',
  ISSUED = 'Issued',
  PO_DONE = 'PO Done', // Added as requested
  PAID = 'Paid',
  CANCELLED = 'Cancelled'
}

export type FOCableType = 'FO 288' | 'FO 144' | 'FO 96' | 'FO 48' | 'FO 24' | 'Cable Coaxial' | '-';

export interface Vendor {
  id: string;
  name: string;
  email: string;
  logo?: string;
}

export interface ProjectDocumentStatus {
  name: string;
  hasFile: boolean;
  fileName?: string; // Name of the uploaded file
  url?: string; // Link to Google Drive
  isCustom?: boolean; // Flag for dynamically added documents
}

export interface WorkItem {
  id: string;
  name: string; 
  weight: number; 
  unit: string;   
  planQty: number;
  actualQty: number;
  photos: string[]; // This will store URLs now
  remarks?: string; // Added field for item specific notes
}

export interface OperatorCustomItem {
  id: string;
  label: string;
  value: number;
  unit: string;
}

export interface ProjectOperator {
  id: string;
  name: string; // Nama Operator (e.g. Telkomsel, IOH, XL)
  participationLength: number; // Panjang keterlibatan dalam meter
  accessLength: number; // Jalur Akses (m)
  crossingLength: number; // Jalur Crossing (m)
  hhSharedQty: number; // Handhole Bersama
  hhPrivateQty: number; // Handhole Pribadi
  
  // New Field for Final Data
  cableType?: FOCableType;

  // New field for dynamic list
  customItems?: OperatorCustomItem[];

  statusMaterial: MaterialStatus;
  statusPulling: WorkStatus;
  statusCutOver: WorkStatus;
  remarks?: string;

  // Joint Survey Fields
  jointSurveyDate?: string;
  jointSurveyDeadline?: string; 
  jointSurveyStatus?: JointSurveyStatus;
  jointSurveyRemarks?: string;

  // --- NEW ADMINISTRATIVE FIELDS ---
  adminDocStatus?: AdminDocStatus;
  adminPOStatus?: AdminPOStatus;
  adminSubmitDate?: string;
  adminRemarks?: string;
}

export interface ScheduleItem {
  id: string;
  description: string;
  startWeek: number; // 1-based index (e.g., 1 for Week 1)
  durationWeeks: number; // How many weeks it takes
  pic?: string; // Person In Charge / Resource
  predecessors?: string[]; // Array of IDs of tasks that must finish before this one
}

export interface HandholeAssignment {
    id: string;
    name: string; // e.g., "HH-01"
    operatorIds: string[]; // List of operator IDs inside this HH
}

export interface ABDFile {
    id: string;
    name: string;
    uploadDate: string;
    url?: string; // Link to Google Drive
}

export interface Project {
  id: string;
  vendorId: string;
  vendorAppointmentNumber: string; 
  name: string; 
  location: string;
  status: ProjectStatus;
  progress: number; 
  
  budget: number; 
  spent: number; 
  startDate: string; 
  endDate: string;
  cutOffDate?: string; // Batas Waktu Penerbitan/Pemutusan Dinas
  remarks: string;   
  description: string;
  
  // General Data
  lengthMeter: number; // Total Panjang Project Relokasi
  initiator: string;
  relocationReason: string;

  // Category
  category: ProjectCategory;
  progressMeter: number; 
  photos?: string[]; 

  // Detailed Data
  workItems: WorkItem[]; // Progress Fisik (Galian, HDPE, dll)
  operators: ProjectOperator[]; // List Operator yang ikut relokasi
  scheduleItems?: ScheduleItem[]; // Implementation Schedule (Gantt)

  // Documents
  requiredDocuments: ProjectDocumentStatus[]; 
  
  // Final Data
  handholeAssignments?: HandholeAssignment[];
  abdFiles?: ABDFile[];
}

export interface Document {
  id: string;
  projectId: string;
  vendorId: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'XLSX' | 'IMG';
  uploadDate: string;
  url: string;
}

export interface SheetConfig {
  spreadsheetId: string;
  sheetName: string;
  headers: string[];
}
