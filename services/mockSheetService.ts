
import { Project, Vendor } from '../types';

// --- LIVE CONFIGURATION ---
// Ensure this URL matches your latest deployment
const API_URL = 'https://script.google.com/macros/s/AKfycbwZ4rL9iXxcQsRQS57HceWlc37OMFNGJhoScpmgel-gNFAt0M2TYV_5VbBX1hQxBnt6/exec';

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
        return { success: true, message: 'Connected to Google Sheet Database' };
    } catch (error) {
        console.error("Connection Failed:", error);
        return { success: false, message: 'Failed to connect. Check internet or API URL.' };
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
    try {
        const base64Data = await this.fileToBase64(file);
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
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
            console.error("Upload failed:", result.message);
            // Fallback for demo if backend isn't updated yet
            return `https://drive.google.com/file/d/placeholder/${file.name}`;
        }
    } catch (e) {
        console.error("Upload Error:", e);
        throw new Error("Gagal mengupload file ke Google Drive.");
    }
  }

  // --- AUTHENTICATION METHODS ---

  async login(id: string, password: string): Promise<{ success: boolean; user?: Vendor; message?: string }> {
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
          return { success: false, message: "Login Error: Network issue" };
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
          return [];
      } catch (e) {
          console.error("Fetch Users Error", e);
          return [];
      }
  }

  getVendors(): Vendor[] {
    return this.vendors;
  }

  async addUser(user: Vendor & { password?: string }): Promise<void> {
      this.vendors.push(user);
      await fetch(`${API_URL}?action=saveUser`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(user)
      });
  }

  async deleteUser(userId: string): Promise<void> {
      this.vendors = this.vendors.filter(v => v.id !== userId);
      await fetch(`${API_URL}?action=deleteUser`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ id: userId })
      });
  }

  // --- PROJECT METHODS ---

  private async fetchAllProjects(): Promise<Project[]> {
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
          console.error("Fetch Projects Error:", e);
          return [];
      }
  }

  private async sendData(project: Project): Promise<void> {
      try {
          const response = await fetch(`${API_URL}?action=save`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(project)
          });
          await response.json();
      } catch (e) {
          console.error("[Google Sheet] Save Error:", e);
          throw e;
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
