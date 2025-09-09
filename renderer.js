// Global state
let collections = {};
let environment = {};
let requestHistory = [];
let currentRequest = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    await loadEnvironment();
    await loadCollections();
    setupEventListeners();
    updateCollectionsUI();
    updateEnvironmentUI();
});

// Event listeners
function setupEventListeners() {
    // URL input enter key
    document.getElementById('url').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendRequest();
        }
    });

    // Environment variable changes
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('env-key') || e.target.classList.contains('env-value')) {
            saveEnvironmentDebounced();
        }
    });
}

// Debounced save function
const saveEnvironmentDebounced = debounce(() => {
    collectEnvironmentVars();
    saveEnvironment();
}, 1000);

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Tab management
function showTab(tabName) {
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab pane
    document.getElementById(tabName + '-pane').classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

function showResponseTab(tabName) {
    // Remove active class from all response tabs
    document.querySelectorAll('.response-tabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    const responseContent = document.getElementById('responseContent');
    
    if (tabName === 'response-body') {
        displayResponseBody();
    } else if (tabName === 'response-headers') {
        displayResponseHeaders();
    }
}

// Environment variables
function addEnvVar() {
    const container = document.getElementById('environmentVars');
    const envVar = document.createElement('div');
    envVar.className = 'env-var';
    envVar.innerHTML = `
        <input type="text" placeholder="Key" class="env-key">
        <input type="text" placeholder="Value" class="env-value">
        <button class="btn btn-danger" onclick="removeEnvVar(this)">-</button>
    `;
    container.appendChild(envVar);
}

function removeEnvVar(button) {
    button.parentElement.remove();
    collectEnvironmentVars();
    saveEnvironment();
}

function collectEnvironmentVars() {
    environment = {};
    document.querySelectorAll('.env-var').forEach(envVar => {
        const key = envVar.querySelector('.env-key').value.trim();
        const value = envVar.querySelector('.env-value').value.trim();
        if (key) {
            environment[key] = value;
        }
    });
}

function updateEnvironmentUI() {
    const container = document.getElementById('environmentVars');
    container.innerHTML = '';
    
    // Add existing environment variables
    Object.entries(environment).forEach(([key, value]) => {
        const envVar = document.createElement('div');
        envVar.className = 'env-var';
        envVar.innerHTML = `
            <input type="text" placeholder="Key" class="env-key" value="${key}">
            <input type="text" placeholder="Value" class="env-value" value="${value}">
            <button class="btn btn-danger" onclick="removeEnvVar(this)">-</button>
        `;
        container.appendChild(envVar);
    });
    
    // Add empty row for new variables
    const envVar = document.createElement('div');
    envVar.className = 'env-var';
    envVar.innerHTML = `
        <input type="text" placeholder="Key" class="env-key">
        <input type="text" placeholder="Value" class="env-value">
        <button class="btn btn-secondary" onclick="addEnvVar()">+</button>
    `;
    container.appendChild(envVar);
}

// Headers management
function addHeader() {
    const container = document.getElementById('headersContainer');
    const headerRow = document.createElement('div');
    headerRow.className = 'header-row';
    headerRow.innerHTML = `
        <input type="text" placeholder="Header Key" class="header-key">
        <input type="text" placeholder="Header Value" class="header-value">
        <button class="btn btn-danger" onclick="removeHeader(this)">-</button>
    `;
    container.appendChild(headerRow);
}

function removeHeader(button) {
    button.parentElement.remove();
}

function collectHeaders() {
    const headers = {};
    document.querySelectorAll('.header-row').forEach(row => {
        const key = row.querySelector('.header-key').value.trim();
        const value = row.querySelector('.header-value').value.trim();
        if (key) {
            headers[key] = value;
        }
    });
    return headers;
}

// Body type management
function changeBodyType() {
    const bodyType = document.getElementById('bodyType').value;
    const bodyContent = document.getElementById('bodyContent');
    
    switch (bodyType) {
        case 'json':
            bodyContent.innerHTML = '<textarea id="body" placeholder=\'{\n  "key": "value"\n}\'></textarea>';
            break;
        case 'form-data':
        case 'x-www-form-urlencoded':
            bodyContent.innerHTML = '<div id="formDataContainer"><div class="form-row"><input type="text" placeholder="Key" class="form-key"><input type="text" placeholder="Value" class="form-value"><button class="btn btn-secondary" onclick="addFormField()">+</button></div></div>';
            break;
        case 'raw':
            bodyContent.innerHTML = '<textarea id="body" placeholder="Raw text content"></textarea>';
            break;
    }
}

function addFormField() {
    const container = document.getElementById('formDataContainer');
    const formRow = document.createElement('div');
    formRow.className = 'form-row';
    formRow.innerHTML = `
        <input type="text" placeholder="Key" class="form-key">
        <input type="text" placeholder="Value" class="form-value">
        <button class="btn btn-danger" onclick="removeFormField(this)">-</button>
    `;
    container.appendChild(formRow);
}

function removeFormField(button) {
    button.parentElement.remove();
}

function collectFormData() {
    const formData = {};
    document.querySelectorAll('.form-row').forEach(row => {
        const key = row.querySelector('.form-key').value.trim();
        const value = row.querySelector('.form-value').value.trim();
        if (key) {
            formData[key] = value;
        }
    });
    return formData;
}

// Replace environment variables
function replaceEnvironmentVars(text) {
    if (!text) return text;
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        return environment[key.trim()] || match;
    });
}

