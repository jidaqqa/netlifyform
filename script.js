document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const form = document.querySelector('form');
    const fileInput = document.getElementById('photos');
    const preview = document.getElementById('preview');
    const fileList = document.getElementById('file-list');
    const noFilesMsg = fileList ? fileList.querySelector('.no-files') : null;
    const dropZone = document.querySelector('.file-upload');
    const submitBtn = document.querySelector('.submit-btn');
    const languageSelector = document.getElementById('language-selector');
    const selectedFlag = document.querySelector('.selected-flag');
    let filesArray = [];
    
    // Check if required elements exist
    if (!fileInput || !preview || !fileList || !dropZone) {
        console.error('Required elements for file upload not found');
        return;
    }
    
    // Initialize language selector
    if (languageSelector && selectedFlag) {
        // Set initial flag
        updateFlag(languageSelector.value);
        
        // Update flag when language changes
        languageSelector.addEventListener('change', function() {
            updateFlag(this.value);
        });
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

    // Initialize form validation
    initFormValidation();

    // File Upload Handling
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop functionality
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
    form.addEventListener('submit', handleFormSubmit);
    
    // Remove any next button click handlers since we're using a direct submit button now
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    }

    // Initialize tooltips and other UI elements
    initTooltips();

    // Initialize form validation
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
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                this.classList.remove('error');
                const errorMsg = this.nextElementSibling;
                if (errorMsg && errorMsg.classList.contains('validation-message')) {
                    errorMsg.style.display = 'none';
                }
            }
        });
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
        const newFiles = e.target.files;
        if (newFiles && newFiles.length > 0) {
            // Create a new array combining existing files with new ones
            const updatedFiles = Array.from(filesArray);
            
            // Add new files, checking for duplicates
            Array.from(newFiles).forEach(newFile => {
                // Check if file already exists by name and size
                const isDuplicate = filesArray.some(
                    existingFile => 
                        existingFile.name === newFile.name && 
                        existingFile.size === newFile.size &&
                        existingFile.lastModified === newFile.lastModified
                );
                
                if (!isDuplicate) {
                    updatedFiles.push(newFile);
                }
            });
            
            // Update the file input with all files
            const dataTransfer = new DataTransfer();
            updatedFiles.forEach(file => dataTransfer.items.add(file));
            fileInput.files = dataTransfer.files;
            
            // Update the UI with all files
            updateFileList(updatedFiles);
        }
    }

    // Handle file drop
    function handleDrop(e) {
        e.preventDefault();
        const dt = e.dataTransfer;
        const newFiles = dt.files;
        if (newFiles && newFiles.length > 0) {
            // Create a new array combining existing files with new ones
            const updatedFiles = Array.from(filesArray);
            
            // Add new files, checking for duplicates
            Array.from(newFiles).forEach(newFile => {
                // Check if file already exists by name and size
                const isDuplicate = filesArray.some(
                    existingFile => 
                        existingFile.name === newFile.name && 
                        existingFile.size === newFile.size &&
                        existingFile.lastModified === newFile.lastModified
                );
                
                if (!isDuplicate) {
                    updatedFiles.push(newFile);
                }
            });
            
            // Update the file input with all files
            const dataTransfer = new DataTransfer();
            updatedFiles.forEach(file => dataTransfer.items.add(file));
            fileInput.files = dataTransfer.files;
            
            // Update the UI with all files
            updateFileList(updatedFiles);
        }
    }

    // Update file list and preview
    function updateFileList(files) {
        if (!files || files.length === 0) return;
        
        // Convert to array and filter for images only
        filesArray = Array.from(files).filter(file => file.type.match('image.*'));
        
        console.log('Updating file list with', filesArray.length, 'images');
        
        // Update file count and no-files message
        if (filesArray.length > 0) {
            fileList.classList.remove('empty');
            if (noFilesMsg) noFilesMsg.style.display = 'none';
        } else {
            fileList.classList.add('empty');
            if (noFilesMsg) noFilesMsg.style.display = 'block';
        }
        
        // Update preview
        preview.innerHTML = '';
        
        // Process each file
        const processFile = (file, index) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <button type="button" class="remove-btn" data-index="${index}" aria-label="Remove image">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    preview.appendChild(previewItem);
                    
                    // Add remove button functionality
                    const removeBtn = previewItem.querySelector('.remove-btn');
                    removeBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFile(index);
                    });
                    
                    resolve();
                };
                reader.onerror = (error) => {
                    console.error('Error reading file:', error);
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        };
        
        // Process all files sequentially to avoid overwhelming the browser
        const processAllFiles = async () => {
            for (let i = 0; i < filesArray.length; i++) {
                await processFile(filesArray[i], i);
            }
            
            // Update the file input with the filtered files
            const dataTransfer = new DataTransfer();
            filesArray.forEach(file => dataTransfer.items.add(file));
            fileInput.files = dataTransfer.files;
            
            console.log('File list updated with', filesArray.length, 'images');
        };
        
        processAllFiles();
    }

    // Remove file from selection
    function removeFile(index) {
        if (index >= 0 && index < filesArray.length) {
            // Remove the file from our array
            filesArray.splice(index, 1);
            
            // Update the file input
            const dataTransfer = new DataTransfer();
            filesArray.forEach(file => dataTransfer.items.add(file));
            fileInput.files = dataTransfer.files;
            
            // If no files left, reset the input to allow reselecting the same file
            if (filesArray.length === 0) {
                fileInput.value = ''; // This allows reselecting the same file
                if (noFilesMsg) noFilesMsg.style.display = 'block';
                if (fileList) fileList.classList.add('empty');
                preview.innerHTML = '';
            } else {
                // Update the UI with remaining files
                updateFileList(filesArray);
            }
        }
    }

    // Handle form submission
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate all fields
        let isValid = true;
        document.querySelectorAll('[required]').forEach(field => {
            const event = new Event('blur');
            field.dispatchEvent(event);
            if (field.classList.contains('error')) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            // Scroll to first error
            const firstError = document.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        // Show loading state
        const submitBtn = document.getElementById('submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + submitBtn.textContent.trim();
        
        try {
            // If we have files to upload, we need to handle the submission with JavaScript
            if (fileInput.files.length > 0) {
                const formData = new FormData(form);
                
                // Append files to the form data
                Array.from(fileInput.files).forEach((file, index) => {
                    formData.append(`file${index}`, file);
                });
                
                // Get current language
                const currentLang = document.documentElement.lang || 'en';
                
                // Submit the form data to Netlify
                fetch('/', {
                    method: 'POST',
                    body: formData,
                })
                .then(response => {
                    if (response.ok) {
                        // Redirect to success page with language parameter
                        window.location.href = `/success.html?lang=${currentLang}`;
                    } else {
                        throw new Error('Form submission failed');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('There was an error submitting the form. Please try again.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                });
            } else {
                // If no files, let Netlify handle the form submission normally
                form.submit();
            }
        } catch (error) {
            console.error('Error:', error);
            // Fallback to default form submission if JavaScript fails
            form.submit();
        }
    }

    // Drag and drop helpers
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

    // Initialize tooltips
    function initTooltips() {
        // Add any tooltip initialization code here
    }

    // Add animation to form sections
    const formSections = document.querySelectorAll('.form-section');
    formSections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
    });
});