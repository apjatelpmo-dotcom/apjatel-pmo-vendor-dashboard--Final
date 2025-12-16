
import { Project, Vendor, ProjectStatus, ProjectCategory, MaterialStatus, WorkStatus, JointSurveyStatus, AdminDocStatus, AdminPOStatus } from '../types';

// --- LIVE CONFIGURATION ---
const API_URL = 'https://script.google.com/macros/s/AKfycby5Ox6AtrTFs2npQSwWWoXTyaFIdwnSbtgGiFTp5-qSFZVJqtm1mcqIDUhTfIXnhF00/exec';

// --- MOCK DATA ---
const MOCK_VENDORS: Vendor[] = [
    { id: 'admin', name: 'Administrator', email: 'admin@apjatel.co.id' },
    { id: 'v001', name: 'PT. Vendor Jaya Abadi', email: 'info@jayaabadi.com' },
    { id: 'v002', name: 'PT. Sinergi Optik', email: 'contact@sinergioptik.id' },
    { id: 'ant', name: 'PT. Ant (Vendor)', email: 'ant@vendor.com' }
];

const MOCK_PROJECTS: Project[] = []; // Kosongkan mock agar kita fokus data live

class SheetService {
  private projects: Project[] = [];
  private vendors: Vendor[] = []; 
  
  async initializeConnection(): Promise<{ success: boolean; message: string }> {
    try {
        await this.fetchAllProjects();
        await this.fetchUsers();
        return { success: true, message: 'Connected to Database' };
    } catch (error) {
        return { success: false, message: 'Offline Mode' };
    }
  }

