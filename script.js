document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const form = document.querySelector('form');
    const fileInput = document.getElementById('photos');
    const preview = document.getElementById('preview');
    const submitBtn = document.querySelector('.submit-btn');
    const languageSelector = document.getElementById('language-selector');
    const selectedFlag = document.querySelector('.selected-flag');
    let filesArray = [];
    
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
    const dropZone = document.querySelector('.file-upload');
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
        const files = e.target.files;
        updateFileList(files);
    }

    // Handle file drop
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        updateFileList(files);
    }

    // Update file list and preview
    function updateFileList(files) {
        filesArray = Array.from(files);
        
        // Update file count
        fileCount.textContent = filesArray.length > 0 
            ? `${filesArray.length} file${filesArray.length > 1 ? 's' : ''} selected` 
            : 'No files selected';
        
        // Update preview
        preview.innerHTML = '';
        
        filesArray.forEach((file, index) => {
            if (!file.type.match('image.*')) return;
            
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
                removeBtn.addEventListener('click', () => removeFile(index));
            };
            reader.readAsDataURL(file);
        });
    }

    // Remove file from selection
    function removeFile(index) {
        filesArray.splice(index, 1);
        
        // Update the file input
        const dataTransfer = new DataTransfer();
        filesArray.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
        
        // Update the UI
        updateFileList(fileInput.files);
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
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Simulate form submission (replace with actual form submission)
        setTimeout(() => {
            // If you're using Netlify Forms, the form will be submitted automatically
            // If you need to handle the submission with JavaScript, uncomment the next line:
            // form.submit();
            
            // For demo purposes, we'll just show a success message
            console.log('Form submitted successfully!');
        }, 1500);
    }

    // Drag and drop helpers
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropZone.classList.add('drag-over');
    }

    function unhighlight() {
        dropZone.classList.remove('drag-over');
    }

    // Initialize tooltips
    function initTooltips() {
        // Add any tooltip initialization code here
        // Example: tippy('[data-tippy-content]');
    }

    // Add animation to form sections
    const formSections = document.querySelectorAll('.form-section');
    formSections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
    });
});