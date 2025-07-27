/**
 * Login Page JavaScript Functions
 * Handles CPF formatting and gov.br login redirection
 */

/**
 * Initialize login page functionality
 */
function loginInit() {
    loginSetupCpfFormatting();
}

/**
 * Setup CPF input formatting
 */
function loginSetupCpfFormatting() {
    const loginCpfInput = document.getElementById('cpf');
    if (loginCpfInput) {
        loginCpfInput.addEventListener('input', function() {
            let v = loginCpfInput.value.replace(/\D/g, '');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            loginCpfInput.value = v;
        });
    }
}

/**
 * Force redirect to gov.br login
 */
function loginForceGovBr() {
    const currentUrl = new URL(window.location.href);
    const nextUrl = currentUrl.searchParams.get('next') || '/inicio';
    
    // Redirect to same URL but with gov.br indication
    window.location.href = `/login?force_govbr=1&next=${nextUrl}`;
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loginInit();
});