  // --- HELPER: Base64 ---
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  }

  // --- UPLOAD ---
  async uploadFile(file: File): Promise<string> {
    try {
        const base64Data = await this.fileToBase64(file);
        const content = base64Data.split(',')[1];
        
        const response = await fetch(`${API_URL}?action=upload`, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                data: content,
                filename: file.name,
                mimeType: file.type
            })
        });

        const result = await response.json();
        if (result.success && result.url) return result.url;
        throw new Error(result.message || "Upload failed");
    } catch (e) {
        console.error("Upload Error:", e);
        throw new Error("Gagal upload file.");
    }
  }

  // --- AUTH ---
  async login(id: string, password: string): Promise<{ success: boolean; user?: Vendor; message?: string }> {
      try {
          const response = await fetch(`${API_URL}?action=login`, {
              method: 'POST',
              body: JSON.stringify({ id, password })
          });
          const result = await response.json();
          return result;
      } catch (e) {
          if (id === 'admin' && password === 'admin') return { success: true, user: MOCK_VENDORS[0] };
          return { success: false, message: "Network Error" };
      }
  }

  async fetchUsers(): Promise<Vendor[]> {
      try {
          const response = await fetch(`${API_URL}?action=getUsers`);
          const data = await response.json();
          if (Array.isArray(data)) {
              this.vendors = data;
              return data;
          }
          return MOCK_VENDORS;
      } catch (e) {
          return this.vendors.length > 0 ? this.vendors : MOCK_VENDORS;
      }
  }

  getVendors(): Vendor[] {
    return this.vendors.length > 0 ? this.vendors : MOCK_VENDORS;
  }

  async addUser(user: Vendor & { password?: string }): Promise<void> {
      this.vendors.push(user);
      await fetch(`${API_URL}?action=saveUser`, { method: 'POST', body: JSON.stringify(user) });
  }

  async deleteUser(userId: string): Promise<void> {
      this.vendors = this.vendors.filter(v => v.id !== userId);
      await fetch(`${API_URL}?action=deleteUser`, { method: 'POST', body: JSON.stringify({ id: userId }) });
  }

  // --- PROJECT CRUD (INTI PERBAIKAN) ---

  // 1. READ: Logic Pembersihan Data yang Agresif
  private async fetchAllProjects(): Promise<Project[]> {
      try {
          const response = await fetch(`${API_URL}?action=read&t=${Date.now()}`);
          if (!response.ok) throw new Error("Network response was not ok");
          
          const rawData = await response.json();
          
          if (Array.isArray(rawData)) {
              this.projects = rawData.map((item: any) => {
                 // RECOVERY LOGIC: Jika vendorId rusak (berisi JSON), kita bongkar
                 let cleanVendorId = item.vendorId;
                 let recoveredDetails = {};

                 if (typeof cleanVendorId === 'string' && cleanVendorId.trim().startsWith('{')) {
                     try {
                         const parsed = JSON.parse(cleanVendorId);
                         cleanVendorId = parsed.vendorId || 'unknown'; // Ambil ID asli dari dalam sampah
                         recoveredDetails = parsed; // Selamatkan data lain yang mungkin hilang
                     } catch(e) { 
                         cleanVendorId = 'corrupt_data'; 
                     }
                 }

                 // Pastikan VendorID bersih (hanya string pendek)
                 if (typeof cleanVendorId !== 'string' || cleanVendorId.length > 20) {
                     cleanVendorId = 'unknown'; 
                 }

                 // Merge data sheet (item), data recovery (recoveredDetails), dan default arrays
                 const merged = { ...recoveredDetails, ...item };
                 
                 return {
                     ...merged,
                     id: String(item.id),
                     vendorId: String(cleanVendorId), // INI KUNCINYA AGAR FILTER DASHBOARD JALAN
                     
                     // Pastikan Array Tidak Null
                     workItems: Array.isArray(merged.workItems) ? merged.workItems : [],
                     operators: Array.isArray(merged.operators) ? merged.operators : [],
                     requiredDocuments: Array.isArray(merged.requiredDocuments) ? merged.requiredDocuments : [],
                     scheduleItems: Array.isArray(merged.scheduleItems) ? merged.scheduleItems : [],
                     handholeAssignments: Array.isArray(merged.handholeAssignments) ? merged.handholeAssignments : [],
                     abdFiles: Array.isArray(merged.abdFiles) ? merged.abdFiles : []
                 } as Project;
              });
              return this.projects;
          }
          return [];
      } catch (e) {
          console.warn("Fetch failed, using cache", e);
          return this.projects;
      }
  }

  // 2. SAVE: Logic Pemisahan Kolom vs JSON (Agar Sheet Rapi)
  private async sendData(project: Project): Promise<void> {
      try {
          // KITA PISAHKAN DATA HEADER (UNTUK KOLOM) DENGAN DATA DETAIL (UNTUK JSON)
          // Ini mencegah kolom 'vendorId' terisi object raksasa.
          
          const payload = {
              // Header Data (Masuk ke Kolom A-F di Sheet)
              id: project.id,
              vendorId: project.vendorId, // Pastikan ini string pendek!
              name: project.name,
              location: project.location,
              status: project.status,
              progress: project.progress,
              
              // Full Data (Masuk ke Kolom H / json_data sebagai backup lengkap)
              // Google Script saya akan memprioritaskan ini saat READ, tapi kolom Header tetap aman.
              json_data: JSON.stringify(project) 
          };

          const response = await fetch(`${API_URL}?action=save`, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
            body: JSON.stringify(payload) // Kirim payload yang sudah dirapikan
          });
          
          const result = await response.json();
          if (!result.success) throw new Error(result.message);

      } catch (e) {
          console.error("Save Data Error:", e);
          throw e; 
      }
  }

  async getProjects(vendorId: string): Promise<Project[]> {
    // Selalu fetch baru untuk memastikan sinkron
    const freshData = await this.fetchAllProjects();
    
    if (vendorId === 'admin') {
      return freshData;
    }
    // Filter sekarang aman karena vendorId sudah dibersihkan di fetchAllProjects
    return freshData.filter(p => p.vendorId === vendorId);
  }

  async addProject(project: Project): Promise<void> {
    this.projects.push(project);
    await this.sendData(project);
  }

  async updateProject(project: Project): Promise<void> {
    const index = this.projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      this.projects[index] = project;
      await this.sendData(project);
    }
  }
}

export const sheetService = new SheetService();
