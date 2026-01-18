// app/dashboard/components/AlertHandler.jsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';

export default function AlertHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Tunggu sebentar untuk memastikan DOM siap
    const timer = setTimeout(() => {
      const alertType = searchParams.get('alert');
      const message = searchParams.get('message');
      const userRole = searchParams.get('userRole');
      const attemptedPage = searchParams.get('attemptedPage');

      if (alertType === 'superadmin_required') {
        // Tampilkan SweetAlert toast kecil
        Swal.fire({
          title: '⛔ Akses Terbatas',
          html: `
            <div style="text-align: center;">
              <p style="margin-bottom: 10px; font-size: 14px;">
                <strong>${message || 'Hanya Super Admin yang dapat mengakses halaman ini'}</strong>
              </p>
              ${userRole ? `<p style="margin-bottom: 5px; font-size: 13px; color: #666;">
                Role Anda: <span style="background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${userRole}</span>
              </p>` : ''}
              ${attemptedPage ? `<p style="font-size: 12px; color: #888;">
                Halaman yang dicoba: <code>${attemptedPage}</code>
              </p>` : ''}
            </div>
          `,
          icon: 'warning',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 6000,
          timerProgressBar: true,
          background: '#fff3cd',
          color: '#856404',
          iconColor: '#ffc107',
          width: '400px',
          padding: '1rem',
          customClass: {
            popup: 'sweet-alert-toast',
            title: 'sweet-alert-title'
          },
          didOpen: () => {
            // Clean URL - hapus query params setelah alert ditampilkan
            const url = new URL(window.location);
            url.searchParams.delete('alert');
            url.searchParams.delete('message');
            url.searchParams.delete('userRole');
            url.searchParams.delete('attemptedPage');
            window.history.replaceState({}, '', url);
          }
        });
      }
      
      else if (alertType === 'client_redirect') {
        Swal.fire({
          title: '📊 Dialihkan',
          text: message || 'Anda telah dialihkan ke dashboard client',
          icon: 'info',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
          background: '#e3f2fd',
          color: '#1565c0',
          iconColor: '#2196f3'
        });
        
        const url = new URL(window.location);
        url.searchParams.delete('alert');
        url.searchParams.delete('message');
        window.history.replaceState({}, '', url);
      }

      else if (alertType === 'admin_client_redirect') {
        Swal.fire({
          title: '🚫 Tidak Diizinkan',
          text: message || 'Admin tidak dapat mengakses halaman client',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true
        });
        
        const url = new URL(window.location);
        url.searchParams.delete('alert');
        url.searchParams.delete('message');
        window.history.replaceState({}, '', url);
      }

    }, 100); // Delay 100ms untuk memastikan DOM siap

    return () => clearTimeout(timer);
  }, [searchParams]);

  // Tambahkan style untuk SweetAlert
  useEffect(() => {
    // Tambahkan style untuk SweetAlert toast
    const style = document.createElement('style');
    style.textContent = `
      .sweet-alert-toast {
        border-radius: 12px !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
        border: 1px solid rgba(0,0,0,0.1) !important;
      }
      .sweet-alert-title {
        font-size: 15px !important;
        margin-bottom: 8px !important;
      }
      .swal2-timer-progress-bar {
        background: rgba(0,0,0,0.2) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null; // Component ini tidak render apapun
}