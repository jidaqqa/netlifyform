// Global state to track files and translations
let filesArray = [];
let currentLanguage = document.documentElement.lang || 'en';

// DOM Elements
let form, fileInput, preview, fileList, noFilesMsg, dropZone, submitBtn, languageSelector, selectedFlag;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for i18n to be ready
    const checkI18n = setInterval(() => {
        if (window.i18next && i18next.isInitialized) {
            clearInterval(checkI18n);
            initApp();
        }
    }, 100);
    
    // Also listen for i18n initialization
    if (window.i18next) {
        i18next.on('initialized', initApp);
    }
});

function initApp() {
    //console.log('Initializing app...');
    
    // Initialize DOM elements
    form = document.querySelector('form');
    fileInput = document.getElementById('photos');
    preview = document.getElementById('preview');
    fileList = document.getElementById('file-list');
    noFilesMsg = fileList ? fileList.querySelector('.no-files') : null;
    dropZone = document.querySelector('.file-upload');
    submitBtn = document.querySelector('button[type="submit"]');
    languageSelector = document.getElementById('language-selector');
    selectedFlag = document.querySelector('.selected-flag');
    
    // console.log('DOM elements found:', {
    //     form: !!form,
    //     fileInput: !!fileInput,
    //     preview: !!preview,
    //     fileList: !!fileList,
    //     dropZone: !!dropZone
    // });
    
    // Initialize file upload UI
    updateFileList([]);
    
    // Initialize event listeners
    initEventListeners();
}

function initEventListeners() {
    //console.log('Initializing event listeners...');
    
    if (!fileInput || !preview || !dropZone) {
        console.error('Required elements for file upload not found');
        return;
    }
    
    // File input change event
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    // Form submission
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
    
    // Language change handler - preserve file state during translation updates
    i18next.on('languageChanged', (lng) => {
        currentLanguage = lng;
        console.log('Language changed to:', lng);
        
        // Re-render file list with updated translations but preserve files
        if (filesArray.length > 0) {
            updateFileListTranslations();
        }
    });
    
    // Initialize form validation
    initFormValidation();
    
    //console.log('Event listeners initialized');
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
    // Add event listeners to all required fields
    document.querySelectorAll('[required]').forEach(field => {
        // Validate on blur
        field.addEventListener('blur', validateField);
        
        // Clear validation on input
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

    // Special handling for file input
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (filesArray.length >= 2) {
                this.classList.remove('error');
                const errorMsg = this.nextElementSibling;
                if (errorMsg && errorMsg.classList.contains('validation-message')) {
                    errorMsg.style.display = 'none';
                }
            }
        });
    }
}

// Validate individual field
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

// Handle file selection
function handleFileSelect(e) {
    //console.log('File select triggered');
    e.stopPropagation();
    
    const newFiles = Array.from(e.target.files || []);
    //console.log('New files selected:', newFiles.length);
    
    if (newFiles.length === 0) return;
    
    // Filter for image files only
    const imageFiles = newFiles.filter(file => {
        const isImage = file.type && file.type.startsWith('image/');
        if (!isImage) {
            console.warn('Skipping non-image file:', file.name);
        }
        return isImage;
    });
    
    //console.log('Image files:', imageFiles.length);
    
    // Add new files to existing array (avoid duplicates)
    imageFiles.forEach(newFile => {
        const isDuplicate = filesArray.some(
            existingFile => 
                existingFile.name === newFile.name && 
                existingFile.size === newFile.size
        );
        
        if (!isDuplicate && filesArray.length < 10) {
            filesArray.push(newFile);
            //console.log('Added file:', newFile.name);
        } else if (isDuplicate) {
            console.log('Duplicate file skipped:', newFile.name);
        } else {
            console.log('File limit reached, skipping:', newFile.name);
        }
    });
    
    // Update UI
    updateFileList(filesArray);
    
    // Reset input to allow re-selecting same files
    e.target.value = '';
}

// Handle file drop
function handleDrop(e) {
    //console.log('File drop triggered');
    e.preventDefault();
    e.stopPropagation();
    
    const newFiles = Array.from(e.dataTransfer.files || []);
    //console.log('Dropped files:', newFiles.length);
    
    if (newFiles.length === 0) return;
    
    // Filter for image files only
    const imageFiles = newFiles.filter(file => file.type && file.type.startsWith('image/'));
    //console.log('Image files dropped:', imageFiles.length);
    
    // Add new files to existing array (avoid duplicates)
    imageFiles.forEach(newFile => {
        const isDuplicate = filesArray.some(
            existingFile => 
                existingFile.name === newFile.name && 
                existingFile.size === newFile.size
        );
        
        if (!isDuplicate && filesArray.length < 10) {
            filesArray.push(newFile);
        }
    });
    
    // Update UI
    updateFileList(filesArray);
}

// Update file list and preview
function updateFileList(files) {
    //console.log('Updating file list with', files.length, 'files');
    
    if (!files || files.length === 0) {
        filesArray = [];
        if (fileList) fileList.classList.add('empty');
        if (noFilesMsg) {
            noFilesMsg.style.display = 'block';
            // Update "no files" message with current translation
            const key = noFilesMsg.getAttribute('data-i18n');
            if (key && window.i18next && i18next.isInitialized) {
                noFilesMsg.textContent = i18next.t(key);
            }
        }
        if (preview) preview.innerHTML = '';
        if (fileInput) fileInput.value = '';
        return;
    }
    
    // Update files array
    filesArray = files.filter(file => file && file.type && file.type.startsWith('image/'));
    //console.log('Filtered files array:', filesArray.length);
    
    // Update file count and no-files message
    if (fileList) {
        fileList.classList.toggle('empty', filesArray.length === 0);
    }
    if (noFilesMsg) {
        noFilesMsg.style.display = filesArray.length > 0 ? 'none' : 'block';
    }
    
    // Update preview
    updateFilePreview();
    
    // Update the actual file input
    updateFileInput();
}