// Send request
async function sendRequest() {
    const method = document.getElementById('method').value;
    const url = replaceEnvironmentVars(document.getElementById('url').value);
    const headers = collectHeaders();
    const bodyType = document.getElementById('bodyType').value;
    
    if (!url) {
        alert('Please enter a URL');
        return;
    }

    let body = null;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        if (bodyType === 'json' || bodyType === 'raw') {
            const bodyElement = document.getElementById('body');
            if (bodyElement) {
                body = bodyElement.value;
                if (bodyType === 'json' && body) {
                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                        alert('Invalid JSON in request body');
                        return;
                    }
                }
            }
        } else if (bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') {
            body = collectFormData();
        }
    }

    // Replace environment variables in headers
    const processedHeaders = {};
    Object.entries(headers).forEach(([key, value]) => {
        processedHeaders[key] = replaceEnvironmentVars(value);
    });

    const requestData = {
        method,
        url,
        headers: processedHeaders,
        body,
        bodyType
    };

    // Show loading
    showLoading();

    try {
        const response = await window.electronAPI.makeRequest(requestData);
        
        // Add to history
        const historyItem = {
            ...requestData,
            timestamp: new Date().toISOString(),
            response: response.success ? response.data : response.error
        };
        requestHistory.unshift(historyItem);
        if (requestHistory.length > 50) {
            requestHistory = requestHistory.slice(0, 50);
        }
        
        currentRequest = response;
        displayResponse(response);
        updateHistoryUI();
        
    } catch (error) {
        hideLoading();
        alert('Failed to send request: ' + error.message);
    }
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('responseContent').style.display = 'none';
    document.getElementById('responseTabs').style.display = 'none';
    document.getElementById('responseStats').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function displayResponse(response) {
    hideLoading();
    
    const responseContent = document.getElementById('responseContent');
    const responseTabs = document.getElementById('responseTabs');
    const responseStats = document.getElementById('responseStats');
    const statusCode = document.getElementById('statusCode');
    const responseTime = document.getElementById('responseTime');
    const responseSize = document.getElementById('responseSize');
    
    responseContent.style.display = 'flex';
    responseTabs.style.display = 'flex';
    responseStats.style.display = 'flex';
    
    if (response.success) {
        const data = response.data;
        statusCode.textContent = data.status;
        statusCode.className = 'status-code ' + getStatusClass(data.status);
        responseTime.textContent = `${data.responseTime}ms`;
        
        // Calculate response size
        let size = 0;
        if (typeof data.data === 'string') {
            size = new Blob([data.data]).size;
        } else if (data.data) {
            size = new Blob([JSON.stringify(data.data)]).size;
        }
        responseSize.textContent = formatBytes(size);
        
        displayResponseBody();
        
    } else {
        const error = response.error;
        statusCode.textContent = error.status || 'Error';
        statusCode.className = 'status-code status-error';
        responseTime.textContent = `${error.responseTime || 0}ms`;
        responseSize.textContent = '0 B';
        
        responseContent.innerHTML = `
            <textarea id="response-data" readonly>Error: ${error.message}
${error.data ? '\n\nResponse Data:\n' + error.data : ''}
            </textarea>
        `;
    }
}

