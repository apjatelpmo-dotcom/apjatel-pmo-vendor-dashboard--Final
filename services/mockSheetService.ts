
import { Project, Vendor, ProjectStatus, ProjectCategory, MaterialStatus, WorkStatus, JointSurveyStatus, AdminDocStatus, AdminPOStatus } from '../types';

// --- LIVE CONFIGURATION ---
// PENTING: GANTI URL INI DENGAN URL HASIL DEPLOYMENT TERBARU ANDA
const API_URL = 'https://script.google.com/macros/s/AKfycby5Ox6AtrTFs2npQSwWWoXTyaFIdwnSbtgGiFTp5-qSFZVJqtm1mcqIDUhTfIXnhF00/exec';

// --- MOCK DATA (FALLBACK) ---
const MOCK_VENDORS: Vendor[] = [
    { id: 'admin', name: 'Administrator', email: 'admin@apjatel.co.id' },
    { id: 'v001', name: 'PT. Vendor Jaya Abadi', email: 'info@jayaabadi.com' },
    { id: 'v002', name: 'PT. Sinergi Optik', email: 'contact@sinergioptik.id' }
];

const MOCK_PROJECTS: Project[] = [
    {
        id: 'p001',
        vendorId: 'v001',
        vendorAppointmentNumber: 'SPK/001/XI/2024',
        name: 'Relokasi Kabel FO Jl. Jendral Sudirman',
        location: 'Jakarta Pusat',
        status: ProjectStatus.IN_PROGRESS,
        progress: 65,
        budget: 450000000,
        spent: 215000000,
        startDate: '2024-01-15',
        endDate: '2024-04-15',
        remarks: 'Menunggu izin galian crossing',
        description: 'Relokasi utilitas terdampak proyek MRT Fase 2.',
        lengthMeter: 3500,
        initiator: 'MRT Jakarta',
        relocationReason: 'Proyek Strategis Nasional',
        category: ProjectCategory.RELOCATION,
        progressMeter: 2200,
        requiredDocuments: [
            { name: 'Surat Perintah Relokasi', hasFile: true, fileName: 'Surat_Perintah_001.pdf', url: '#' },
            { name: 'Surat Penunjukkan Vendor (SPK)', hasFile: true, fileName: 'SPK_V001.pdf', url: '#' },
            { name: 'Berita Acara Survey Dinas', hasFile: false },
            { name: 'Price List Apjatel', hasFile: true, fileName: 'RAB_Final.xlsx', url: '#' }
        ],
        workItems: [
            { id: 'w1', name: 'Galian Manual', weight: 30, unit: 'm', planQty: 3500, actualQty: 3500, photos: [], remarks: 'Selesai' },
            { id: 'w2', name: 'Pemasangan HDPE', weight: 30, unit: 'm', planQty: 3500, actualQty: 2000, photos: [], remarks: 'On Progress' },
            { id: 'w3', name: 'Handhole', weight: 40, unit: 'unit', planQty: 10, actualQty: 5, photos: [], remarks: 'Parsial' }
        ],
        operators: [
            {
                id: 'op1', name: 'Telkomsel', participationLength: 3500, accessLength: 100, crossingLength: 50, hhSharedQty: 5, hhPrivateQty: 0,
                statusMaterial: MaterialStatus.ON_SITE, statusPulling: WorkStatus.IN_PROGRESS, statusCutOver: WorkStatus.NOT_STARTED,
                jointSurveyStatus: JointSurveyStatus.DONE, jointSurveyDate: '2024-01-20', adminPOStatus: AdminPOStatus.ISSUED, adminDocStatus: AdminDocStatus.APPROVED
            },
            {
                id: 'op2', name: 'Indosat Ooredoo', participationLength: 3500, accessLength: 150, crossingLength: 50, hhSharedQty: 5, hhPrivateQty: 1,
                statusMaterial: MaterialStatus.NOT_YET, statusPulling: WorkStatus.NOT_STARTED, statusCutOver: WorkStatus.NOT_STARTED,
                jointSurveyStatus: JointSurveyStatus.SCHEDULED, jointSurveyDate: '2024-02-10', adminPOStatus: AdminPOStatus.PROCESSING, adminDocStatus: AdminDocStatus.SUBMITTED
            }
        ]
    }
];

class SheetService {
  private projects: Project[] = [];
  private vendors: Vendor[] = []; 
  private isInitialized = false;
  
  async initializeConnection(): Promise<{ success: boolean; message: string }> {
    try {
        console.log("Connecting to Google Sheet Database...");
        await this.fetchAllProjects();
        await this.fetchUsers();
        
        this.isInitialized = true;
        return { success: true, message: 'Connected to Database (Online)' };

    } catch (error) {
        console.warn("Connection Failed, using offline data.", error);
        
        // Load mock data agar tidak kosong saat offline
        if (this.projects.length === 0) this.projects = MOCK_PROJECTS;
        if (this.vendors.length === 0) this.vendors = MOCK_VENDORS;
        
        this.isInitialized = true;
        return { success: false, message: 'Offline Mode (Connection Error)' };
    }
  }