// Separate function to update just the preview (for better performance)
function updateFilePreview() {
    //if (!preview) return;
    
    //console.log('Updating file preview');
    preview.innerHTML = '';
    
    filesArray.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            // Get current translations for accessibility
            const removeText = (window.i18next && i18next.isInitialized) 
                ? i18next.t('form.fields.removeImage', 'Remove image') 
                : 'Remove image';
            const previewAlt = (window.i18next && i18next.isInitialized) 
                ? i18next.t('form.fields.previewAlt', 'Image preview') 
                : 'Image preview';
            
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="${previewAlt}">
                <button type="button" class="remove-btn" data-index="${index}" 
                        aria-label="${removeText}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            preview.appendChild(previewItem);
            
            // Add remove button functionality
            const removeBtn = previewItem.querySelector('.remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFile(index);
                });
            }
        };
        
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
        };
        
        reader.readAsDataURL(file);
    });
}

// Update the file input element with current files
function updateFileInput() {
    if (!fileInput) return;
    
    try {
        const dataTransfer = new DataTransfer();
        filesArray.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
        //console.log('File input updated with', fileInput.files.length, 'files');
    } catch (error) {
        console.error('Error updating file input:', error);
    }
}

// Update translations in file list without re-rendering files
function updateFileListTranslations() {
    //console.log('Updating file list translations');
    
    // Update "no files" message
    if (noFilesMsg) {
        const key = noFilesMsg.getAttribute('data-i18n');
        if (key && window.i18next && i18next.isInitialized) {
            noFilesMsg.textContent = i18next.t(key);
        }
    }
    
    // Update remove button labels in preview
    const removeButtons = preview ? preview.querySelectorAll('.remove-btn') : [];
    const removeText = (window.i18next && i18next.isInitialized) 
        ? i18next.t('form.fields.removeImage', 'Remove image') 
        : 'Remove image';
    
    removeButtons.forEach(btn => {
        btn.setAttribute('aria-label', removeText);
    });
    
    // Update image alt texts
    const previewImages = preview ? preview.querySelectorAll('img') : [];
    const previewAlt = (window.i18next && i18next.isInitialized) 
        ? i18next.t('form.fields.previewAlt', 'Image preview') 
        : 'Image preview';
    
    previewImages.forEach(img => {
        img.setAttribute('alt', previewAlt);
    });
}

// Remove file from selection
function removeFile(index) {
    //console.log('Removing file at index:', index);
    
    if (index >= 0 && index < filesArray.length) {
        // Remove file from array
        filesArray.splice(index, 1);
        //console.log('Files remaining:', filesArray.length);
        
        // Update UI
        updateFileList(filesArray);
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    console.log('Form submission started');
    e.preventDefault();
    
    // Reset previous errors
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.validation-message').forEach(el => el.remove());
    
    // Validate all fields
    let isValid = true;
    document.querySelectorAll('[required]').forEach(field => {
        if (field.id !== 'photos') { // Skip file input, validate separately
            const event = new Event('blur');
            field.dispatchEvent(event);
            if (field.classList.contains('error')) {
                isValid = false;
            }
        }
    });
    
    // Validate minimum 2 photos
    const fileCount = filesArray.length;
    console.log('File count for validation:', fileCount);
    
    if (fileCount < 2) {
        isValid = false;
        const fileUpload = document.querySelector('.file-upload');
        if (fileUpload) {
            fileUpload.classList.add('error');
            
            // Create and show error message with translation
            const errorMsg = document.createElement('div');
            errorMsg.className = 'validation-message';
            const errorText = (window.i18next && i18next.isInitialized) 
                ? i18next.t('validation.minPhotos', { count: 2 }, 'Please upload at least 2 photos')
                : 'Please upload at least 2 photos';
            errorMsg.textContent = errorText;
            errorMsg.style.color = '#e53e3e';
            errorMsg.style.marginTop = '5px';
            errorMsg.style.fontSize = '0.8rem';
            
            // Remove existing error message if present
            const existingError = fileUpload.parentNode.querySelector('.validation-message');
            if (existingError) {
                existingError.remove();
            }
            
            fileUpload.parentNode.insertBefore(errorMsg, fileUpload.nextSibling);
            fileUpload.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    if (!isValid) {
        console.log('Form validation failed');
        // Scroll to first error
        const firstError = document.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${submitBtn.textContent.trim()}`;
        
        try {
            // For Netlify forms, we need to let the form submit naturally
            // after we've validated everything and prepared the files
            
            // Create a hidden file input to hold our files
            const hiddenFileInput = document.createElement('input');
            hiddenFileInput.type = 'file';
            hiddenFileInput.name = 'photos';
            hiddenFileInput.multiple = true;
            hiddenFileInput.style.display = 'none';
            
            // Create a DataTransfer object to hold our files
            const dataTransfer = new DataTransfer();
            filesArray.forEach(file => dataTransfer.items.add(file));
            hiddenFileInput.files = dataTransfer.files;
            
            // Add the hidden file input to the form
            form.appendChild(hiddenFileInput);
            
            // Submit the form normally - Netlify will handle the rest
            form.submit();
            
        } catch (error) {
            console.error('Form submission error:', error);
            alert('There was an error submitting the form. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// Drag and drop helper functions
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    if (dropZone) dropZone.classList.add('highlight');
}

function unhighlight() {
    if (dropZone) dropZone.classList.remove('highlight');
}