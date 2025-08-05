document.addEventListener('DOMContentLoaded', function() {
    // File Upload Preview
    const fileInput = document.getElementById('photos');
    const fileCount = document.getElementById('file-count');
    const preview = document.getElementById('preview');

    fileInput.addEventListener('change', function() {
        preview.innerHTML = '';
        const files = this.files;
        
        if (files.length > 0) {
            fileCount.textContent = `${files.length} file(s) selected`;
            
            Array.from(files).forEach(file => {
                if (!file.type.match('image.*')) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        } else {
            fileCount.textContent = '0 files selected';
        }
    });

    // Form Validation
    const form = document.querySelector('form');
    form.addEventListener('submit', function(e) {
        let isValid = true;
        
        // Check required fields
        document.querySelectorAll('[required]').forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = 'var(--error)';
                isValid = false;
            } else {
                field.style.borderColor = 'var(--border)';
            }
        });

        // Check file upload
        if (fileInput.files.length === 0) {
            fileInput.style.borderColor = 'var(--error)';
            isValid = false;
        } else {
            fileInput.style.borderColor = 'var(--border)';
        }

        if (!isValid) {
            e.preventDefault();
            alert('Please fill all required fields correctly.');
        }
    });
});