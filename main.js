const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Add your icon here
    titleBarStyle: 'default'
  });

  // Load the app
  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

// App event listeners
app.whenReady().then(createWindow);

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function() {
  if (mainWindow === null) createWindow();
});

// IPC handlers for API requests
ipcMain.handle('make-api-request', async (event, requestData) => {
  try {
    const {
      method,
      url,
      headers = {},
      body,
      bodyType,
      timeout = 30000
    } = requestData;

    const startTime = Date.now();
    let config = {
      method: method.toLowerCase(),
      url,
      headers,
      timeout,
      validateStatus: () => true, // Accept all status codes
      maxRedirects: 5,
      responseType: 'arraybuffer' // Get raw response to handle different content types
    };

    // Handle request body based on type
    if (body && ['post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
      switch (bodyType) {
        case 'json':
          config.data = body;
          config.headers['Content-Type'] = 'application/json';
          break;
        case 'form-data':
          const form = new FormData();
          if (typeof body === 'object') {
            Object.entries(body).forEach(([key, value]) => {
              form.append(key, value);
            });
          }
          config.data = form;
          config.headers = { ...config.headers, ...form.getHeaders() };
          break;
        case 'x-www-form-urlencoded':
          const params = new URLSearchParams();
          if (typeof body === 'object') {
            Object.entries(body).forEach(([key, value]) => {
              params.append(key, value);
            });
          }
          config.data = params.toString();
          config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          break;
        case 'raw':
          config.data = body;
          break;
      }
    }

    const response = await axios(config);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Convert response data to appropriate format
    let responseBody;
    const contentType = response.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      try {
        responseBody = JSON.parse(Buffer.from(response.data).toString());
      } catch {
        responseBody = Buffer.from(response.data).toString();
      }
    } else if (contentType.includes('text/') || contentType.includes('application/xml')) {
      responseBody = Buffer.from(response.data).toString();
    } else if (contentType.includes('image/')) {
      // For images, convert to base64
      responseBody = `data:${contentType};base64,${Buffer.from(response.data).toString('base64')}`;
    } else {
      // For other binary data, try to convert to string or return as base64
      try {
        responseBody = Buffer.from(response.data).toString();
      } catch {
        responseBody = `data:application/octet-stream;base64,${Buffer.from(response.data).toString('base64')}`;
      }
    }

    return {
      success: true,
      data: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: responseBody,
        responseTime,
        contentType
      }
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - Date.now();

    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        responseTime,
        data: error.response?.data ? Buffer.from(error.response.data).toString() : null
      }
    };
  }
});

// File operations for saving/loading collections and environment
const getAppDataPath = () => {
  const userDataPath = app.getPath('userData');
  const appDataDir = path.join(userDataPath, 'api-client-data');
  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir, { recursive: true });
  }
  return appDataDir;
};

ipcMain.handle('save-collections', async (event, collections) => {
  try {
    const filePath = path.join(getAppDataPath(), 'collections.json');
    fs.writeFileSync(filePath, JSON.stringify(collections, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-collections', async () => {
  try {
    const filePath = path.join(getAppDataPath(), 'collections.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    }
    return { success: true, data: {} };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-environment', async (event, environment) => {
  try {
    const filePath = path.join(getAppDataPath(), 'environment.json');
    fs.writeFileSync(filePath, JSON.stringify(environment, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-environment', async () => {
  try {
    const filePath = path.join(getAppDataPath(), 'environment.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    }
    return { success: true, data: {} };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-collection', async (event, collection) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Collection',
      defaultPath: `${collection.name}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });
    
    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));
      return { success: true, filePath };
    }
    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-collection', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Collection',
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ],
      properties: ['openFile']
    });
    
    if (filePaths && filePaths.length > 0) {
      const data = fs.readFileSync(filePaths[0], 'utf8');
      const collection = JSON.parse(data);
      return { success: true, data: collection };
    }
    return { success: false, error: 'Import cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});