function displayResponseBody() {
    const responseContent = document.getElementById('responseContent');
    
    if (!currentRequest || !currentRequest.success) {
        return;
    }
    
    const data = currentRequest.data;
    const contentType = data.contentType || '';
    
    if (contentType.includes('image/') && typeof data.data === 'string' && data.data.startsWith('data:')) {
        // Display image
        responseContent.innerHTML = `
            <div style="text-align: center; overflow: auto;">
                <img src="${data.data}" alt="Response Image" class="response-image">
                <p style="margin-top: 10px; font-size: 12px; color: #888;">
                    Content-Type: ${contentType}
                </p>
            </div>
        `;
    } else {
        // Display text content
        let displayData = data.data;
        if (typeof displayData === 'object') {
            displayData = JSON.stringify(displayData, null, 2);
        }
        
        responseContent.innerHTML = `
            <textarea id="response-data" readonly>${displayData}</textarea>
        `;
    }
}

function displayResponseHeaders() {
    const responseContent = document.getElementById('responseContent');
    
    if (!currentRequest || !currentRequest.success) {
        return;
    }
    
    const headers = currentRequest.data.headers;
    let headerText = '';
    
    Object.entries(headers).forEach(([key, value]) => {
        headerText += `${key}: ${value}\n`;
    });
    
    responseContent.innerHTML = `
        <textarea id="response-data" readonly>${headerText}</textarea>
    `;
}

function getStatusClass(status) {
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 400) return 'status-error';
    if (status >= 300) return 'status-warning';
    return '';
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// History management
function updateHistoryUI() {
    const historySection = document.getElementById('historySection');
    
    if (requestHistory.length === 0) {
        historySection.innerHTML = '<div class="empty-state" style="padding: 20px;">Request history will appear here</div>';
        return;
    }
    
    const historyHTML = requestHistory.slice(0, 10).map(item => `
        <div class="history-item" onclick="loadFromHistory('${item.timestamp}')">
            <div class="history-info">
                <span class="request-method method-${item.method.toLowerCase()}">${item.method}</span>
                <span class="history-url">${item.url}</span>
            </div>
            <span style="font-size: 11px; color: #888;">
                ${new Date(item.timestamp).toLocaleTimeString()}
            </span>
        </div>
    `).join('');
    
    historySection.innerHTML = historyHTML;
}

function loadFromHistory(timestamp) {
    const item = requestHistory.find(h => h.timestamp === timestamp);
    if (!item) return;
    
    // Load method and URL
    document.getElementById('method').value = item.method;
    document.getElementById('url').value = item.url;
    
    // Load headers
    const headersContainer = document.getElementById('headersContainer');
    headersContainer.innerHTML = '';
    
    Object.entries(item.headers || {}).forEach(([key, value]) => {
        const headerRow = document.createElement('div');
        headerRow.className = 'header-row';
        headerRow.innerHTML = `
            <input type="text" placeholder="Header Key" class="header-key" value="${key}">
            <input type="text" placeholder="Header Value" class="header-value" value="${value}">
            <button class="btn btn-danger" onclick="removeHeader(this)">-</button>
        `;
        headersContainer.appendChild(headerRow);
    });
    
    // Add empty header row
    addHeader();
    
    // Load body
    document.getElementById('bodyType').value = item.bodyType || 'json';
    changeBodyType();
    
    if (item.body) {
        if (item.bodyType === 'json' || item.bodyType === 'raw') {
            setTimeout(() => {
                const bodyElement = document.getElementById('body');
                if (bodyElement) {
                    bodyElement.value = typeof item.body === 'object' ? JSON.stringify(item.body, null, 2) : item.body;
                }
            }, 100);
        } else if (item.bodyType === 'form-data' || item.bodyType === 'x-www-form-urlencoded') {
            setTimeout(() => {
                const container = document.getElementById('formDataContainer');
                container.innerHTML = '';
                
                Object.entries(item.body).forEach(([key, value]) => {
                    const formRow = document.createElement('div');
                    formRow.className = 'form-row';
                    formRow.innerHTML = `
                        <input type="text" placeholder="Key" class="form-key" value="${key}">
                        <input type="text" placeholder="Value" class="form-value" value="${value}">
                        <button class="btn btn-danger" onclick="removeFormField(this)">-</button>
                    `;
                    container.appendChild(formRow);
                });
                
                // Add empty row
                addFormField();
            }, 100);
        }
    }
    
    // Load response if available
    if (item.response) {
        currentRequest = { success: true, data: item.response };
        displayResponse({ success: true, data: item.response });
    }
}

