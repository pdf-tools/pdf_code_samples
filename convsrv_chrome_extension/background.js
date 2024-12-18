let panelWindow = null;

chrome.action.onClicked.addListener(async () => {
    if (panelWindow) {
        // If window exists, close it
        await chrome.windows.remove(panelWindow.id);
        panelWindow = null;
    } else {
        // Create new window with default positioning first
        const width = 450;
        const height = 600;
        
        // Get display info to position the window
        const displays = await chrome.system.display.getInfo();
        const primaryDisplay = displays.find(d => d.isPrimary) || displays[0];
        
        panelWindow = await chrome.windows.create({
            url: 'popup.html',
            type: 'popup',
            width: width,
            height: height,
            left: Math.floor(primaryDisplay.workArea.width - width),
            top: Math.floor((primaryDisplay.workArea.height - height) / 2),
            focused: true
        });

        // Prevent window resizing
        chrome.windows.update(panelWindow.id, {
            width: width,
            height: height
        });

        // Listen for window close
        chrome.windows.onRemoved.addListener((windowId) => {
            if (panelWindow && windowId === panelWindow.id) {
                panelWindow = null;
            }
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getWorkflows') {
        fetchWorkflows(request.baseUrl)
            .then(sendResponse)
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (request.action === 'convertFiles') {
        handleConversion(request)
            .then(() => {
                sendResponse({ success: true });
            })
            .catch(error => {
                console.error('Conversion error:', error);
                sendResponse({ error: error.message });
            });
        return true;
    }
});

async function fetchWorkflows(baseUrl) {
    try {
        const url = `${baseUrl}/workflows`;
        console.info('GET Workflows:', { url, baseUrl });
        
        if (!baseUrl || !baseUrl.startsWith('http')) {
            throw new Error(`Invalid baseUrl: ${baseUrl}`);
        }

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
        
        const data = await response.json();
        console.info('Workflows response:', data);
        return data;
    } catch (error) {
        console.error('Error fetching workflows:', error);
        throw error;
    }
}

async function handleConversion(request) {
    const { files, workflow, profile, merge } = request;
    const baseUrl = request.baseUrl;

    if (!baseUrl) {
        throw new Error('Base URL is required');
    }

    try {
        if (merge) {
            // Handle merged conversion
            const jobId = await createJob(baseUrl, workflow, profile);
            
            // Upload all files
            for (const file of files) {
                await uploadFile(baseUrl, jobId, file);
            }
            
            // Start the job
            await startJob(baseUrl, jobId);
            
            // Wait for completion and download
            await waitForCompletion(baseUrl, jobId);
            await downloadResult(baseUrl, jobId, request.outputFileName || 'merged.pdf');
            
            // Cleanup
            await deleteJob(baseUrl, jobId);
        } else {
            // Handle individual conversions
            for (const file of files) {
                // Create individual job for each file
                const jobId = await createJob(baseUrl, workflow, profile);
                
                // Upload single file
                await uploadFile(baseUrl, jobId, file);
                
                // Start the job
                await startJob(baseUrl, jobId);
                
                // Wait for completion and download
                await waitForCompletion(baseUrl, jobId);
                
                // Use original filename with .pdf extension
                const outputName = file.name.replace(/\.[^/.]+$/, "") + '.pdf';
                await downloadResult(baseUrl, jobId, outputName);
                
                // Cleanup
                await deleteJob(baseUrl, jobId);
            }
        }
        return { success: true };
    } catch (error) {
        console.error('Conversion error:', error);
        throw error;
    }
}

async function uploadFile(baseUrl, jobId, file) {
    const uploadUrl = `${baseUrl}/jobs/${jobId}/data`;
    console.info('POST Upload File:', { 
        url: uploadUrl,
        filename: file.name,
        size: file.size
    });

    // Convert base64 to Blob
    const binaryData = atob(file.data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/octet-stream' });

    const formData = new FormData();
    formData.append('data', blob, file.name);

    const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'Accept': 'application/json'
        },
        body: formData
    });
    
    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload file: ${uploadResponse.status} ${errorText}`);
    }
    console.info('File uploaded successfully:', { 
        filename: file.name,
        size: file.size
    });
}

async function startJob(baseUrl, jobId) {
    const startJobUrl = `${baseUrl}/jobs/${jobId}:start`;
    console.info('POST Start Job:', { url: startJobUrl });

    const startResponse = await fetch(startJobUrl, {
        method: 'POST',
        headers: {
            'Accept': 'application/json'
        }
    });
    
    if (!startResponse.ok) {
        const errorText = await startResponse.text();
        throw new Error(`Failed to start job: ${startResponse.status} ${errorText}`);
    }
    console.info('Job started successfully:', { jobId });
}

async function waitForCompletion(baseUrl, jobId) {
    let attempts = 0;
    const maxAttempts = 60; // 1 minute with 1-second intervals
    
    while (attempts < maxAttempts) {
        const statusUrl = `${baseUrl}/jobs/${jobId}`;
        console.info('GET Job Status:', { 
            url: statusUrl,
            attempt: attempts + 1
        });

        const statusResponse = await fetch(statusUrl, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!statusResponse.ok) {
            const errorText = await statusResponse.text();
            throw new Error(`Failed to get job status: ${statusResponse.status} ${errorText}`);
        }
        
        const jobInfo = await statusResponse.json();
        console.info('Job status:', { 
            jobId,
            status: jobInfo.status.code,
            message: jobInfo.status.message,
            attempt: attempts + 1
        });

        // Send progress update to popup
        chrome.runtime.sendMessage({
            type: 'jobProgress',
            status: jobInfo.status.code,
            message: jobInfo.status.message
        });

        if (jobInfo.status.code === 'completed') return;
        if (jobInfo.status.code === 'failed') {
            throw new Error(`Job failed: ${jobInfo.status.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
    }

    throw new Error('Job timed out after 60 seconds');
}

async function downloadResult(baseUrl, jobId, outputFileName) {
    const resultUrl = `${baseUrl}/jobs/${jobId}/result`;
    console.info('GET Job Result:', { url: resultUrl });

    const resultResponse = await fetch(resultUrl, {
        headers: {
            'Accept': 'application/json'
        }
    });
    
    if (!resultResponse.ok) {
        const errorText = await resultResponse.text();
        throw new Error(`Failed to get job result: ${resultResponse.status} ${errorText}`);
    }
    
    const resultMetadata = await resultResponse.json();
    console.info('Got job result metadata:', resultMetadata);

    if (!resultMetadata.dataList || resultMetadata.dataList.length === 0) {
        throw new Error('No result data available');
    }

    // Get the first result file info
    const resultFile = resultMetadata.dataList[0];
    const resultId = resultFile.resultId;

    // Get the actual file content
    const fileUrl = `${baseUrl}/jobs/${jobId}/result/${resultId}`;
    console.info('GET Result File:', { 
        url: fileUrl,
        resultId
    });

    const fileResponse = await fetch(fileUrl, {
        headers: {
            'Accept': '*/*'
        }
    });
    
    if (!fileResponse.ok) {
        const errorText = await fileResponse.text();
        throw new Error(`Failed to get result file: ${fileResponse.status} ${errorText}`);
    }

    const fileBlob = await fileResponse.blob();
    console.info('Got result file:', { 
        size: fileBlob.size
    });

    // Convert blob to base64
    const reader = new FileReader();
    const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(fileBlob);
    });

    return new Promise((resolve, reject) => {
        chrome.downloads.download({
            url: base64Data,
            filename: outputFileName,
            saveAs: true
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('Download error:', chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                console.info('Download started:', {
                    downloadId,
                    filename: outputFileName
                });
                resolve(downloadId);
            }
        });
    });
}

