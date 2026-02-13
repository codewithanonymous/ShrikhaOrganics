document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('userForm');
    const submitBtn = document.querySelector('.submit-btn');
    const successMessage = document.getElementById('successMessage');

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearErrors();
        
        // Validate form
        if (validateForm()) {
            // Show loading state
            showLoading();

            const payload = buildPayload();
            
            try {
                const response = await fetch('http://localhost:5000/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    hideLoading();
                    showSuccess();
                    resetForm();
                } else {
                    hideLoading();
                    const data = await response.json().catch(() => ({}));
                    alert(data.error || 'There was a problem submitting the form. Please try again.');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                hideLoading();
                alert('Network error. Please try again.');
            }
        } else {
            // Scroll to first error for better UX
            addSmoothScroll();
        }
    });

    // Input focus effects
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            const icon = this.parentElement.querySelector('.input-icon');
            if (icon) {
                icon.style.fill = '#95d5b2';
            }
        });
        
        input.addEventListener('blur', function() {
            const icon = this.parentElement.querySelector('.input-icon');
            if (icon) {
                icon.style.fill = '#74c69d';
            }
        });
        
        // Clear error on input
        input.addEventListener('input', function() {
            clearInputError(this);
            
            // Real-time password validation
            if (this.id === 'password') {
                validatePasswordStrength(this.value);
            }
            
            // Real-time password confirmation validation
            if (this.id === 'confirmPassword') {
                const password = document.getElementById('password').value;
                validatePasswordMatch(this.value, password);
            }
        });
    });

    // Clear gender error on selection
    const radioInputs = document.querySelectorAll('.radio-input');
    radioInputs.forEach(radio => {
        radio.addEventListener('change', function() {
            clearGenderError();
        });
    });

    /**
     * Build payload for API
     */
    function buildPayload() {
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const genderInput = document.querySelector('input[name="gender"]:checked');
        const gender = genderInput ? genderInput.value : null;
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const country = document.getElementById('country').value.trim();
        const pincode = document.getElementById('pincode').value.trim();

        return {
            fullName,
            email,
            password,
            // Extra fields are sent for future use or logging
            phone,
            gender,
            address,
            city,
            state,
            country,
            pincode
        };
    }

    /**
     * Clear all form errors
     */
    function clearErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        const inputs = document.querySelectorAll('.form-input');
        
        errorMessages.forEach(msg => msg.style.display = 'none');
        inputs.forEach(input => input.classList.remove('error'));
        clearGenderError();
    }

    /**
     * Clear error for specific input
     */
    function clearInputError(input) {
        input.classList.remove('error');
        const errorMsg = input.parentElement.nextElementSibling;
        if (errorMsg && errorMsg.classList.contains('error-message')) {
            errorMsg.style.display = 'none';
        }
    }

    /**
     * Clear gender error
     */
    function clearGenderError() {
        const genderError = document.querySelector('.radio-group').parentElement.querySelector('.error-message');
        if (genderError) {
            genderError.style.display = 'none';
        }
    }

    /**
     * Validate the entire form
     */
    function validateForm() {
        let isValid = true;
        const formData = new FormData(form);
        
        // Check required fields
        for (let [key, value] of formData.entries()) {
            if (!value.trim()) {
                showInputError(key, 'Please enter your ' + getFieldName(key));
                isValid = false;
            }
        }
        
        // Check gender selection
        const genderSelected = document.querySelector('input[name="gender"]:checked');
        if (!genderSelected) {
            showGenderError();
            isValid = false;
        }
        
        // Email validation
        const email = document.getElementById('email').value;
        if (email && !isValidEmail(email)) {
            showInputError('email', 'Please enter a valid email address');
            isValid = false;
        }
        
        // Phone validation (basic)
        const phone = document.getElementById('phone').value;
        if (phone && !isValidPhone(phone)) {
            showInputError('phone', 'Please enter a valid phone number');
            isValid = false;
        }
        
        // Password validation
        const password = document.getElementById('password').value;
        if (password && !isValidPassword(password)) {
            showInputError('password', 'Password must be at least 8 characters long');
            isValid = false;
        }
        
        // Password confirmation validation
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (confirmPassword && password !== confirmPassword) {
            showInputError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }
        
        return isValid;
    }

    /**
     * Show error for specific input
     */
    function showInputError(fieldName, message) {
        const input = document.querySelector(`[name="${fieldName}"]`);
        if (input) {
            input.classList.add('error');
            const errorMsg = input.parentElement.nextElementSibling;
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.textContent = message;
                errorMsg.style.display = 'block';
            }
        }
    }

    /**
     * Show gender error
     */
    function showGenderError() {
        const genderError = document.querySelector('.radio-group').parentElement.querySelector('.error-message');
        if (genderError) {
            genderError.style.display = 'block';
        }
    }

    /**
     * Validate email format
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate phone format (basic)
     */
    function isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }

    /**
     * Validate password strength
     */
    function isValidPassword(password) {
        return password.length >= 8;
    }

    /**
     * Real-time password strength validation
     */
    function validatePasswordStrength(password) {
        const passwordInput = document.getElementById('password');
        const errorMsg = passwordInput.parentElement.nextElementSibling;
        
        if (password.length > 0 && password.length < 8) {
            passwordInput.classList.add('error');
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.textContent = 'Password must be at least 8 characters long';
                errorMsg.style.display = 'block';
            }
        } else {
            passwordInput.classList.remove('error');
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.style.display = 'none';
            }
        }
    }

    /**
     * Real-time password match validation
     */
    function validatePasswordMatch(confirmPassword, password) {
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const errorMsg = confirmPasswordInput.parentElement.nextElementSibling;
        
        if (confirmPassword.length > 0 && password !== confirmPassword) {
            confirmPasswordInput.classList.add('error');
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.textContent = 'Passwords do not match';
                errorMsg.style.display = 'block';
            }
        } else {
            confirmPasswordInput.classList.remove('error');
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.style.display = 'none';
            }
        }
    }

    /**
     * Get user-friendly field name
     */
    function getFieldName(fieldName) {
        const fieldNames = {
            'fullName': 'full name',
            'email': 'email address',
            'phone': 'phone number',
            'password': 'password',
            'confirmPassword': 'password confirmation',
            'address': 'address',
            'city': 'city',
            'state': 'state',
            'country': 'country',
            'pincode': 'pincode'
        };
        return fieldNames[fieldName] || fieldName;
    }

    /**
     * Show loading state
     */
    function showLoading() {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
    }

    /**
     * Hide loading state
     */
    function hideLoading() {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }

    /**
     * Show success message
     */
    function showSuccess() {
        showThankYouPopup();
    }

    /**
     * Show glassmorphism thank you popup
     */
    function showThankYouPopup() {
        const overlay = document.getElementById('thankYouOverlay');
        const thankYouBtn = document.getElementById('thankYouBtn');
        const countdownElement = document.getElementById('redirectCountdown');
        
        // Show the popup with animation
        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);
        
        // Handle continue button click
        thankYouBtn.addEventListener('click', function() {
            redirectToHomepage();
        });
        
        // Start countdown and fullscreen animation
        let countdown = 5;
        countdownElement.textContent = countdown;
        
        // Start fullscreen expansion after 1 second
        setTimeout(() => {
            overlay.classList.add('fullscreen');
        }, 1000);
        
        // Start countdown timer
        const countdownInterval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                redirectToHomepage();
            }
        }, 1000);
        
        // Also close on overlay click (but not during fullscreen)
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay && !overlay.classList.contains('fullscreen')) {
                redirectToHomepage();
            }
        });
    }

    /**
     * Redirect to homepage
     */
    function redirectToHomepage() {
        window.location.href = '/Website/index.html';
    }

    /**
     * Hide glassmorphism thank you popup
     */
    function hideThankYouPopup() {
        const overlay = document.getElementById('thankYouOverlay');
        overlay.classList.remove('show', 'fullscreen');
        
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }

    /**
     * Reset form
     */
    function resetForm() {
        form.reset();
    }

    /**
     * Add smooth scroll behavior for better mobile experience
     */
    function addSmoothScroll() {
        // Scroll to first error if validation fails
        const firstError = document.querySelector('.form-input.error, .radio-group');
        if (firstError) {
            firstError.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    /**
     * Handle mobile viewport issues
     */
    function handleMobileViewport() {
        // Prevent zoom on input focus (iOS)
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                if (window.innerWidth <= 600) {
                    document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
                }
            });
            
            input.addEventListener('blur', function() {
                document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
            });
        });
    }

    /**
     * Initialize mobile optimizations
     */
    function initMobileOptimizations() {
        handleMobileViewport();
        
        // Add touch feedback for mobile
        if ('ontouchstart' in window) {
            submitBtn.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });
            
            submitBtn.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        }
    }

    // Initialize mobile optimizations
    initMobileOptimizations();
});
