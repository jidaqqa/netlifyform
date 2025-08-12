// ===== UPLOAD ON FORM SUBMIT - BETTER APPROACH =====

// Cloudinary Configuration - REPLACE WITH YOUR ACTUAL VALUES
const CLOUDINARY_CONFIG = {
    cloudName: 'dcrnss2rk', // Replace with your Cloudinary cloud name
    uploadPreset: 'car_photos', // Replace with your unsigned upload preset
};

// Global state
let currentLanguage = document.documentElement.lang || 'nl';
let selectedFiles = []; // Store files until form submission
let isSubmitting = false;

// DOM Elements
let form, submitBtn, languageSelector, selectedFlag;
let fileUploadArea, fileInput, filePreview, uploadProgress, uploadProgressBar, uploadStatus, uploadSummary, imageCount;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const checkI18n = setInterval(() => {
        if (window.i18next && i18next.isInitialized) {
            clearInterval(checkI18n);
            initApp();
        }
    }, 100);
    
    if (window.i18next) {
        i18next.on('initialized', initApp);
    }
});

function initApp() {
    initDOMElements();
    initEventListeners();
    initFormValidation();
}

function initDOMElements() {
    form = document.querySelector('form');
    submitBtn = document.querySelector('button[type="submit"]');
    languageSelector = document.getElementById('language-selector');
    selectedFlag = document.querySelector('.selected-flag');
    
    // File upload elements
    fileUploadArea = document.getElementById('file-upload-area');
    fileInput = document.getElementById('vehicle-photos');
    filePreview = document.getElementById('file-preview');
    uploadProgress = document.getElementById('upload-progress');
    uploadProgressBar = document.getElementById('upload-progress-bar');
    uploadStatus = document.getElementById('upload-status');
    uploadSummary = document.getElementById('upload-summary');
    imageCount = document.getElementById('image-count');
}

function initEventListeners() {
    // Form submission - NOW HANDLES UPLOADS
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Language selector
    if (languageSelector && selectedFlag) {
        updateFlag(languageSelector.value);
        languageSelector.addEventListener('change', function() {
            updateFlag(this.value);
            i18next.changeLanguage(this.value);
        });
    }
    
    // Language change handler
    i18next.on('languageChanged', (lng) => {
        currentLanguage = lng;
        console.log('Language changed to:', lng);
    });

    // File selection events - NO UPLOAD, JUST PREVIEW
    initFileSelectionEvents();
}

function initFileSelectionEvents() {
    if (!fileInput) {
        console.error('File input not found!');
        return;
    }

    console.log('Initializing file selection events...');

    // Upload button click
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
        uploadBtn.replaceWith(uploadBtn.cloneNode(true));
        const newUploadBtn = document.getElementById('upload-btn');
        
        newUploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Upload button clicked - opening file picker');
            fileInput.click();
        });
    }

    // File selection - ONLY PREVIEW, NO UPLOAD
    fileInput.addEventListener('change', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Files selected:', e.target.files.length);
        
        const files = e.target.files;
        if (files && files.length > 0) {
            addFilesToSelection(files);
            e.target.value = ''; // Clear input for next selection
        }
    });

    // Drag and drop
    if (fileUploadArea) {
        fileUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            fileUploadArea.classList.add('dragover');
        });

        fileUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!fileUploadArea.contains(e.relatedTarget)) {
                fileUploadArea.classList.remove('dragover');
            }
        });

        fileUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            fileUploadArea.classList.remove('dragover');
            
            console.log('Files dropped');
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                addFilesToSelection(files);
            }
        });
    }
}

function addFilesToSelection(files) {
    console.log('Adding files to selection:', files.length);
    
    const maxFiles = 8;
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    // Check if adding these files would exceed the limit
    if (selectedFiles.length + files.length > maxFiles) {
        showStatus(`Maximum ${maxFiles} photos allowed. You can add ${maxFiles - selectedFiles.length} more.`, 'error');
        return;
    }

    const validFiles = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('Validating file:', file.name, 'Type:', file.type, 'Size:', file.size);
        
        // Check file type
        if (!allowedTypes.includes(file.type)) {
            showStatus(`File ${file.name} is not a valid image type. Please use JPG, PNG, or WebP.`, 'error');
            continue;
        }
        
        // Check file size
        if (file.size > maxSize) {
            showStatus(`File ${file.name} is too large. Maximum size is 10MB.`, 'error');
            continue;
        }
        
        // Check for duplicates (by name and size)
        const isDuplicate = selectedFiles.some(existingFile => 
            existingFile.name === file.name && existingFile.size === file.size
        );
        
        if (isDuplicate) {
            showStatus(`File ${file.name} is already selected.`, 'warning');
            continue;
        }
        
        validFiles.push(file);
    }

    console.log('Valid files to add:', validFiles.length);

    if (validFiles.length > 0) {
        // Add files to selection
        selectedFiles.push(...validFiles);
        
        // Create previews for new files
        validFiles.forEach(file => createFilePreview(file));
        
        updateFileSummary();
        showStatus(`Added ${validFiles.length} file(s). Total: ${selectedFiles.length}`, 'success');
    }
}