// Collections management
async function loadCollections() {
    try {
        const result = await window.electronAPI.loadCollections();
        if (result.success) {
            collections = result.data || {};
        }
    } catch (error) {
        console.error('Failed to load collections:', error);
    }
}

async function saveCollections() {
    try {
        await window.electronAPI.saveCollections(collections);
    } catch (error) {
        console.error('Failed to save collections:', error);
    }
}

async function loadEnvironment() {
    try {
        const result = await window.electronAPI.loadEnvironment();
        if (result.success) {
            environment = result.data || {};
        }
    } catch (error) {
        console.error('Failed to load environment:', error);
    }
}

async function saveEnvironment() {
    try {
        await window.electronAPI.saveEnvironment(environment);
    } catch (error) {
        console.error('Failed to save environment:', error);
    }
}

function updateCollectionsUI() {
    const section = document.getElementById('collectionsSection');
    
    if (Object.keys(collections).length === 0) {
        section.innerHTML = '<div class="empty-state">No collections yet. Create one to organize your requests.</div>';
        return;
    }
    
    const collectionsHTML = Object.entries(collections).map(([id, collection]) => {
        const requestsHTML = (collection.requests || []).map(request => `
            <div class="request-item" onclick="loadRequest('${id}', '${request.id}')">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="request-method method-${request.method.toLowerCase()}">${request.method}</span>
                    <span>${request.name}</span>
                </div>
                <button class="btn btn-danger" style="width: 20px; height: 20px; font-size: 10px; padding: 0;" onclick="event.stopPropagation(); deleteRequest('${id}', '${request.id}')">×</button>
            </div>
        `).join('');
        
        return `
            <div class="collection-item">
                <div class="collection-header" onclick="toggleCollection('${id}')">
                    <span class="collection-name">${collection.name}</span>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn btn-secondary" style="width: 20px; height: 20px; font-size: 10px; padding: 0;" onclick="event.stopPropagation(); exportSingleCollection('${id}')">↓</button>
                        <button class="btn btn-danger" style="width: 20px; height: 20px; font-size: 10px; padding: 0;" onclick="event.stopPropagation(); deleteCollection('${id}')">×</button>
                    </div>
                </div>
                <div class="collection-requests" id="collection-${id}" style="${collection.expanded ? '' : 'display: none;'}">
                    ${requestsHTML}
                </div>
            </div>
        `;
    }).join('');
    
    section.innerHTML = collectionsHTML;
    
    // Update request collection dropdown
    updateRequestCollectionDropdown();
}

function updateRequestCollectionDropdown() {
    const select = document.getElementById('requestCollection');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Select a collection</option>';
    
    Object.entries(collections).forEach(([id, collection]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = collection.name;
        select.appendChild(option);
    });
    
    select.value = currentValue;
}

function toggleCollection(id) {
    collections[id].expanded = !collections[id].expanded;
    updateCollectionsUI();
    saveCollections();
}

function createCollection() {
    document.getElementById('collectionModal').style.display = 'block';
    document.getElementById('collectionName').focus();
}

function confirmCreateCollection() {
    const name = document.getElementById('collectionName').value.trim();
    if (!name) {
        alert('Please enter a collection name');
        return;
    }
    
    const id = Date.now().toString();
    collections[id] = {
        id,
        name,
        requests: [],
        expanded: true
    };
    
    saveCollections();
    updateCollectionsUI();
    closeModal('collectionModal');
    document.getElementById('collectionName').value = '';
}

function deleteCollection(id) {
    if (confirm('Are you sure you want to delete this collection?')) {
        delete collections[id];
        saveCollections();
        updateCollectionsUI();
    }
}

function saveRequest() {
    if (Object.keys(collections).length === 0) {
        alert('Please create a collection first');
        createCollection();
        return;
    }
    
    // Pre-fill request name from URL
    const url = document.getElementById('url').value;
    const method = document.getElementById('method').value;
    const suggestedName = `${method} ${url.split('?')[0].split('/').pop() || 'Request'}`;
    document.getElementById('requestName').value = suggestedName;
    
    updateRequestCollectionDropdown();
    document.getElementById('saveRequestModal').style.display = 'block';
    document.getElementById('requestName').focus();
}

