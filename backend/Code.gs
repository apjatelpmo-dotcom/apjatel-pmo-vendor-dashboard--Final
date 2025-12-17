/**
 * APJATEL PMO DASHBOARD - BACKEND SCRIPT
 * 
 * Instructions:
 * 1. Run the 'setup()' function once to initialize the Sheets (Projects, Users).
 * 2. Deploy this script as a Web App:
 *    - Execute as: Me (your account)
 *    - Who has access: Anyone (required for the frontend to access without OAuth flow complexity)
 * 3. Paste the Deployment URL into your frontend 'mockSheetService.ts' as API_URL.
 */

const SS_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEET_PROJECTS = "Projects";
const SHEET_USERS = "Users";

// --- INITIAL SETUP ---
function setup() {
  const ss = SpreadsheetApp.openById(SS_ID);
  
  // 1. Setup Projects Sheet
  let pSheet = ss.getSheetByName(SHEET_PROJECTS);
  if (!pSheet) {
    pSheet = ss.insertSheet(SHEET_PROJECTS);
    // Headers: ID, VendorID, Project Name, Status, Full JSON Data, Last Updated
    pSheet.appendRow(["ID", "VendorID", "ProjectName", "Status", "Data", "LastUpdated"]);
  }

  // 2. Setup Users Sheet
  let uSheet = ss.getSheetByName(SHEET_USERS);
  if (!uSheet) {
    uSheet = ss.insertSheet(SHEET_USERS);
    // Headers: ID (username), Name, Email, Role, Password, CreatedAt
    uSheet.appendRow(["ID", "Name", "Email", "Role", "Password", "CreatedAt"]);
    
    // Create Default Admin
    uSheet.appendRow(["admin", "PMO Administrator", "admin@apjatel.co.id", "admin", "admin123", new Date()]);
    // Create Default Vendor
    uSheet.appendRow(["vendor1", "PT Vendor Sejahtera", "vendor@mitra.co.id", "vendor", "vendor123", new Date()]);
  }
}

// --- HTTP HANDLERS ---

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  // Wait for up to 10 seconds for other processes to finish.
  lock.tryLock(10000);

  try {
    const action = e.parameter.action;
    let result = { success: false, message: "Invalid Action" };

    if (action === 'read') {
      result = readProjects();
    } else if (action === 'save') {
      const data = JSON.parse(e.postData.contents);
      result = saveProject(data);
    } else if (action === 'upload') {
      const data = JSON.parse(e.postData.contents);
      result = uploadFileToDrive(data);
    } else if (action === 'login') {
      const data = JSON.parse(e.postData.contents);
      result = loginUser(data.id, data.password);
    } else if (action === 'getUsers') {
      result = getUsers();
    } else if (action === 'saveUser') {
      const data = JSON.parse(e.postData.contents);
      result = saveUser(data);
    } else if (action === 'deleteUser') {
      const data = JSON.parse(e.postData.contents);
      result = deleteUser(data.id);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, 
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- CORE FUNCTIONS ---

function readProjects() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SHEET_PROJECTS);
  
  if (sheet.getLastRow() <= 1) return []; // Only header
  
  // Get all data starting from row 2
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  
  // Map column 5 (Index 4) which contains the JSON data
  const projects = values.map(row => {
    try {
      const jsonStr = row[4]; // Column E is 'Data'
      if (!jsonStr) return null;
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  }).filter(p => p !== null);

  return projects; // Returns Array directly as per frontend expectation
}

function saveProject(project) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SHEET_PROJECTS);
  const data = sheet.getDataRange().getValues();
  
  const projectId = project.id;
  let rowIndex = -1;

  // Search for existing project
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(projectId)) {
      rowIndex = i + 1; // 1-based index
      break;
    }
  }

  const rowData = [
    project.id,
    project.vendorId,
    project.name,
    project.status,
    JSON.stringify(project), // Store full object structure
    new Date()
  ];

  if (rowIndex > 0) {
    // Update
    sheet.getRange(rowIndex, 1, 1, 6).setValues([rowData]);
  } else {
    // Insert
    sheet.appendRow(rowData);
  }

  return { success: true, message: "Project Saved", id: projectId };
}

function uploadFileToDrive(payload) {
  // payload: { data: base64String, filename: string, mimeType: string }
  try {
    const data = Utilities.base64Decode(payload.data);
    const blob = Utilities.newBlob(data, payload.mimeType, payload.filename);
    
    // Upload to Root or Specific Folder
    // To organize, you could create an "Apjatel_Uploads" folder and get its ID
    const file = DriveApp.createFile(blob);
    
    // IMPORTANT: Make public so frontend can view/download without OAuth
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Use getDownloadUrl or construct a viewable link
    // Note: getDownloadUrl() sometimes requires cookies. 
    // Creating a direct link for 'viewing' is often safer for images in tags.
    const fileId = file.getId();
    
    // Generate a direct link suitable for img tags (for images) or download (for docs)
    // Verify if it's an image
    let publicUrl;
    if (payload.mimeType.includes('image')) {
       // Thumbnail hack for direct image embedding
       publicUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    } else {
       publicUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    return { success: true, url: publicUrl };
  } catch (e) {
    return { success: false, message: "Upload failed: " + e.toString() };
  }
}

// --- USER MANAGEMENT ---

function loginUser(id, password) {
  const users = getUsersInternal();
  const user = users.find(u => u.id === id && String(u.password) === String(password));
  
  if (user) {
    // Return user without password
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return { success: true, user: safeUser };
  } else {
    return { success: false, message: "Invalid ID or Password" };
  }
}

function getUsers() {
  const users = getUsersInternal();
  // Return public info only
  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role
  }));
}

function saveUser(user) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(user.id)) {
      rowIndex = i + 1;
      break;
    }
  }

  // If password is blank/undefined on update, keep existing
  let password = user.password;
  if (rowIndex > 0 && !password) {
     password = data[rowIndex-1][4];
  }

  const rowData = [
    user.id,
    user.name,
    user.email,
    user.role || 'vendor',
    password,
    new Date()
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, 6).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return { success: true };
}

function deleteUser(userId) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(userId)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: "User not found" };
}

// Internal Helper to get raw user data including password
function getUsersInternal() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  return values.map(row => ({
    id: row[0],
    name: row[1],
    email: row[2],
    role: row[3],
    password: row[4]
  }));
}