function createFilePreview(file) {
    const previewId = 'preview-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item ready-to-upload';
    previewItem.id = previewId;
    
    // Store file reference in the preview element
    previewItem.fileReference = file;
    
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.title = 'Remove this image';
    removeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        removeFileFromSelection(previewId, file);
    });
    
    // Add file info overlay
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    fileInfo.innerHTML = `
        <span class="file-name">${file.name}</span>
        <span class="file-size">${formatFileSize(file.size)}</span>
        <span class="file-status">Ready to upload</span>
    `;
    
    previewItem.appendChild(img);
    previewItem.appendChild(removeBtn);
    previewItem.appendChild(fileInfo);
    
    if (filePreview) {
        filePreview.appendChild(previewItem);
    }
    
    return previewId;
}

function removeFileFromSelection(previewId, fileToRemove) {
    console.log('Removing file from selection:', fileToRemove.name);
    
    // Remove from selected files array
    selectedFiles = selectedFiles.filter(file => file !== fileToRemove);
    
    // Remove preview element
    const previewItem = document.getElementById(previewId);
    if (previewItem) {
        // Clean up object URL
        const img = previewItem.querySelector('img');
        if (img && img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
        }
        previewItem.remove();
    }
    
    updateFileSummary();
    showStatus(`Removed ${fileToRemove.name}`, 'info');
}

function updateFileSummary() {
    const totalFiles = selectedFiles.length;
    
    if (uploadSummary && imageCount) {
        if (totalFiles > 0) {
            uploadSummary.style.display = 'flex';
            
            let countText;
            if (totalFiles === 1) {
                countText = `1 photo selected (ready to upload)`;
            } else {
                countText = `${totalFiles} photos selected (ready to upload)`;
            }
            
            imageCount.textContent = countText;
            imageCount.className = 'upload-count ready';
        } else {
            uploadSummary.style.display = 'none';
        }
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// FORM SUBMISSION - NOW HANDLES UPLOADS
async function handleFormSubmit(e) {
    e.preventDefault(); // Always prevent default first
    
    if (isSubmitting) {
        console.log('Form already being submitted, ignoring');
        return false;
    }
    
    console.log('=== Form submission started ===');
    isSubmitting = true;
    
    // Validate form fields first
    if (!validateForm()) {
        console.log('Form validation failed');
        isSubmitting = false;
        return false;
    }
    
    // Show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Processing...</span>`;
    }
    
    // Upload images if any are selected
    let uploadedImageUrls = [];
    if (selectedFiles.length > 0) {
        console.log('Uploading', selectedFiles.length, 'images before form submission');
        uploadedImageUrls = await uploadAllImages();
        
        if (uploadedImageUrls === null) {
            // Upload failed
            console.log('Image upload failed, aborting form submission');
            resetSubmitButton();
            isSubmitting = false;
            return false;
        }
    }
    
    // Update hidden field with uploaded URLs, each on a new line
    const hiddenField = document.getElementById('vehicle-images');
    if (hiddenField) {
        // Join the array with newline characters
        hiddenField.value = uploadedImageUrls.join('\n');
        console.log('Updated hidden field with', uploadedImageUrls.length, 'image URLs, one per line');
    }
    
    // Update form action with language
    const currentLang = i18next.language || 'en';
    const successUrl = new URL('/success.html', window.location.origin);
    successUrl.searchParams.set('lang', currentLang);
    form.action = successUrl.toString();
    
    console.log('Submitting form with', uploadedImageUrls.length, 'uploaded images');
    
    // Submit the form
    form.submit();
    
    return true;
}

async function uploadAllImages() {
    if (selectedFiles.length === 0) {
        return [];
    }
    
    console.log('=== Starting batch image upload ===');
    showUploadProgress();
    
    const uploadedUrls = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const previewItem = findPreviewByFile(file);
        
        try {
            console.log(`Uploading ${i + 1}/${selectedFiles.length}: ${file.name}`);
            
            // Update preview status
            if (previewItem) {
                previewItem.className = 'preview-item uploading';
                const statusEl = previewItem.querySelector('.file-status');
                if (statusEl) statusEl.textContent = 'Uploading...';
            }
            
            showStatus(`Uploading ${file.name}... (${i + 1}/${selectedFiles.length})`, 'info');
            
            const cloudinaryUrl = await uploadToCloudinary(file, (progress) => {
                updateProgressBar(((i * 100) + progress) / selectedFiles.length);
            });
            
            uploadedUrls.push(cloudinaryUrl);
            successCount++;
            
            // Update preview status
            if (previewItem) {
                previewItem.className = 'preview-item uploaded';
                const statusEl = previewItem.querySelector('.file-status');
                if (statusEl) statusEl.textContent = 'Uploaded ✓';
            }
            
            console.log(`Upload successful (${successCount}/${selectedFiles.length}):`, file.name);
            
        } catch (error) {
            console.error(`Upload failed for ${file.name}:`, error);
            failCount++;
            
            // Update preview status
            if (previewItem) {
                previewItem.className = 'preview-item error';
                const statusEl = previewItem.querySelector('.file-status');
                if (statusEl) statusEl.textContent = 'Upload failed ✗';
            }
            
            showStatus(`Failed to upload ${file.name}: ${error.message}`, 'error');
        }
        
        updateProgressBar(((i + 1) * 100) / selectedFiles.length);
    }
    
    hideUploadProgress();
    
    console.log('=== Upload batch completed ===');
    console.log('Success:', successCount, 'Failed:', failCount);
    
    if (failCount > 0) {
        const retry = confirm(`${failCount} image(s) failed to upload. Do you want to retry just the failed uploads, or submit the form with the ${successCount} successful uploads?`);
        
        if (retry) {
            // Retry failed uploads
            const failedFiles = selectedFiles.filter(file => {
                const previewItem = findPreviewByFile(file);
                return previewItem && previewItem.classList.contains('error');
            });
            
            selectedFiles = failedFiles;
            return await uploadAllImages(); // Recursive retry
        } else if (successCount === 0) {
            // No successful uploads and user doesn't want to retry
            return null; // Signal failure
        }
        // Continue with successful uploads only
    }
    
    if (successCount > 0) {
        showStatus(`Successfully uploaded ${successCount} image(s)!`, 'success');
    }
    
    return uploadedUrls;
}