function confirmSaveRequest() {
    const name = document.getElementById('requestName').value.trim();
    const collectionId = document.getElementById('requestCollection').value;
    
    if (!name) {
        alert('Please enter a request name');
        return;
    }
    
    if (!collectionId) {
        alert('Please select a collection');
        return;
    }
    
    const request = {
        id: Date.now().toString(),
        name,
        method: document.getElementById('method').value,
        url: document.getElementById('url').value,
        headers: collectHeaders(),
        bodyType: document.getElementById('bodyType').value,
        body: getRequestBody(),
        timestamp: new Date().toISOString()
    };
    
    collections[collectionId].requests.push(request);
    saveCollections();
    updateCollectionsUI();
    closeModal('saveRequestModal');
    
    // Clear form
    document.getElementById('requestName').value = '';
    document.getElementById('requestCollection').value = '';
}

function getRequestBody() {
    const bodyType = document.getElementById('bodyType').value;
    
    if (bodyType === 'json' || bodyType === 'raw') {
        const bodyElement = document.getElementById('body');
        return bodyElement ? bodyElement.value : null;
    } else if (bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') {
        return collectFormData();
    }
    
    return null;
}

function loadRequest(collectionId, requestId) {
    const collection = collections[collectionId];
    const request = collection.requests.find(r => r.id === requestId);
    
    if (!request) return;
    
    // Load basic info
    document.getElementById('method').value = request.method;
    document.getElementById('url').value = request.url;
    
    // Load headers
    const headersContainer = document.getElementById('headersContainer');
    headersContainer.innerHTML = '';
    
    Object.entries(request.headers || {}).forEach(([key, value]) => {
        const headerRow = document.createElement('div');
        headerRow.className = 'header-row';
        headerRow.innerHTML = `
            <input type="text" placeholder="Header Key" class="header-key" value="${key}">
            <input type="text" placeholder="Header Value" class="header-value" value="${value}">
            <button class="btn btn-danger" onclick="removeHeader(this)">-</button>
        `;
        headersContainer.appendChild(headerRow);
    });
    
    // Add empty header row
    addHeader();
    
    // Load body
    document.getElementById('bodyType').value = request.bodyType || 'json';
    changeBodyType();
    
    if (request.body) {
        setTimeout(() => {
            if (request.bodyType === 'json' || request.bodyType === 'raw') {
                const bodyElement = document.getElementById('body');
                if (bodyElement) {
                    bodyElement.value = typeof request.body === 'object' ? JSON.stringify(request.body, null, 2) : request.body;
                }
            } else if (request.bodyType === 'form-data' || request.bodyType === 'x-www-form-urlencoded') {
                const container = document.getElementById('formDataContainer');
                container.innerHTML = '';
                
                Object.entries(request.body).forEach(([key, value]) => {
                    const formRow = document.createElement('div');
                    formRow.className = 'form-row';
                    formRow.innerHTML = `
                        <input type="text" placeholder="Key" class="form-key" value="${key}">
                        <input type="text" placeholder="Value" class="form-value" value="${value}">
                        <button class="btn btn-danger" onclick="removeFormField(this)">-</button>
                    `;
                    container.appendChild(formRow);
                });
                
                // Add empty row
                addFormField();
            }
        }, 100);
    }
}

function deleteRequest(collectionId, requestId) {
    if (confirm('Are you sure you want to delete this request?')) {
        const collection = collections[collectionId];
        collection.requests = collection.requests.filter(r => r.id !== requestId);
        saveCollections();
        updateCollectionsUI();
    }
}

async function exportCollection() {
    const collectionIds = Object.keys(collections);
    if (collectionIds.length === 0) {
        alert('No collections to export');
        return;
    }
    
    // If only one collection, export it directly
    if (collectionIds.length === 1) {
        const collection = collections[collectionIds[0]];
        try {
            const result = await window.electronAPI.exportCollection(collection);
            if (result.success) {
                alert('Collection exported successfully!');
            } else {
                alert('Failed to export collection: ' + result.error);
            }
        } catch (error) {
            alert('Failed to export collection: ' + error.message);
        }
        return;
    }
    
    // Multiple collections - let user choose
    const collectionName = prompt('Enter collection name to export (or leave empty to export all):');
    if (collectionName === null) return; // Cancelled
    
    if (collectionName.trim() === '') {
        // Export all collections
        const allCollections = { collections, environment };
        try {
            const result = await window.electronAPI.exportCollection(allCollections);
            if (result.success) {
                alert('All collections exported successfully!');
            } else {
                alert('Failed to export collections: ' + result.error);
            }
        } catch (error) {
            alert('Failed to export collections: ' + error.message);
        }
    } else {
        // Export specific collection
        const collection = Object.values(collections).find(c => 
            c.name.toLowerCase().includes(collectionName.toLowerCase())
        );
        
        if (!collection) {
            alert('Collection not found');
            return;
        }
        
        try {
            const result = await window.electronAPI.exportCollection(collection);
            if (result.success) {
                alert('Collection exported successfully!');
            } else {
                alert('Failed to export collection: ' + result.error);
            }
        } catch (error) {
            alert('Failed to export collection: ' + error.message);
        }
    }
}

