import Swal from 'sweetalert2'

export const showAlert = (options, darkMode = false) => {
    return Swal.fire({
        ...options,
        background: darkMode ? '#1e293b' : '#ffffff',
        color: darkMode ? '#e2e8f0' : '#0f172a',
        confirmButtonColor: darkMode ? '#2563eb' : '#1e40af',
        cancelButtonColor: darkMode ? '#475569' : '#6b7280',
        customClass: {
        popup: darkMode ? 'swal2-dark' : '',
        }
    })
    }