function findPreviewByFile(file) {
    const previews = document.querySelectorAll('.preview-item');
    for (let preview of previews) {
        if (preview.fileReference === file) {
            return preview;
        }
    }
    return null;
}

async function uploadToCloudinary(file, onProgress) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const progress = (e.loaded / e.total) * 100;
                onProgress(progress);
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response.secure_url);
                } catch (e) {
                    reject(new Error('Invalid response from server'));
                }
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });
        
        xhr.addEventListener('timeout', () => {
            reject(new Error('Upload timeout'));
        });
        
        xhr.timeout = 120000; // 2 minute timeout for form submission
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`);
        xhr.send(formData);
    });
}

function validateForm() {
    // Reset previous errors
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.validation-message').forEach(el => el.remove());
    
    // Validate all required fields
    let isValid = true;
    document.querySelectorAll('[required]').forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        const firstError = document.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        showStatus('Please fill in all required fields.', 'error');
    }
    
    return isValid;
}

function resetSubmitButton() {
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-paper-plane"></i> <span data-i18n="form.buttons.submit">Submit</span>`;
    }
}

function showUploadProgress() {
    if (uploadProgress) {
        uploadProgress.style.display = 'block';
        if (uploadProgressBar) {
            uploadProgressBar.style.width = '0%';
        }
    }
}

function hideUploadProgress() {
    setTimeout(() => {
        if (uploadProgress) {
            uploadProgress.style.display = 'none';
        }
    }, 1000);
}

function updateProgressBar(percentage) {
    if (uploadProgressBar) {
        uploadProgressBar.style.width = Math.min(100, Math.max(0, percentage)) + '%';
    }
}

function showStatus(message, type) {
    console.log('Status:', type, '-', message);
    if (uploadStatus) {
        uploadStatus.textContent = message;
        uploadStatus.className = `upload-status ${type}`;
        uploadStatus.style.display = 'block';
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                if (uploadStatus) {
                    uploadStatus.style.display = 'none';
                }
            }, 3000);
        }
    }
}

// Update flag emoji based on selected language
function updateFlag(lang) {
    const flagMap = {
        'en': '🇬🇧',
        'fr': '🇫🇷',
        'nl': '🇳🇱'
    };
    if (selectedFlag && flagMap[lang]) {
        selectedFlag.textContent = flagMap[lang];
    }
}

function initFormValidation() {
    document.querySelectorAll('[required]').forEach(field => {
        field.addEventListener('blur', validateField);
        
        field.addEventListener('input', function() {
            if (this.value.trim()) {
                this.classList.remove('error');
                const errorMsg = this.nextElementSibling;
                if (errorMsg && errorMsg.classList.contains('validation-message')) {
                    errorMsg.style.display = 'none';
                }
            }
        });
    });
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const isValid = field.checkValidity();
    
    if (!isValid || (field.required && !value)) {
        field.classList.add('error');
        let errorMsg = field.nextElementSibling;
        
        if (!errorMsg || !errorMsg.classList.contains('validation-message')) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'validation-message';
            errorMsg.textContent = field.validationMessage || 'This field is required';
            field.parentNode.insertBefore(errorMsg, field.nextSibling);
        }
        errorMsg.style.display = 'block';
        return false;
    }
    
    field.classList.remove('error');
    const errorMsg = field.nextElementSibling;
    if (errorMsg && errorMsg.classList.contains('validation-message')) {
        errorMsg.style.display = 'none';
    }
    return true;
}