async function exportSingleCollection(collectionId) {
    const collection = collections[collectionId];
    if (!collection) return;
    
    try {
        const result = await window.electronAPI.exportCollection(collection);
        if (result.success) {
            alert('Collection exported successfully!');
        } else {
            alert('Failed to export collection: ' + result.error);
        }
    } catch (error) {
        alert('Failed to export collection: ' + error.message);
    }
}

async function importCollection() {
    try {
        const result = await window.electronAPI.importCollection();
        if (result.success) {
            const importedData = result.data;
            
            // Check if it's a single collection or multiple collections
            if (importedData.collections) {
                // Multiple collections and environment
                Object.assign(collections, importedData.collections);
                if (importedData.environment) {
                    Object.assign(environment, importedData.environment);
                    updateEnvironmentUI();
                }
            } else if (importedData.name && importedData.requests) {
                // Single collection
                const id = Date.now().toString();
                collections[id] = {
                    ...importedData,
                    id,
                    expanded: true
                };
            } else {
                alert('Invalid collection format');
                return;
            }
            
            await saveCollections();
            await saveEnvironment();
            updateCollectionsUI();
            alert('Collection imported successfully!');
        } else if (result.error !== 'Import cancelled') {
            alert('Failed to import collection: ' + result.error);
        }
    } catch (error) {
        alert('Failed to import collection: ' + error.message);
    }
}

// Modal management
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to send request
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        sendRequest();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    // Ctrl/Cmd + S to save request
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveRequest();
    }
    
    // Ctrl/Cmd + N to create new collection
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createCollection();
    }
});

// Initialize with sample data for testing
function initializeSampleData() {
    // Add some sample environment variables
    if (Object.keys(environment).length === 0) {
        environment = {
            'base_url': 'https://jsonplaceholder.typicode.com',
            'api_key': 'your-api-key-here',
            'user_id': '123'
        };
        saveEnvironment();
        updateEnvironmentUI();
    }
    
    // Add sample collection if none exists
    if (Object.keys(collections).length === 0) {
        const sampleCollectionId = Date.now().toString();
        collections[sampleCollectionId] = {
            id: sampleCollectionId,
            name: 'Sample API Tests',
            expanded: true,
            requests: [
                {
                    id: (Date.now() + 1).toString(),
                    name: 'Get All Posts',
                    method: 'GET',
                    url: '{{base_url}}/posts',
                    headers: {},
                    bodyType: 'json',
                    body: null,
                    timestamp: new Date().toISOString()
                },
                {
                    id: (Date.now() + 2).toString(),
                    name: 'Get Single Post',
                    method: 'GET',
                    url: '{{base_url}}/posts/1',
                    headers: {},
                    bodyType: 'json',
                    body: null,
                    timestamp: new Date().toISOString()
                },
                {
                    id: (Date.now() + 3).toString(),
                    name: 'Create New Post',
                    method: 'POST',
                    url: '{{base_url}}/posts',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    bodyType: 'json',
                    body: JSON.stringify({
                        title: 'Sample Post',
                        body: 'This is a sample post created via API',
                        userId: 1
                    }, null, 2),
                    timestamp: new Date().toISOString()
                },
                {
                    id: (Date.now() + 4).toString(),
                    name: 'Get Random Image',
                    method: 'GET',
                    url: 'https://picsum.photos/400/300',
                    headers: {},
                    bodyType: 'json',
                    body: null,
                    timestamp: new Date().toISOString()
                }
            ]
        };
        saveCollections();
        updateCollectionsUI();
    }
}

// Call initialization after a short delay to ensure UI is ready
setTimeout(initializeSampleData, 1000);