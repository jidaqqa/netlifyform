// Global state
let currentLanguage = document.documentElement.lang || 'en';

// DOM Elements
let form, submitBtn, languageSelector, selectedFlag;

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
    // Initialize DOM elements
    form = document.querySelector('form');
    submitBtn = document.querySelector('button[type="submit"]');
    languageSelector = document.getElementById('language-selector');
    selectedFlag = document.querySelector('.selected-flag');
    
    // Initialize event listeners
    initEventListeners();
}

function initEventListeners() {
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
    
    // Language change handler
    i18next.on('languageChanged', (lng) => {
        currentLanguage = lng;
        console.log('Language changed to:', lng);
    });
    
    // Initialize form validation
    initFormValidation();
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

// Handle form submission
function handleFormSubmit(e) {
    console.log('Form submission started');
    
    // Reset previous errors
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.validation-message').forEach(el => el.remove());
    
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
        console.log('Form validation failed');
        // Scroll to first error
        const firstError = document.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        e.preventDefault();
        return false;
    }
    
    // Show loading state on the submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${submitBtn.textContent.trim()}`;
    }
    
    // Let the form submit naturally
    return true;
}