async function deleteJob(baseUrl, jobId) {
    const deleteUrl = `${baseUrl}/jobs/${jobId}`;
    console.info('DELETE Job:', { url: deleteUrl });

    await fetch(deleteUrl, {
        method: 'DELETE'
    });

    console.info('Job deleted successfully:', { jobId });
}

// Helper functions
async function getBaseUrl() {
    // Implement logic to get base URL
    // For demonstration purposes, return a static URL
    return 'https://example.com/api';
}

async function createJob(baseUrl, workflow, profile) {
    // Ensure baseUrl doesn't end with a slash
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const createJobUrl = `${cleanBaseUrl}/jobs`;
    const url = new URL(createJobUrl);
    url.searchParams.append('workflow', workflow);
    url.searchParams.append('profile', profile);

    console.info('POST Create Job:', { 
        url: url.toString(),
        params: {
            workflow,
            profile
        }
    });

    const jobResponse = await fetch(url.toString(), {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify([]) // Empty array as per the API spec
    });
    
    if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        throw new Error(`Failed to create job: ${jobResponse.status} ${errorText}`);
    }

    const jobData = await jobResponse.json();
    const jobId = jobData.jobId;
    console.info('Job created:', { 
        jobId,
        status: jobData.status
    });

    return jobId;
}
