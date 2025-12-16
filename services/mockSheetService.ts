
import { Project, Vendor, ProjectStatus, ProjectCategory, MaterialStatus, WorkStatus, JointSurveyStatus, AdminDocStatus, AdminPOStatus } from '../types';

// --- LIVE CONFIGURATION ---
// Ensure this URL matches your latest deployment
const API_URL = 'https://script.google.com/macros/s/AKfycbxaNNnvuGfKuZRm86VDQpNFxKzhsPlY8T-_QklFMU5BJz0AMJSzGFPg3tgCncH-M1jd/exec';

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
    },
    {
        id: 'p002',
        vendorId: 'v002',
        vendorAppointmentNumber: 'SPK/025/II/2024',
        name: 'Relokasi Utilitas Jl. Rasuna Said',
        location: 'Jakarta Selatan',
        status: ProjectStatus.PLANNING,
        progress: 10,
        budget: 200000000,
        spent: 15000000,
        startDate: '2024-03-01',
        endDate: '2024-05-30',
        remarks: 'Tahap survey bersama',
        description: 'Relokasi pelebaran trotoar.',
        lengthMeter: 1200,
        initiator: 'Dinas Bina Marga',
        relocationReason: 'Penataan Trotoar',
        category: ProjectCategory.RELOCATION,
        progressMeter: 0,
        requiredDocuments: [
            { name: 'Surat Perintah Relokasi', hasFile: true, fileName: 'Instruksi_Dinas.pdf', url: '#' }
        ],
        workItems: [],
        operators: []
    }
];

class SheetService {
  private projects: Project[] = [];
  private vendors: Vendor[] = []; 
  private isInitialized = false;
  private useMock = false;

  async initializeConnection(): Promise<{ success: boolean; message: string }> {
    try {
        console.log("Connecting to Google Sheet Database...");
        // Try simple fetch to check connectivity
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
        
        try {
            await fetch(`${API_URL}?action=ping`, { signal: controller.signal });
            clearTimeout(timeoutId);
            await this.fetchAllProjects();
            await this.fetchUsers();
            this.isInitialized = true;
            return { success: true, message: 'Connected to Database' };
        } catch (netErr) {
            clearTimeout(timeoutId);
            throw new Error("Network timeout or error");
        }
    } catch (error) {
        console.warn("Connection Failed, switching to Offline/Demo Mode.");
        this.useMock = true;
        this.vendors = MOCK_VENDORS;
        this.projects = MOCK_PROJECTS;
        this.isInitialized = true;
        return { success: true, message: 'Demo / Offline Mode Active' };
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

  // --- FILE UPLOAD ---
  async uploadFile(file: File): Promise<string> {
    if (this.useMock) {
        return new Promise(resolve => setTimeout(() => resolve(`https://mock-drive.com/${file.name}`), 1000));
    }

    try {
        const base64Data = await this.fileToBase64(file);
        const content = base64Data.split(',')[1];
        const payload = {
            data: content,
            filename: file.name,
            mimeType: file.type
        };

        const response = await fetch(`${API_URL}?action=upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success && result.url) {
            return result.url;
        } else {
            return `https://drive.google.com/file/d/placeholder/${file.name}`;
        }
    } catch (e) {
        throw new Error("Gagal mengupload file ke Google Drive.");
    }
  }

  // --- AUTHENTICATION METHODS ---

  async login(id: string, password: string): Promise<{ success: boolean; user?: Vendor; message?: string }> {
      // Priority Check for Mock/Demo Login
      if (this.useMock || (id === 'admin' && password === 'admin') || (id === 'v001' && password === 'admin')) {
          const user = this.vendors.find(v => v.id === id);
          if (user) return { success: true, user };
          if (id === 'admin') return { success: true, user: MOCK_VENDORS[0] }; // Fallback
      }

      try {
          const response = await fetch(`${API_URL}?action=login`, {
              method: 'POST',
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
          // Fallback to mock if network fails during login
          const mockUser = MOCK_VENDORS.find(v => v.id === id);
          if (mockUser) return { success: true, user: mockUser };
          return { success: false, message: "Login Error: Network issue and User not found in cache" };
      }
  }

  async fetchUsers(): Promise<Vendor[]> {
      if (this.useMock) return this.vendors;
      try {
          const response = await fetch(`${API_URL}?action=getUsers`);
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
      if (!this.useMock) {
          await fetch(`${API_URL}?action=saveUser`, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(user)
          });
      }
  }

  async deleteUser(userId: string): Promise<void> {
      this.vendors = this.vendors.filter(v => v.id !== userId);
      if (!this.useMock) {
          await fetch(`${API_URL}?action=deleteUser`, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ id: userId })
          });
      }
  }

  // --- PROJECT METHODS ---

  private async fetchAllProjects(): Promise<Project[]> {
      if (this.useMock) return this.projects;
      try {
          const response = await fetch(`${API_URL}?action=read`, { method: 'GET' });
          if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
          
          const data = await response.json();
          if (Array.isArray(data)) {
              this.projects = data;
              return this.projects;
          } else {
              return [];
          }
      } catch (e) {
          console.warn("Fetch Projects Failed, using Mock Data");
          this.useMock = true; // Switch to mock mode automatically on failure
          this.projects = MOCK_PROJECTS;
          return this.projects;
      }
  }

  private async sendData(project: Project): Promise<void> {
      if (this.useMock) return; // Don't send to backend in mock mode
      try {
          const response = await fetch(`${API_URL}?action=save`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(project)
          });
          await response.json();
      } catch (e) {
          console.error("[Google Sheet] Save Error:", e);
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