  // --- HELPER: Base64 Conversion ---
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  }

  // --- FILE UPLOAD (Updated for new GAS) ---
  async uploadFile(file: File): Promise<string> {
    try {
        const base64Data = await this.fileToBase64(file);
        // Hapus prefix data:image/png;base64, ...
        const content = base64Data.split(',')[1];
        
        const payload = {
            data: content,
            filename: file.name,
            mimeType: file.type
        };

        // Kirim request ke GAS dengan action=upload
        const response = await fetch(`${API_URL}?action=upload`, {
            method: 'POST',
            redirect: 'follow', // Penting untuk GAS
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success && result.url) {
            return result.url;
        } else {
            console.warn("Upload failed from server:", result.message);
            throw new Error(result.message || "Upload failed");
        }
    } catch (e) {
        console.error("Upload Error:", e);
        throw new Error("Gagal mengupload file ke Google Drive.");
    }
  }

  // --- AUTHENTICATION ---
  async login(id: string, password: string): Promise<{ success: boolean; user?: Vendor; message?: string }> {
      try {
          const response = await fetch(`${API_URL}?action=login`, {
              method: 'POST',
              redirect: 'follow',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ id, password })
          });
          const result = await response.json();
          if (result.success) {
              return { success: true, user: result.user };
          } else {
              return { success: false, message: result.message };
          }
      } catch (e) {
          console.error("Login Network Error:", e);
          // Fallback ke Mock jika network error, khusus admin
          if (id === 'admin' && password === 'admin') {
             return { success: true, user: MOCK_VENDORS[0] };
          }
          return { success: false, message: "Network Error: Gagal menghubungi server." };
      }
  }

  async fetchUsers(): Promise<Vendor[]> {
      try {
          const response = await fetch(`${API_URL}?action=getUsers`, { redirect: 'follow' });
          const data = await response.json();
          if (Array.isArray(data)) {
              this.vendors = data;
              return data;
          }
          return [];
      } catch (e) {
          return this.vendors.length > 0 ? this.vendors : MOCK_VENDORS;
      }
  }

  getVendors(): Vendor[] {
    return this.vendors.length > 0 ? this.vendors : MOCK_VENDORS;
  }

  async addUser(user: Vendor & { password?: string }): Promise<void> {
      this.vendors.push(user);
      try {
          await fetch(`${API_URL}?action=saveUser`, {
              method: 'POST',
              redirect: 'follow',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(user)
          });
      } catch(e) { console.error("Add User Error", e); }
  }

  async deleteUser(userId: string): Promise<void> {
      this.vendors = this.vendors.filter(v => v.id !== userId);
      try {
          await fetch(`${API_URL}?action=deleteUser`, {
              method: 'POST',
              redirect: 'follow',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ id: userId })
          });
      } catch(e) { console.error("Delete User Error", e); }
  }

  // --- PROJECT METHODS ---

  private async fetchAllProjects(): Promise<Project[]> {
      try {
          // Tambahkan timestamp t untuk menghindari caching agresif browser
          const response = await fetch(`${API_URL}?action=read&t=${Date.now()}`, { 
              method: 'GET',
              redirect: 'follow'
          });
          
          if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
          
          const rawData = await response.json();
          
          if (Array.isArray(rawData)) {
              // Validasi dan normalisasi data dari Sheet
              this.projects = rawData.map((item: any) => {
                 return {
                     ...item,
                     // Pastikan array selalu ada (tidak undefined) untuk mencegah crash di UI
                     workItems: Array.isArray(item.workItems) ? item.workItems : [],
                     operators: Array.isArray(item.operators) ? item.operators : [],
                     requiredDocuments: Array.isArray(item.requiredDocuments) ? item.requiredDocuments : [],
                     scheduleItems: Array.isArray(item.scheduleItems) ? item.scheduleItems : [],
                     handholeAssignments: Array.isArray(item.handholeAssignments) ? item.handholeAssignments : [],
                     abdFiles: Array.isArray(item.abdFiles) ? item.abdFiles : []
                 } as Project;
              });
              
              console.log("Projects Fetched successfully:", this.projects.length);
              return this.projects;
          } else {
              return [];
          }
      } catch (e) {
          console.warn("Fetch Projects Failed, showing cached/mock data.", e);
          if (this.projects.length === 0) this.projects = MOCK_PROJECTS;
          return this.projects;
      }
  }

  private async sendData(project: Project): Promise<void> {
      console.log("Sending project data...", project.id);
      
      try {
          const response = await fetch(`${API_URL}?action=save`, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
            // Kita kirim full object. Script GAS akan otomatis menyimpannya ke kolom json_data
            body: JSON.stringify(project) 
          });
          
          const result = await response.json();
          if (result.success) {
            console.log("Data successfully saved to cloud.", result);
          } else {
            console.error("Sheet Error:", result.message);
            alert(`Gagal menyimpan: ${result.message}`);
          }
      } catch (e) {
          console.error("Network/CORS Error during Save:", e);
          alert("Gagal terhubung ke Google Sheet. Cek koneksi internet Anda.");
      }
  }

  async getProjects(vendorId: string): Promise<Project[]> {
    const freshData = await this.fetchAllProjects();
    if (vendorId === 'admin') {
      return freshData;
    }
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
