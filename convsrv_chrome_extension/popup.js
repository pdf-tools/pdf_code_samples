document.addEventListener('DOMContentLoaded', async () => {
    // State
    let files = [];
    let dragCounter = 0;
    let baseUrl = '';
    let workflows = [];
    let selectedWorkflow = null;
    let selectedProfile = null;

    // Elements
    const elements = {
        settingsButton: document.getElementById('settingsButton'),
        settingsPanel: document.getElementById('settingsPanel'),
        apiUrlInput: document.getElementById('apiUrl'),
        saveSettingsButton: document.getElementById('saveSettings'),
        workflowSelect: document.getElementById('workflow'),
        profileSelect: document.getElementById('profile'),
        mergeCheckbox: document.getElementById('mergeFiles'),
        dropZone: document.getElementById('dropZone'),
        fileInput: document.getElementById('fileInput'),
        fileList: document.getElementById('fileList'),
        outputFileName: document.getElementById('outputFileName'),
        convertButton: document.getElementById('convertButton'),
        progressOverlay: document.getElementById('progressOverlay'),
        progressFill: document.querySelector('.progress-fill'),
        progressText: document.getElementById('progressText'),
        statusDot: document.getElementById('statusDot'),
        mergeOption: document.querySelector('.merge-option')
    };

    // Verify all elements exist
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Element not found: ${key}`);
            return;
        }
    }

    // Add this debug function at the top of your DOMContentLoaded callback
    function debugElement(element, action) {
        if (!element) {
            console.error(`Attempted to access null element during ${action}`);
            console.trace(); // This will show us where the error is coming from
            return false;
        }
        return true;
    }

    function handleFiles(newFiles) {
        // Add new files to the existing array instead of replacing it
        files.push(...newFiles);
        updateFileList();
        updateUI();
    }

    function updateFileList() {
        elements.fileList.innerHTML = '';
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const extension = file.name.split('.').pop();
            const iconName = getFileIcon(extension);
            
            fileItem.innerHTML = `
                <span class="file-icon">
                    <iconify-icon icon="${iconName}"></iconify-icon>
                </span>
                <span class="file-name">${file.name}</span>
                <button class="remove-file" data-index="${index}">
                    <iconify-icon icon="mdi:close"></iconify-icon>
                </button>
            `;
            
            elements.fileList.appendChild(fileItem);
        });
        
        // Add click handlers for remove buttons
        document.querySelectorAll('.remove-file').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                files.splice(index, 1);
                updateFileList();
                updateUI();
            });
        });
    }

    function updateUI() {
        console.log('updateUI called');
        if (!debugElement(elements.mergeOption, 'mergeOption display') ||
            !debugElement(elements.outputFileName, 'outputFileName display') ||
            !debugElement(elements.convertButton, 'convertButton disabled') ||
            !debugElement(elements.mergeCheckbox, 'mergeCheckbox checked')) {
            return;
        }

        const hasMultipleFiles = files.length > 1;
        console.log('Files length:', files.length, 'hasMultipleFiles:', hasMultipleFiles);
        
        elements.convertButton.disabled = files.length === 0;
        elements.mergeOption.style.display = hasMultipleFiles ? 'block' : 'none';
        
        if (hasMultipleFiles) {
            elements.outputFileName.style.display = elements.mergeCheckbox.checked ? 'block' : 'none';
        } else {
            elements.outputFileName.style.display = 'none';
        }
    }

    function updateProgress(status, message) {
        console.log('updateProgress called with status:', status);
        if (!debugElement(elements.progressFill, 'progressFill width') ||
            !debugElement(elements.progressText, 'progressText content')) {
            return;
        }

        // Update progress bar based on status
        switch (status) {
            case 'creating':
                elements.progressFill.style.width = '25%';
                break;
            case 'pending':
                elements.progressFill.style.width = '50%';
                break;
            case 'processing':
                elements.progressFill.style.width = '75%';
                break;
            case 'completed':
                elements.progressFill.style.width = '100%';
                break;
            default:
                elements.progressFill.style.width = '0%';
        }

        elements.progressText.textContent = message || `Status: ${status}`;
    }

    // Event Listeners
    elements.settingsButton.addEventListener('click', () => {
        const isHidden = elements.settingsPanel.style.display === 'none';
        elements.settingsPanel.style.display = isHidden ? 'block' : 'none';
    });

    elements.saveSettingsButton.addEventListener('click', () => {
        baseUrl = elements.apiUrlInput.value;
        chrome.storage.local.set({ apiUrl: baseUrl });
        elements.settingsPanel.style.display = 'none';
        loadWorkflows();
    });

    elements.workflowSelect.addEventListener('change', (e) => {
        selectedWorkflow = e.target.value;
        const workflow = workflows.find(w => w.name === selectedWorkflow);
        updateProfiles(workflow);
        updateUI();
    });
    
    elements.profileSelect.addEventListener('change', (e) => {
        selectedProfile = e.target.value;
        updateUI();
    });

    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    
    elements.fileInput.addEventListener('change', (e) => {
        handleFiles(Array.from(e.target.files));
    });

    elements.dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        elements.dropZone.classList.add('drag-over');
    });

    elements.dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            elements.dropZone.classList.remove('drag-over');
        }
    });

    elements.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    elements.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        elements.dropZone.classList.remove('drag-over');
        handleFiles(Array.from(e.dataTransfer.files));
    });

    elements.mergeCheckbox.addEventListener('change', () => {
        updateUI();
    });

    elements.convertButton.addEventListener('click', startConversion);

    // Add message listener for progress updates
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'jobProgress') {
            updateProgress(message.status, message.message);
        }
    });

    // Initialize UI
    updateUI();

    async function loadSettings() {
        console.log('Loading settings...');
        const settings = await chrome.storage.local.get('apiUrl');
        console.log('Retrieved settings:', settings);
        if (settings.apiUrl) {
            baseUrl = settings.apiUrl;
            elements.apiUrlInput.value = baseUrl;
            console.log('Set baseUrl to:', baseUrl);
        } else {
            console.log('No apiUrl found in settings, using default');
            const defaultApiUrl = 'http://localhost:13033/conversion/v1.0/rest';
            baseUrl = defaultApiUrl;
            elements.apiUrlInput.value = baseUrl;
            // Store the default URL
            await chrome.storage.local.set({ apiUrl: defaultApiUrl });
            console.log('Stored default baseUrl:', defaultApiUrl);
        }
        // Load workflows after setting the URL
        await loadWorkflows();
    }

    async function loadWorkflows() {
        try {
            console.log('Loading workflows with baseUrl:', baseUrl);
            if (!baseUrl) {
                console.error('baseUrl is not set');
                return;
            }

            elements.workflowSelect.innerHTML = '<option value="">Select Workflow</option>';
            elements.profileSelect.innerHTML = '<option value="">Select Profile</option>';
            
            const response = await chrome.runtime.sendMessage({
                type: 'getWorkflows',
                baseUrl
            });

            console.log('Response from background script:', response);

            if (!response || response.error) {
                throw new Error(response?.error || 'Failed to load workflows');
            }

            workflows = response;
            console.log('Received workflows:', workflows);

            if (!Array.isArray(workflows)) {
                console.error('Invalid workflows data:', workflows);
                throw new Error(`Invalid workflows data received. Got: ${typeof workflows}. Data: ${JSON.stringify(workflows).slice(0, 100)}...`);
            }

            workflows.forEach(workflow => {
                const option = document.createElement('option');
                option.value = workflow.name;
                option.textContent = workflow.name;
                if (workflow.isDefault) {
                    option.selected = true;
                    updateProfiles(workflow);
                }
                elements.workflowSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading workflows:', error);
            // Show error in UI
            elements.workflowSelect.innerHTML = '<option value="">Error loading workflows</option>';
            elements.profileSelect.innerHTML = '<option value="">No profiles available</option>';
        }
    }

    function updateProfiles(workflow) {
        console.log('Updating profiles for workflow:', workflow);
        elements.profileSelect.innerHTML = '<option value="">Select Profile</option>';
        
        if (workflow && workflow.profiles) {
            console.log('Found workflow profiles:', workflow.profiles);
            workflow.profiles.forEach(profile => {
                const option = document.createElement('option');
                option.value = profile.name;
                option.textContent = profile.name;
                if (profile.isDefault) {
                    option.selected = true;
                }
                elements.profileSelect.appendChild(option);
            });
        } else {
            console.warn('No workflow or profiles found');
        }
    }

    function getFileIcon(extension) {
        // Map common file extensions to Iconify icons
        const iconMap = {
            'pdf': 'mdi:file-pdf-box',
            'doc': 'mdi:file-word',
            'docx': 'mdi:file-word',
            'xls': 'mdi:file-excel',
            'xlsx': 'mdi:file-excel',
            'ppt': 'mdi:file-powerpoint',
            'pptx': 'mdi:file-powerpoint',
            'txt': 'mdi:file-document-outline',
            'rtf': 'mdi:file-document-outline',
            'jpg': 'mdi:file-image',
            'jpeg': 'mdi:file-image',
            'png': 'mdi:file-image',
            'gif': 'mdi:file-image',
            'tiff': 'mdi:file-image',
            'bmp': 'mdi:file-image'
        };

        return iconMap[extension.toLowerCase()] || 'mdi:file-document-outline';
    }

    async function startConversion() {
        if (files.length === 0) return;

        const mergeEnabled = files.length > 1 && elements.mergeCheckbox.checked;
        const outputFileName = elements.outputFileName.value;

        try {
            elements.progressOverlay.style.display = 'block';
            elements.progressFill.style.width = '0%';
            elements.progressText.textContent = 'Starting conversion...';

            if (mergeEnabled) {
                // Convert all files as one merged PDF
                await handleMergedConversion(files, outputFileName);
            } else {
                // Convert each file individually
                await handleIndividualConversions(files);
            }

            // Clear the file list after successful conversion
            files = [];
            updateFileList();
            updateUI();
            
            elements.progressFill.style.width = '100%';
            elements.progressText.textContent = 'Conversion complete!';
            setTimeout(() => {
                elements.progressOverlay.style.display = 'none';
                elements.progressFill.style.width = '0%';
            }, 2000);

        } catch (error) {
            console.error('Conversion failed:', error);
            elements.progressText.textContent = 'Conversion failed: ' + error.message;
            setTimeout(() => {
                elements.progressOverlay.style.display = 'none';
                elements.progressFill.style.width = '0%';
            }, 3000);
        }
    }

    async function handleMergedConversion(files, outputFileName) {
        const workflow = elements.workflowSelect.value;
        const profile = elements.profileSelect.value;
        
        // Convert files to base64
        const fileDataArray = await Promise.all(files.map(async (file) => {
            const base64Data = await fileToBase64(file);
            return {
                name: file.name,
                data: base64Data
            };
        }));

        // Send to background script for merged conversion
        await chrome.runtime.sendMessage({
            action: 'convertFiles',
            baseUrl: baseUrl,
            files: fileDataArray,
            workflow,
            profile,
            merge: true,
            outputFileName: outputFileName || 'merged.pdf'
        });
    }

    async function handleIndividualConversions(files) {
        const workflow = elements.workflowSelect.value;
        const profile = elements.profileSelect.value;
        const totalFiles = files.length;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const base64Data = await fileToBase64(file);
            
            elements.progressText.textContent = `Converting file ${i + 1} of ${totalFiles}...`;
            elements.progressFill.style.width = `${((i + 1) / totalFiles) * 100}%`;

            await chrome.runtime.sendMessage({
                action: 'convertFiles',
                baseUrl: baseUrl,
                files: [{
                    name: file.name,
                    data: base64Data
                }],
                workflow,
                profile,
                merge: false
            });
        }
    }

    async function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result.split(',')[1]); // Get base64 data without prefix
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function checkServiceStatus() {
        const baseUrl = elements.apiUrlInput.value;

        try {
            const response = await fetch(`${baseUrl}/`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === 'running') {
                elements.statusDot.className = 'status-dot online';
                elements.statusDot.title = 'Conversion Service is running';
            } else {
                elements.statusDot.className = 'status-dot offline';
                elements.statusDot.title = `Conversion Service is ${data.status}`;
            }
        } catch (error) {
            elements.statusDot.className = 'status-dot offline';
            elements.statusDot.title = 'Unable to contact Conversion Service';
            console.error('Service status check failed:', error);
        }
    }

    // Initial status check
    await checkServiceStatus();

    // Check status every 30 seconds
    setInterval(checkServiceStatus, 30000);

    // Also check status when API URL changes
    elements.apiUrlInput.addEventListener('change', checkServiceStatus);

    // Initialize
    loadSettings();
});
