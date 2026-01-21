'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const translations = {
    // Login Page ONLY
    login: {

        loginErrors: {
        en: {
            USER_NOT_FOUND: 'User not found',
            INVALID_PASSWORD: 'Incorrect password',
            SERVER_ERROR: 'Something went wrong. Please try again.'
        },
        id: {
            USER_NOT_FOUND: 'Pengguna tidak ditemukan',
            INVALID_PASSWORD: 'Password salah',
            SERVER_ERROR: 'Terjadi kesalahan. Silakan coba lagi.'
        }
        },

        en: {
        welcomeBack: 'Welcome Back',
        pleaseLogin: 'Please login to continue',
        email: 'Email',
        emailPlaceholder: 'name@example.com',
        password: 'Password',
        passwordPlaceholder: '••••••••',
        loginButton: 'Login',
        loading: 'Loading...',
        // Alerts
        accessDenied: 'Access Denied',
        mustLogin: 'You must login first!',
        okay: 'Okay',
        userNotFound: 'User not found',
        checkEmail: 'Please check your email again!',
        incorrectPassword: 'Incorrect Password',
        tryAgain: 'Please try again.',
        loginSuccessful: 'Login Successful!',
        welcome: 'Welcome',
        errorOccurred: 'An error occurred'
        },
        id: {
        welcomeBack: 'Selamat Datang Kembali',
        pleaseLogin: 'Silakan login untuk melanjutkan',
        email: 'Email',
        emailPlaceholder: 'nama@example.com',
        password: 'Kata Sandi',
        passwordPlaceholder: '••••••••',
        loginButton: 'Masuk',
        loading: 'Memuat...',
        // Alerts
        accessDenied: 'Akses Ditolak',
        mustLogin: 'Anda harus login terlebih dahulu!',
        okay: 'Baik',
        userNotFound: 'Pengguna tidak ditemukan',
        checkEmail: 'Silakan periksa email Anda lagi!',
        incorrectPassword: 'Kata Sandi Salah',
        tryAgain: 'Silakan coba lagi.',
        loginSuccessful: 'Login Berhasil!',
        welcome: 'Selamat datang',
        errorOccurred: 'Terjadi kesalahan'
        }
    },

    // Layout
    layout: {  // ← UBAH DARI dashboard JADI layout
        en: {
        // Menu Items
        dashboard: 'Dashboard',
        products: 'Products',
        companies: 'Companies',
        customers: 'Customers',
        leads: 'Leads',
        deals: 'Deals',
        activities: 'Activities',
        tickets: 'Tickets',
        invoices: 'Invoices',
        services: 'Services',
        campaigns: 'Campaigns',
        teams: 'Teams',
        communications: 'Communications',
        manageAdmins: 'Manage Admins',
        logout: 'Logout',

        // Roles
        superAdmin: 'Super Admin',
        admin: 'Admin',

        // Alerts
        confirmLogout: 'Confirm Logout',
        logoutConfirm: 'Are you sure you want to log out?',
        yesLogout: 'Yes, Logout',
        cancel: 'Cancel',
        logoutSuccess: 'Logout successful!',
        seeYouAgain: 'See you again!',

        // Others
        loading: 'Loading...',
        accessDenied: 'Access Denied',
        mustLogin: 'You must login first!'
        },
        id: {
        // Menu Items
        dashboard: 'Beranda',
        products: 'Produk',
        companies: 'Perusahaan',
        customers: 'Pelanggan',
        leads: 'Prospek',
        deals: 'Transaksi',
        activities: 'Aktivitas',
        tickets: 'Tiket',
        invoices: 'Faktur',
        services: 'Layanan',
        campaigns: 'Kampanye',
        teams: 'Tim',
        communications: 'Komunikasi',
        manageAdmins: 'Kelola Admin',
        logout: 'Keluar',

        // Roles
        superAdmin: 'Super Admin',
        admin: 'Admin',

        // Alerts
        confirmLogout: 'Konfirmasi Keluar',
        logoutConfirm: 'Apakah Anda yakin ingin keluar?',
        yesLogout: 'Ya, Keluar',
        cancel: 'Batal',
        logoutSuccess: 'Berhasil keluar!',
        seeYouAgain: 'Sampai jumpa lagi!',

        // Others
        loading: 'Memuat...',
        accessDenied: 'Akses Ditolak',
        mustLogin: 'Anda harus login terlebih dahulu!'
        }
    },

    // Dashboard Home Page
    dashboard: {
        en: {
            // Banner
            welcomeBack: 'Welcome Back!',
            bannerSubtitle: 'Manage your CRM system efficiently from this dashboard',

            // Overview Section
            dashboardOverview: 'Dashboard Overview',
            overviewSubtitle: 'Select a menu from the sidebar to get started managing your CRM system.',

            // KPI Cards
            totalCustomers: 'Total Customers',
            dealsWon: 'Deals Won',
            openTickets: 'Open Tickets',
            activeServices: 'Active Services',
            wonDeals: "Won Deals",
            dealName: "Deal Name",
            customer: "Customer",
            amount: "Amount",
            status: "Status",
            won: "Won",
            noWonDeals: "No won deals found",

            // Loading States
            loadingDashboard: 'Loading dashboard data...',
            loadingCharts: 'Loading charts...'
        },
        id: {
            // Banner
            welcomeBack: 'Selamat Datang Kembali!',
            bannerSubtitle: 'Kelola sistem CRM Anda dengan efisien dimulai dari beranda ini',

            // Overview Section
            dashboardOverview: 'Ringkasan Beranda',
            overviewSubtitle: 'Pilih menu dari sidebar untuk mulai mengelola sistem CRM Anda.',

            // KPI Cards
            totalCustomers: 'Total Pelanggan',
            dealsWon: 'Transaksi Selesai',
            openTickets: 'Tiket Terbuka',
            activeServices: 'Layanan Aktif',
            wonDeals: "Transaksi Menang",
            dealName: "Nama Transaksi",
            customer: "Pelanggan",
            amount: "Jumlah",
            status: "Status",
            won: "Menang",
            noWonDeals: "Tidak ada transaksi yang menang",

            // Loading States
            loadingDashboard: 'Memuat data...',
            loadingCharts: 'Memuat grafik...'
        }
    },

    charts: {
        en: {
            activitiesBreakdown: 'Activities Breakdown',
            customerGrowth: 'Customer Growth per Month',
            dealsByStage: 'Deals by Stage',
            ticketsByStatus: 'Ticket Status Overview',

            // Ticket Status Labels
            open: 'Open',
            inProgress: 'In Progress',
            resolved: 'Resolved',
            closed: 'Closed',

            // Chart Labels
            status: 'Status',
            total: 'Total',
            tickets: 'Tickets',

            prospect: 'Prospect',
            negotiation: 'Negotiation',
            won: 'Won',
            lost: 'Lost',
            deals: 'Deals',
            count: 'Count',

            month: 'Month',
            customers: 'Customers',
            newCustomers: 'New Customers',

            // Month names
            january: 'January',
            february: 'February',
            march: 'March',
            april: 'April',
            may: 'May',
            june: 'June',
            july: 'July',
            august: 'August',
            september: 'September',
            october: 'October',
            november: 'November',
            december: 'December',

            // Short month names
            jan: 'Jan',
            feb: 'Feb',
            mar: 'Mar',
            apr: 'Apr',
            mayShort: 'May',
            jun: 'Jun',
            jul: 'Jul',
            aug: 'Aug',
            sep: 'Sep',
            oct: 'Oct',
            nov: 'Nov',
            dec: 'Dec',

            call: 'Call',
            meeting: 'Meeting',
            email: 'Email',
            followUp: 'Follow-Up',
            task: 'Task',
            note: 'Note',
            activities: 'Activities',
            activityCount: 'Activities'
        },

        id: {
            activitiesBreakdown: 'Rincian Aktivitas',
            customerGrowth: 'Pertumbuhan Pelanggan per Bulan',
            dealsByStage: 'Transaksi',
            ticketsByStatus: 'Status Tiket',

            // Ticket Status Labels
            open: 'Terbuka',
            inProgress: 'Dalam Proses',
            resolved: 'Selesai',
            closed: 'Ditutup',

            // Chart Labels
            status: 'Status',
            total: 'Total',
            tickets: 'Tiket',

            prospect: 'Prospek',
            negotiation: 'Negosiasi',
            won: 'Berhasil',
            lost: 'Gagal',
            deals: 'Transaksi',
            count: 'Jumlah',

            month: 'Bulan',
            customers: 'Pelanggan',
            newCustomers: 'Pelanggan Baru',

            // Month names
            january: 'Januari',
            february: 'Februari',
            march: 'Maret',
            april: 'April',
            may: 'Mei',
            june: 'Juni',
            july: 'Juli',
            august: 'Agustus',
            september: 'September',
            october: 'Oktober',
            november: 'November',
            december: 'Desember',

            // Short month names
            jan: 'Jan',
            feb: 'Feb',
            mar: 'Mar',
            apr: 'Apr',
            mayShort: 'Mei',
            jun: 'Jun',
            jul: 'Jul',
            aug: 'Agu',
            sep: 'Sep',
            oct: 'Okt',
            nov: 'Nov',
            dec: 'Des',

            call: 'Panggilan',
            meeting: 'Pertemuan',
            email: 'Email',
            followUp: 'Tindak Lanjut',
            task: 'Tugas',
            note: 'Catatan',
            activities: 'Aktivitas',
            activityCount: 'Aktivitas'
        }
    },

    activities: {
        en: {
        // Form
        editActivity: 'Edit Activity',
        addNewActivity: 'Add New Activity',
        activityType: 'Activity Type',
        selectActivityType: 'Select Activity Type',
        assignTo: 'Assign To',
        selectUser: 'Select Admin',
        notes: 'Notes',
        notesPlaceholder: 'Add activity notes or description...',
        updateActivity: 'Update Activity',
        addActivity: 'Add Activity',
        cancel: 'Cancel',
        searchActivities: 'Search Activities',
        searchUser: 'Search Admin',

        // Activity Types
        call: 'Call',
        meeting: 'Meeting',
        email: 'Email',
        followUp: 'Follow-Up',

        // Table
        activitiesList: 'Activities List',
        type: 'Type',
        dateTime: 'Date & Time',
        assignedTo: 'Assigned To',
        actions: 'Actions',
        noActivitiesYet: 'No activities yet',
        createFirst: 'Create your first activity above',

        // Loading & Messages
        loadingActivities: 'Loading activities...',

        // Alerts
        success: 'Success!',
        activityUpdated: 'Activity successfully updated!',
        activityAdded: 'Activity successfully added!',
        failed: 'Failed!',
        errorSaving: 'An error occurred while saving the activity.',
        deleteActivity: 'Delete this activity?',
        cannotUndo: 'This action cannot be undone.',
        yesDelete: 'Yes, delete it!',
        deleted: 'Deleted!',
        activityDeleted: 'Activity successfully deleted.',
        errorDeleting: 'Unable to delete the activity.'
        },

        id: {
        // Form
        editActivity: 'Edit Aktivitas',
        addNewActivity: 'Tambah Aktivitas Baru',
        activityType: 'Jenis Aktivitas',
        selectActivityType: 'Pilih Jenis Aktivitas',
        assignTo: 'Tugaskan Kepada',
        selectUser: 'Pilih Admin',
        notes: 'Catatan',
        notesPlaceholder: 'Tambahkan catatan atau deskripsi aktivitas...',
        updateActivity: 'Perbarui Aktivitas',
        addActivity: 'Tambah Aktivitas',
        cancel: 'Batal',
        searchActivities: 'Cari Aktivitas',
        searchUser: 'Cari Admin',

        // Activity Types
        call: 'Panggilan',
        meeting: 'Pertemuan',
        email: 'Email',
        followUp: 'Tindak Lanjut',

        // Table
        activitiesList: 'Daftar Aktivitas',
        type: 'Jenis',
        dateTime: 'Tanggal & Waktu',
        assignedTo: 'Ditugaskan Kepada',
        actions: 'Aksi',
        noActivitiesYet: 'Belum ada aktivitas',
        createFirst: 'Buat aktivitas pertama Anda di atas',

        // Loading & Messages
        loadingActivities: 'Memuat aktivitas...',

        // Alerts
        success: 'Berhasil!',
        activityUpdated: 'Aktivitas berhasil diperbarui!',
        activityAdded: 'Aktivitas berhasil ditambahkan!',
        failed: 'Gagal!',
        errorSaving: 'Terjadi kesalahan saat menyimpan aktivitas.',
        deleteActivity: 'Hapus aktivitas ini?',
        cannotUndo: 'Tindakan ini tidak dapat dibatalkan.',
        yesDelete: 'Ya, hapus!',
        deleted: 'Terhapus!',
        activityDeleted: 'Aktivitas berhasil dihapus.',
        errorDeleting: 'Tidak dapat menghapus aktivitas.'
        }
    },

    campaigns: {
        en: {
        // Form
        editCampaign: 'Edit Campaign',
        addNewCampaign: 'Add New Campaign',
        campaignName: 'Campaign Name',
        campaignNamePlaceholder: 'e.g., End Year Promo',
        channel: 'Channel',
        selectChannel: 'Select Channel',
        startDate: 'Start Date',
        endDate: 'End Date',
        budget: 'Budget (Rp)',
        budgetPlaceholder: 'e.g., 10000000',
        updateCampaign: 'Update Campaign',
        addCampaign: 'Add Campaign',
        cancel: 'Cancel',
        searchCampaigns: 'Search Campaigns',
        campaignPeriod: 'Campaign Period',

        // Channel Options
        email: 'Email',
        ads: 'Ads',
        sms: 'SMS',

        // Table
        campaignsList: 'Campaigns List',
        campaignNameHeader: 'Campaign Name',
        channelHeader: 'Channel',
        period: 'Period',
        budgetHeader: 'Budget',
        actions: 'Actions',
        noCampaignsYet: 'No campaigns yet',
        createFirst: 'Create your first campaign above',

        // Loading & Messages
        loadingCampaigns: 'Loading campaigns...',

        // Alerts
        warning: 'Warning!',
        allFieldsRequired: 'All fields are required.',
        success: 'Success!',
        campaignEdited: 'Campaign successfully edited!',
        campaignAdded: 'Campaign successfully added!',
        failed: 'Failed!',
        unableToSave: 'Unable to save the campaign.',
        error: 'Error!',
        connectionError: 'A connection error occurred.',
        deleteCampaign: 'Delete this campaign?',
        cannotUndo: 'This action cannot be undone.',
        yesDelete: 'Yes, delete it!',
        deleted: 'Deleted!',
        campaignDeleted: 'The campaign has been successfully deleted.',
        unableToDelete: 'Unable to delete the campaign.'
        },

        id: {
        // Form
        editCampaign: 'Edit Kampanye',
        addNewCampaign: 'Tambah Kampanye Baru',
        campaignName: 'Nama Kampanye',
        campaignNamePlaceholder: 'contoh: Promo Akhir Tahun',
        channel: 'Saluran',
        selectChannel: 'Pilih Saluran',
        startDate: 'Tanggal Mulai',
        endDate: 'Tanggal Selesai',
        budget: 'Anggaran (Rp)',
        budgetPlaceholder: 'contoh: 10000000',
        updateCampaign: 'Perbarui Kampanye',
        addCampaign: 'Tambah Kampanye',
        cancel: 'Batal',
        searchCampaigns: 'Cari Kampanye',
        campaignPeriod: 'Periode Campaign',

        // Channel Options
        email: 'Email',
        ads: 'Iklan',
        sms: 'SMS',

        // Table
        campaignsList: 'Daftar Kampanye',
        campaignNameHeader: 'Nama Kampanye',
        channelHeader: 'Saluran',
        period: 'Periode',
        budgetHeader: 'Anggaran',
        actions: 'Aksi',
        noCampaignsYet: 'Belum ada kampanye',
        createFirst: 'Buat kampanye pertama Anda di atas',

        // Loading & Messages
        loadingCampaigns: 'Memuat kampanye...',

        // Alerts
        warning: 'Peringatan!',
        allFieldsRequired: 'Semua kolom wajib diisi.',
        success: 'Berhasil!',
        campaignEdited: 'Kampanye berhasil diedit!',
        campaignAdded: 'Kampanye berhasil ditambahkan!',
        failed: 'Gagal!',
        unableToSave: 'Tidak dapat menyimpan kampanye.',
        error: 'Kesalahan!',
        connectionError: 'Terjadi kesalahan koneksi.',
        deleteCampaign: 'Hapus kampanye ini?',
        cannotUndo: 'Tindakan ini tidak dapat dibatalkan.',
        yesDelete: 'Ya, hapus!',
        deleted: 'Terhapus!',
        campaignDeleted: 'Kampanye telah berhasil dihapus.',
        unableToDelete: 'Tidak dapat menghapus kampanye.'
        }
    },

    communications: {
        en: {
        // Form
        editCommunication: 'Edit Communication',
        addNewCommunication: 'Add New Communication',
        customer: 'Customer',
        selectCustomer: 'Select Customer',
        communicationType: 'Communication Type',
        selectType: 'Select Type',
        content: 'Content',
        enterCommunicationContent: 'Enter communication content...',
        updateCommunication: 'Update Communication',
        addCommunication: 'Add Communication',
        cancel: 'Cancel',
        searchCommunications: 'Search Communications',
        searchCustomer: 'Search Customer',

        // Type Options
        email: 'Email',
        phone: 'Phone',
        chat: 'Chat',
        whatsapp: 'WhatsApp',

        // Table
        communicationsList: 'Communications List',
        customerHeader: 'Customer',
        type: 'Type',
        contentHeader: 'Content',
        timestamp: 'Timestamp',
        actions: 'Actions',
        noCommunicationsYet: 'No communications yet',
        createFirst: 'Create your first communication above',

        // Loading & Messages
        loadingCommunications: 'Loading communications...',

        // Alerts
        warning: 'Warning!',
        allFieldsRequired: 'All fields are required.',
        success: 'Success!',
        communicationAdded: 'Communication successfully added!',
        communicationUpdated: 'Communication successfully updated!',
        deleteCommunication: 'Delete this communication?',
        cannotUndo: 'This action cannot be undone.',
        yesDelete: 'Yes, delete it!',
        deleted: 'Deleted!',
        communicationDeleted: 'Communication successfully deleted.'
        },

        id: {
        // Form
        editCommunication: 'Edit Komunikasi',
        addNewCommunication: 'Tambah Komunikasi Baru',
        customer: 'Pelanggan',
        selectCustomer: 'Pilih Pelanggan',
        communicationType: 'Jenis Komunikasi',
        selectType: 'Pilih Jenis',
        content: 'Konten',
        enterCommunicationContent: 'Masukkan konten komunikasi...',
        updateCommunication: 'Perbarui Komunikasi',
        addCommunication: 'Tambah Komunikasi',
        cancel: 'Batal',
        searchCommunications: 'Cari Komunikasi',
        searchCustomer: 'Cari Pelanggan',

        // Type Options
        email: 'Email',
        phone: 'Telepon',
        chat: 'Chat',
        whatsapp: 'WhatsApp',

        // Table
        communicationsList: 'Daftar Komunikasi',
        customerHeader: 'Pelanggan',
        type: 'Jenis',
        contentHeader: 'Konten',
        timestamp: 'Waktu',
        actions: 'Aksi',
        noCommunicationsYet: 'Belum ada komunikasi',
        createFirst: 'Buat komunikasi pertama Anda di atas',

        // Loading & Messages
        loadingCommunications: 'Memuat komunikasi...',

        // Alerts
        warning: 'Peringatan!',
        allFieldsRequired: 'Semua kolom wajib diisi.',
        success: 'Berhasil!',
        communicationAdded: 'Komunikasi berhasil ditambahkan!',
        communicationUpdated: 'Komunikasi berhasil diperbarui!',
        deleteCommunication: 'Hapus komunikasi ini?',
        cannotUndo: 'Tindakan ini tidak dapat dibatalkan.',
        yesDelete: 'Ya, hapus!',
        deleted: 'Terhapus!',
        communicationDeleted: 'Komunikasi berhasil dihapus.'
        }
    },

    companies: {
        en: {
            // Form
            editCompany: 'Edit Company',
            addNewCompany: 'Add New Company',
            companyName: 'Company Name',
            companyNamePlaceholder: 'e.g., Tech Solutions Inc.',
            industry: 'Industry',
            industryPlaceholder: 'e.g., Technology, Finance',
            website: 'Website',
            websitePlaceholder: 'e.g., www.techsolutions.com',
            address: 'Address',
            addressPlaceholder: 'e.g., Jakarta, Indonesia',
            updateCompany: 'Update Company',
            addCompany: 'Add Company',
            cancel: 'Cancel',
            searchCompanies: 'Search Companies',

            // Table
            companiesList: 'Companies List',
            companyNameHeader: 'Company Name',
            industryHeader: 'Industry',
            websiteHeader: 'Website',
            addressHeader: 'Address',
            createdAt: 'Created At',
            actions: 'Actions',
            noCompaniesYet: 'No companies yet',
            createFirst: 'Create your first company above',

            // Loading & Messages
            loadingCompanies: 'Loading companies...',

            // Alerts
            success: 'Success!',
            companyUpdated: 'Company successfully updated!',
            companyAdded: 'Company successfully added!',
            failed: 'Failed!',
            unableToSave: 'Unable to save the company.',
            deleteCompany: 'Delete this company?',
            cannotUndo: 'This action cannot be undone.',
            yesDelete: 'Yes, delete it!',
            deleted: 'Deleted!',
            companyDeleted: 'Company successfully deleted.',
            unableToDelete: 'Unable to delete the company.'
        },
        id: {
            // Form
            editCompany: 'Edit Perusahaan',
            addNewCompany: 'Tambah Perusahaan Baru',
            companyName: 'Nama Perusahaan',
            companyNamePlaceholder: 'contoh: Tech Solutions Inc.',
            industry: 'Industri',
            industryPlaceholder: 'contoh: Teknologi, Keuangan',
            website: 'Website',
            websitePlaceholder: 'contoh: www.techsolutions.com',
            address: 'Alamat',
            addressPlaceholder: 'contoh: Jakarta, Indonesia',
            updateCompany: 'Perbarui Perusahaan',
            addCompany: 'Tambah Perusahaan',
            cancel: 'Batal',
            searchCompanies: 'Cari Perusahaan',

            // Table
            companiesList: 'Daftar Perusahaan',
            companyNameHeader: 'Nama Perusahaan',
            industryHeader: 'Industri',
            websiteHeader: 'Website',
            addressHeader: 'Alamat',
            createdAt: 'Dibuat Pada',
            actions: 'Aksi',
            noCompaniesYet: 'Belum ada perusahaan',
            createFirst: 'Buat perusahaan pertama Anda di atas',

            // Loading & Messages
            loadingCompanies: 'Memuat perusahaan...',

            // Alerts
            success: 'Berhasil!',
            companyUpdated: 'Perusahaan berhasil diperbarui!',
            companyAdded: 'Perusahaan berhasil ditambahkan!',
            failed: 'Gagal!',
            unableToSave: 'Tidak dapat menyimpan perusahaan.',
            deleteCompany: 'Hapus perusahaan ini?',
            cannotUndo: 'Tindakan ini tidak dapat dibatalkan.',
            yesDelete: 'Ya, hapus!',
            deleted: 'Terhapus!',
            companyDeleted: 'Perusahaan berhasil dihapus.',
            unableToDelete: 'Tidak dapat menghapus perusahaan.'
        }
    },

    deals: {
        en: {
        // Form
        editDeal: 'Edit Deal',
        addNewDeal: 'Add New Deal',
        dealName: 'Deal Name',
        dealNamePlaceholder: 'e.g., Enterprise Software License',
        dealStage: 'Deal Stage',
        selectStage: 'Select Stage',
        dealValue: 'Deal Value (Rp)',
        dealValuePlaceholder: 'e.g., 50000000',
        expectedCloseDate: 'Expected Close Date',
        customer: 'Customer',
        selectCustomer: 'Select Customer',
        company: 'Company',
        selectCompany: 'Select Company',
        updateDeal: 'Update Deal',
        addDeal: 'Add Deal',
        cancel: 'Cancel',
        searchDeals: 'Search Deals',
        searchCustomer: 'Search Customer',
        searchCompany: 'Search Company',

        // Deal Stages
        prospect: 'Prospect',
        negotiation: 'Negotiation',
        won: 'Won',
        lost: 'Lost',

        // Table
        dealsList: 'Deals List',
        dealNameHeader: 'Deal Name',
        stage: 'Stage',
        value: 'Value',
        customerHeader: 'Customer',
        companyHeader: 'Company',
        closeDate: 'Close Date',
        actions: 'Actions',
        noDealsYet: 'No deals yet',
        createFirst: 'Create your first deal above',

        // Loading & Messages
        loadingDeals: 'Loading deals...',

        // Alerts
        success: 'Success!',
        dealUpdated: 'Deal successfully updated!',
        dealAdded: 'Deal successfully added!',
        failed: 'Failed!',
        unableToSave: 'Unable to save the deal.',
        deleteDeal: 'Delete this deal?',
        cannotUndo: 'This action cannot be undone.',
        yesDelete: 'Yes, delete',
        deleted: 'Deleted!',
        dealDeleted: 'Deal successfully deleted.',
        unableToDelete: 'Unable to delete the deal.'
        },

        id: {
        // Form
        editDeal: 'Edit Transaksi',
        addNewDeal: 'Tambah Transaksi Baru',
        dealName: 'Nama Transaksi',
        dealNamePlaceholder: 'contoh: Lisensi Software Enterprise',
        dealStage: 'Tahap Transaksi',
        selectStage: 'Pilih Tahap',
        dealValue: 'Nilai Transaksi (Rp)',
        dealValuePlaceholder: 'contoh: 50000000',
        expectedCloseDate: 'Perkiraan Tanggal Selesai',
        customer: 'Pelanggan',
        selectCustomer: 'Pilih Pelanggan',
        company: 'Perusahaan',
        selectCompany: 'Pilih Perusahaan',
        updateDeal: 'Perbarui Transaksi',
        addDeal: 'Tambah Transaksi',
        cancel: 'Batal',
        searchDeals: 'Cari Transaksi',
        searchCustomer: 'Cari Pelanggan',
        searchCompany: 'Cari Perusahaan',

        // Deal Stages
        prospect: 'Prospek',
        negotiation: 'Negosiasi',
        won: 'Menang',
        lost: 'Kalah',

        // Table
        dealsList: 'Daftar Transaksi',
        dealNameHeader: 'Nama Transaksi',
        stage: 'Tahap',
        value: 'Nilai',
        customerHeader: 'Pelanggan',
        companyHeader: 'Perusahaan',
        closeDate: 'Tanggal Selesai',
        actions: 'Aksi',
        noDealsYet: 'Belum ada transaksi',
        createFirst: 'Buat transaksi pertama Anda di atas',

        // Loading & Messages
        loadingDeals: 'Memuat transaksi...',

        // Alerts
        success: 'Berhasil!',
        dealUpdated: 'Transaksi berhasil diperbarui!',
        dealAdded: 'Transaksi berhasil ditambahkan!',
        failed: 'Gagal!',
        unableToSave: 'Tidak dapat menyimpan transaksi.',
        deleteDeal: 'Hapus transaksi ini?',
        cannotUndo: 'Tindakan ini tidak dapat dibatalkan.',
        yesDelete: 'Ya, hapus',
        deleted: 'Terhapus!',
        dealDeleted: 'Transaksi berhasil dihapus.',
        unableToDelete: 'Tidak dapat menghapus transaksi.'
        }
    },

    customers: {
        en: {
        // Form
        editCustomer: 'Edit Customer',
        addNewCustomer: 'Add New Customer',
        customerName: 'Customer Name',
        customerNamePlaceholder: 'e.g., John Doe',
        email: 'Email',
        emailPlaceholder: 'customer@example.com',
        phone: 'Phone',
        phonePlaceholder: 'e.g., +62 812 3456 7890',
        address: 'Address',
        addressPlaceholder: 'e.g., Jakarta, Indonesia',
        updateCustomer: 'Update Customer',
        addCustomer: 'Add Customer',
        cancel: 'Cancel',
        selectPIC: 'Select PIC',
        searchPIC: 'Search PIC',
        searchCustomers: 'Search Customers',

        // Table
        customersList: 'Customers List',
        customerNameHeader: 'Customer Name',
        emailHeader: 'Email',
        phoneHeader: 'Phone',
        addressHeader: 'Address',
        createdAt: 'Created At',
        actions: 'Actions',
        noCustomersYet: 'No customers yet',
        createFirst: 'Create your first customer above',

        // Loading & Messages
        loadingCustomers: 'Loading customers...',

        // Alerts
        success: 'Success!',
        customerUpdated: 'Customer successfully updated!',
        customerAdded: 'Customer successfully added!',
        failed: 'Failed!',
        unableToSave: 'Unable to save the customer.',
        error: 'Error!',
        connectionError: 'A connection error occurred.',
        deleteCustomer: 'Delete this customer?',
        cannotUndo: 'This action cannot be undone.',
        yesDelete: 'Yes, delete it!',
        deleted: 'Deleted!',
        customerDeleted: 'Customer successfully deleted.',
        unableToDelete: 'Unable to delete the customer.'
        },

        id: {
        // Form
        editCustomer: 'Edit Pelanggan',
        addNewCustomer: 'Tambah Pelanggan Baru',
        customerName: 'Nama Pelanggan',
        customerNamePlaceholder: 'contoh: John Doe',
        email: 'Email',
        emailPlaceholder: 'pelanggan@example.com',
        phone: 'Telepon',
        phonePlaceholder: 'contoh: +62 812 3456 7890',
        address: 'Alamat',
        addressPlaceholder: 'contoh: Jakarta, Indonesia',
        updateCustomer: 'Perbarui Pelanggan',
        addCustomer: 'Tambah Pelanggan',
        cancel: 'Batal',
        selectPIC: 'Pilih PIC',
        searchPIC: 'Cari PIC',
        searchCustomers: 'Cari Pelanggan',

        // Table
        customersList: 'Daftar Pelanggan',
        customerNameHeader: 'Nama Pelanggan',
        emailHeader: 'Email',
        phoneHeader: 'Telepon',
        addressHeader: 'Alamat',
        createdAt: 'Dibuat Pada',
        actions: 'Aksi',
        noCustomersYet: 'Belum ada pelanggan',
        createFirst: 'Buat pelanggan pertama Anda di atas',

        // Loading & Messages
        loadingCustomers: 'Memuat pelanggan...',

        // Alerts
        success: 'Berhasil!',
        customerUpdated: 'Pelanggan berhasil diperbarui!',
        customerAdded: 'Pelanggan berhasil ditambahkan!',
        failed: 'Gagal!',
        unableToSave: 'Tidak dapat menyimpan pelanggan.',
        error: 'Kesalahan!',
        connectionError: 'Terjadi kesalahan koneksi.',
        deleteCustomer: 'Hapus pelanggan ini?',
        cannotUndo: 'Tindakan ini tidak dapat dibatalkan.',
        yesDelete: 'Ya, hapus!',
        deleted: 'Terhapus!',
        customerDeleted: 'Pelanggan berhasil dihapus.',
        unableToDelete: 'Tidak dapat menghapus pelanggan.'
        }
    },

    invoices: {
        en: {
        // Form
        editInvoice: 'Edit Invoice',
        addNewInvoice: 'Add New Invoice',
        customer: 'Customer',
        selectCustomer: 'Select Customer',
        amount: 'Amount (Rp)',
        amountPlaceholder: 'e.g., 5000000',
        dueDate: 'Due Date',
        status: 'Status',
        selectStatus: 'Select Status',
        updateInvoice: 'Update Invoice',
        addInvoice: 'Add Invoice',
        cancel: 'Cancel',
        searchInvoices: 'Search Invoices',
        searchCustomers: 'Search Customers',

        // Status Options
        pending: 'Pending',
        paid: 'Paid',
        overdue: 'Overdue',

        // Table
        invoicesList: 'Invoices List',
        customerHeader: 'Customer',
        amountHeader: 'Amount',
        dueDateHeader: 'Due Date',
        statusHeader: 'Status',
        createdAt: 'Created At',
        actions: 'Actions',
        noInvoicesYet: 'No invoices yet',
        createFirst: 'Create your first invoice above',

        // Loading & Messages
        loadingInvoices: 'Loading invoices...',

        cannotEdit: 'Cannot Edit',
        invoiceAlreadyPaid: 'Invoices with Paid status cannot be modified',
        cannotEditPaidInvoice: 'Invoice already paid',

        // Alerts
        warning: 'Warning!',
        fillAllFields: 'Please fill in all required fields',
        success: 'Success!',
        invoiceUpdated: 'Invoice successfully updated!',
        invoiceAdded: 'Invoice successfully added!',
        error: 'Error!',
        failed: 'Failed!',
        errorSaving: 'An error occurred while saving the invoice.',
        deleteInvoice: 'Delete this invoice?',
        cannotUndo: 'This action cannot be undone.',
        yesDelete: 'Yes, delete',
        deleted: 'Deleted!',
        invoiceDeleted: 'Invoice successfully deleted.',
        unableToDelete: 'Unable to delete the invoice.'
        },

        id: {
        // Form
        editInvoice: 'Edit Faktur',
        addNewInvoice: 'Tambah Faktur Baru',
        customer: 'Pelanggan',
        selectCustomer: 'Pilih Pelanggan',
        amount: 'Jumlah (Rp)',
        amountPlaceholder: 'contoh: 5000000',
        dueDate: 'Tanggal Jatuh Tempo',
        status: 'Status',
        selectStatus: 'Pilih Status',
        updateInvoice: 'Perbarui Faktur',
        addInvoice: 'Tambah Faktur',
        cancel: 'Batal',
        searchInvoices: 'Cari Faktur',
        searchCustomers: 'Cari Pelanggan',

        // Status Options
        pending: 'Tertunda',
        paid: 'Dibayar',
        overdue: 'Terlambat',

        // Table
        invoicesList: 'Daftar Faktur',
        customerHeader: 'Pelanggan',
        amountHeader: 'Jumlah',
        dueDateHeader: 'Tanggal Jatuh Tempo',
        statusHeader: 'Status',
        createdAt: 'Dibuat Pada',
        actions: 'Aksi',
        noInvoicesYet: 'Belum ada faktur',
        createFirst: 'Buat faktur pertama Anda di atas',

        // Loading & Messages
        loadingInvoices: 'Memuat faktur...',

        cannotEdit: 'Tidak Dapat Diedit',
        invoiceAlreadyPaid: 'Faktur dengan status Paid tidak dapat diubah lagi',
        cannotEditPaidInvoice: 'Faktur sudah dibayar',

        // Alerts
        warning: 'Peringatan!',
        fillAllFields: 'Harap isi semua kolom yang diperlukan',
        success: 'Berhasil!',
        invoiceUpdated: 'Faktur berhasil diperbarui!',
        invoiceAdded: 'Faktur berhasil ditambahkan!',
        error: 'Kesalahan!',
        failed: 'Gagal!',
        errorSaving: 'Terjadi kesalahan saat menyimpan faktur.',
        deleteInvoice: 'Hapus faktur ini?',
        cannotUndo: 'Tindakan ini tidak dapat dibatalkan.',
        yesDelete: 'Ya, hapus',
        deleted: 'Terhapus!',
        invoiceDeleted: 'Faktur berhasil dihapus.',
        unableToDelete: 'Tidak dapat menghapus faktur.'
        }
    },

    leads: {
        en: {
        // Form
        editLead: 'Edit Lead',
        addNewLead: 'Add New Lead',
        customer: 'Customer',
        selectCustomer: 'Select Customer',
        noCustomersFound: 'No customers found',
        source: 'Source',
        sourcePlaceholder: 'e.g., Website, Referral',
        leadStatus: 'Lead Status',
        selectLeadStatus: 'Select Lead Status',
        updateLead: 'Update Lead',
        addLead: 'Add Lead',
        cancel: 'Cancel',
        searchLeads: 'Search Leads',
        noCustomerLinked: 'No customer linked',
        linkedCustomer: 'Linked Customer',
        searchCustomers: 'Search Customers',
        clearSelection: 'Clear Selection',

        // Lead Status Options
        new: 'New',
        contacted: 'Contacted',
        qualified: 'Qualified',
        disqualified: 'Disqualified',

        // Table
        leadsList: 'Leads List',
        customerHeader: 'Customer',
        sourceHeader: 'Source',
        statusHeader: 'Status',
        createdAt: 'Created At',
        actions: 'Actions',
        unknown: 'Unknown',
        noLeadsYet: 'No leads yet',
        createFirst: 'Create your first lead above',

        // Loading & Messages
        loadingLeads: 'Loading leads...',

        cannotEdit: 'Cannot Edit',
        leadAlreadyQualified: 'Leads with Qualified status cannot be modified',
        cannotEditQualifiedLead: 'Lead already qualified',

        // Alerts
        warning: 'Warning!',
        fillAllFields: 'Please fill in all required fields',
        success: 'Success!',
        leadUpdated: 'Lead successfully updated!',
        leadAdded: 'Lead successfully added!',
        failed: 'Failed!',
        errorSaving: 'An error occurred while saving the lead',
        deleteLead: 'Delete this lead?',
        cannotUndo: 'This action cannot be undone.',
        yesDelete: 'Yes, delete',
        deleted: 'Deleted!',
        leadDeleted: 'Lead successfully deleted.',
        unableToDelete: 'Unable to delete the lead.'
        },

        id: {
        // Form
        editLead: 'Edit Prospek',
        addNewLead: 'Tambah Prospek Baru',
        customer: 'Pelanggan',
        selectCustomer: 'Pilih Pelanggan',
        noCustomersFound: 'Tidak ada pelanggan',
        source: 'Sumber',
        sourcePlaceholder: 'contoh: Website, Rujukan',
        leadStatus: 'Status Prospek',
        selectLeadStatus: 'Pilih Status Prospek',
        updateLead: 'Perbarui Prospek',
        addLead: 'Tambah Prospek',
        cancel: 'Batal',
        searchLeads: 'Cari Prospek',
        noCustomerLinked: 'Tidak ada yang terkait',
        linkedCustomer: 'Pelanggan Terkait',
        searchCustomer: 'Cari Pelanggan',
        clearSelection: 'Bersihkan Pilihan',

        // Lead Status Options
        new: 'Baru',
        contacted: 'Dihubungi',
        qualified: 'Memenuhi Syarat',
        disqualified: 'Tidak Memenuhi Syarat',

        // Table
        leadsList: 'Daftar Prospek',
        customerHeader: 'Pelanggan',
        sourceHeader: 'Sumber',
        statusHeader: 'Status',
        createdAt: 'Dibuat Pada',
        actions: 'Aksi',
        unknown: 'Tidak Diketahui',
        noLeadsYet: 'Belum ada prospek',
        createFirst: 'Buat prospek pertama Anda di atas',

        // Loading & Messages
        loadingLeads: 'Memuat prospek...',

        cannotEdit: 'Tidak Dapat Diedit',
        leadAlreadyQualified: 'Lead dengan status Qualified tidak dapat diubah lagi',
        cannotEditQualifiedLead: 'Lead sudah qualified',

        // Alerts
        warning: 'Peringatan!',
        fillAllFields: 'Harap isi semua kolom yang diperlukan',
        success: 'Berhasil!',
        leadUpdated: 'Prospek berhasil diperbarui!',
        leadAdded: 'Prospek berhasil ditambahkan!',
        failed: 'Gagal!',
        errorSaving: 'Terjadi kesalahan saat menyimpan prospek',
        deleteLead: 'Hapus prospek ini?',
        cannotUndo: 'Tindakan ini tidak dapat dibatalkan.',
        yesDelete: 'Ya, hapus',
        deleted: 'Terhapus!',
        leadDeleted: 'Prospek berhasil dihapus.',
        unableToDelete: 'Tidak dapat menghapus prospek.'
        }
    },

    manageAdmins: {
        en: {
        // Warning Badge
        superAdminArea: 'Super Admin Area',
        superAdminWarning: 'Manage admin users with caution. Only Super Admins can access this page.',

        // Form
        editAdmin: 'Edit Admin',
        addNewAdmin: 'Add New Admin',
        fullName: 'Full Name',
        namePlaceholder: 'Enter Full Name',
        emailAddress: 'Email Address',
        emailPlaceholder: 'Enter Email Address',
        password: 'Password',
        passwordHint: '(Leave empty to keep current password)',
        rolePlaceholder: 'Select Role',
        passwordPlaceholder: 'Enter password',
        passwordPlaceholderEdit: 'Leave blank to keep current',
        updateAdmin: 'Update Admin',
        addAdmin: 'Add Admin',
        cancel: 'Cancel',
        searchUsers: 'Search Users',


        // Table
        adminUsers: 'Admin Users',
        name: 'Name',
        email: 'Email',
        createdAt: 'Created At',
        actions: 'Actions',
        noAdminsYet: 'No admins yet',
        addFirstAdmin: 'Add your first admin user above',

        // Loading
        loadingAdmins: 'Loading admins...',

        // Alerts
        oops: 'Oops!',
        nameEmailRequired: 'Name and email are required!',
        adminUpdated: 'Admin successfully updated!',
        adminAdded: 'Admin successfully added!',
        failed: 'Failed!',
        errorSaving: 'An error occurred while saving the data.',
        areYouSure: 'Are you sure?',
        deleteWarning: 'Admin deletion is permanent and cannot be undone.',
        yesDelete: 'Yes, delete',
        deleted: 'Deleted!',
        adminDeleted: 'Admin successfully deleted.',
        unableToDelete: 'Unable to delete the admin.',
        emailAlreadyExists: 'Email already exists',
        emailExistsMessage: 'This email is already registered. Please use a different email address.',


        userRole: 'User Role',
        selectUserRole: 'Select User Role',
        client: 'Client',
        admin: 'Admin',
        generateSecurePassword: 'Generate secure password automatically',
        allUsers: 'All Users',
        noResultsFound: 'No results found',
        tryDifferentKeywords: 'Try different keywords',
        noUsersYet: 'No users yet',
        addFirstUser: 'Add your first user to get started',
        role: 'Role',

        // Pop-up messages
        userCreated: 'User Successfully Added!',
        userUpdated: 'User Successfully Updated!',
        userCreatedMessage: 'New user has been successfully added to the system.',
        userUpdatedMessage: 'User data has been successfully updated.',
        passwordGenerated: 'Password Successfully Generated!',
        passwordGeneratedMessage: 'Password has been automatically generated and sent to email',
        checkEmailInbox: 'Please check the email inbox for login credentials.',
        passwordRequired: 'Password is required or enable generate password',
        nameEmailRoleRequired: 'Name, Email, and Role are required!'
        },

        id: {
        // Warning Badge
        superAdminArea: 'Area Super Admin',
        superAdminWarning: 'Kelola pengguna admin dengan hati-hati. Hanya Super Admin yang dapat mengakses halaman ini.',

        // Form
        editAdmin: 'Edit Admin',
        addNewAdmin: 'Tambah Admin Baru',
        fullName: 'Nama Lengkap',
        namePlaceholder: 'Masukan Nama Lengkap',
        emailAddress: 'Alamat Email',
        emailPlaceholder: 'Masukan Alamat Email',
        password: 'Kata Sandi',
        rolePlaceholder: 'Pilih Peran',
        passwordHint: '(Kosongkan untuk mempertahankan kata sandi saat ini)',
        updateAdmin: 'Perbarui Admin',
        passwordPlaceholder: 'Masukkan kata sandi',
        passwordPlaceholderEdit: 'Kosongkan untuk mempertahankan yang lama',
        addAdmin: 'Tambah Admin',
        cancel: 'Batal',
        searchUsers: 'Cari Pengguna',

        // Table
        adminUsers: 'Pengguna Admin',
        name: 'Nama',
        email: 'Email',
        createdAt: 'Dibuat Pada',
        actions: 'Aksi',
        noAdminsYet: 'Belum ada admin',
        addFirstAdmin: 'Tambahkan pengguna admin pertama Anda di atas',

        // Loading
        loadingAdmins: 'Memuat admin...',

        // Alerts
        oops: 'Ups!',
        nameEmailRequired: 'Nama dan email wajib diisi!',
        adminUpdated: 'Admin berhasil diperbarui!',
        adminAdded: 'Admin berhasil ditambahkan!',
        failed: 'Gagal!',
        errorSaving: 'Terjadi kesalahan saat menyimpan data.',
        areYouSure: 'Apakah Anda yakin?',
        deleteWarning: 'Penghapusan admin bersifat permanen dan tidak dapat dibatalkan.',
        yesDelete: 'Ya, hapus',
        deleted: 'Terhapus!',
        adminDeleted: 'Admin berhasil dihapus.',
        unableToDelete: 'Tidak dapat menghapus admin.',
        emailAlreadyExists: 'Email sudah terdaftar',
        emailExistsMessage: 'Email ini sudah terdaftar. Silakan gunakan email lain.',

        userRole: 'Peran Pengguna',
        selectUserRole: 'Pilih Peran Pengguna',
        client: 'Klien',
        admin: 'Admin',
        generateSecurePassword: 'Buat kata sandi aman secara otomatis',
        allUsers: 'Semua Pengguna',
        noResultsFound: 'Tidak ada hasil',
        tryDifferentKeywords: 'Coba kata kunci lain',
        noUsersYet: 'Belum ada pengguna',
        addFirstUser: 'Tambahkan pengguna pertama Anda untuk memulai',
        role: 'Peran',

        // Pop-up messages
        userCreated: 'Pengguna Berhasil Ditambahkan!',
        userUpdated: 'Pengguna Berhasil Diperbarui!',
        userCreatedMessage: 'Pengguna baru telah berhasil ditambahkan ke sistem.',
        userUpdatedMessage: 'Data pengguna telah berhasil diperbarui.',
        passwordGenerated: 'Kata Sandi Berhasil Dibuat!',
        passwordGeneratedMessage: 'Kata sandi telah dibuat secara otomatis dan dikirim ke email',
        checkEmailInbox: 'Silakan periksa inbox email untuk kredensial login.',
        passwordRequired: 'Kata sandi wajib diisi atau aktifkan generate kata sandi',
        nameEmailRoleRequired: 'Nama, Email, dan Peran wajib diisi!'
        }
    },

    products: {
        en: {
        // Form
        editProduct: 'Edit Product',
        addNewProduct: 'Add New Product',
        productName: 'Product Name',
        productNamePlaceholder: 'e.g., Premium Widget',
        price: 'Price (Rp)',
        pricePlaceholder: 'e.g., 100000',
        description: 'Description',
        descriptionPlaceholder: 'Product description...',
        updateProduct: 'Update Product',
        addProduct: 'Add Product',
        cancel: 'Cancel',
        searchProducts: 'Search Products',

        // Table
        productsList: 'Products List',
        productNameHeader: 'Product Name',
        priceHeader: 'Price',
        descriptionHeader: 'Description',
        actions: 'Actions',
        noProductsYet: 'No products yet',
        createFirst: 'Create your first product above',

        // Loading
        loadingProducts: 'Loading products...',

        sortDefault: "Sort by: Default",
        sortLowest: "Price: Lowest",
        sortHighest: "Price: Highest",
        sortAZ: "Name: A-Z",
        sortZA: "Name: Z-A",


        // Alerts
        accessDenied: 'Access Denied',
        mustBeLoggedIn: 'You must be logged in to access this page.',
        adminOnly: 'This page is for Admin/Superadmin only.',
        productUpdated: 'Product successfully updated!',
        productAdded: 'Product successfully added!',
        failed: 'Failed!',
        errorSaving: 'An error occurred while saving the product.',
        deleteProduct: 'Delete this product?',
        cannotUndo: 'This action cannot be undone.',
        yesDelete: 'Yes, delete',
        deleted: 'Deleted!',
        productDeleted: 'Product successfully deleted.'
        },

        id: {
        // Form
        editProduct: 'Edit Produk',
        addNewProduct: 'Tambah Produk Baru',
        productName: 'Nama Produk',
        productNamePlaceholder: 'contoh: Widget Premium',
        price: 'Harga (Rp)',
        pricePlaceholder: 'contoh: 100000',
        description: 'Deskripsi',
        descriptionPlaceholder: 'Deskripsi produk...',
        updateProduct: 'Perbarui Produk',
        addProduct: 'Tambah Produk',
        cancel: 'Batal',
        searchProducts: 'Cari Produk',

        // Table
        productsList: 'Daftar Produk',
        productNameHeader: 'Nama Produk',
        priceHeader: 'Harga',
        descriptionHeader: 'Deskripsi',
        actions: 'Aksi',
        noProductsYet: 'Belum ada produk',
        createFirst: 'Buat produk pertama Anda di atas',

        // Loading
        loadingProducts: 'Memuat produk...',

        sortDefault: "Urutkan: Default",
        sortLowest: "Harga: Termurah",
        sortHighest: "Harga: Termahal",
        sortAZ: "Nama: A-Z",
        sortZA: "Nama: Z-A",

        // Alerts
        accessDenied: 'Akses Ditolak',
        mustBeLoggedIn: 'Anda harus login untuk mengakses halaman ini.',
        adminOnly: 'Halaman ini hanya untuk Admin/Superadmin.',
        productUpdated: 'Produk berhasil diperbarui!',
        productAdded: 'Produk berhasil ditambahkan!',
        failed: 'Gagal!',
        errorSaving: 'Terjadi kesalahan saat menyimpan produk.',
        deleteProduct: 'Hapus produk ini?',
        cannotUndo: 'Tindakan ini tidak dapat dibatalkan.',
        yesDelete: 'Ya, hapus',
        deleted: 'Terhapus!',
        productDeleted: 'Produk berhasil dihapus.'
        }
    },

    services: {
        en: {
        // Form
        editService: 'Edit Service',
        addNewService: 'Add New Service',
        customer: 'Customer',
        selectCustomer: 'Select Customer',
        serviceType: 'Service Type',
        selectServiceType: 'Select Service Type',
        status: 'Status',
        selectStatus: 'Select Status',
        updateService: 'Update Service',
        addService: 'Add Service',
        cancel: 'Cancel',
        searchServices: 'Search Services',
        searchCustomers: 'Search Customers',

        // Service Types
        sipTrunk: 'SIP Trunk',
        cctv: 'CCTV',
        cloudGcpAws: 'Cloud (GCP/AWS)',

        // Status Options
        active: 'Active',
        inactive: 'Inactive',
        terminated: 'Terminated',

        // Table
        servicesList: 'Services List',
        customerHeader: 'Customer',
        serviceTypeHeader: 'Service Type',
        statusHeader: 'Status',
        startDate: 'Start Date',
        actions: 'Actions',
        noServicesYet: 'No services yet',
        createFirst: 'Create your first service above',

        // Loading
        loadingServices: 'Loading services...',

        // Alerts
        oops: 'Oops',
        completeAllFields: 'Complete all fields first!',
        success: 'Success!',
        serviceEdited: 'Service successfully edited!',
        serviceAdded: 'Service successfully added!',
        failed: 'Failed!',
        unableToSave: 'Unable to save the service.',
        error: 'Error',
        connectionError: 'A connection error occurred.',
        deleteService: 'Delete this service?',
        cannotUndo: 'This action cannot be undone.',
        yesDelete: 'Yes, delete',
        deleted: 'Deleted!',
        serviceDeleted: 'Service successfully deleted.',
        unableToDelete: 'Unable to delete the service.'
        },

        id: {
        // Form
        editService: 'Edit Layanan',
        addNewService: 'Tambah Layanan Baru',
        customer: 'Pelanggan',
        selectCustomer: 'Pilih Pelanggan',
        serviceType: 'Jenis Layanan',
        selectServiceType: 'Pilih Jenis Layanan',
        status: 'Status',
        selectStatus: 'Pilih Status',
        updateService: 'Perbarui Layanan',
        addService: 'Tambah Layanan',
        cancel: 'Batal',
        searchServices: 'Cari Layanan',
        searchCustomers: 'Cari Pelanggan',

        // Service Types
        sipTrunk: 'SIP Trunk',
        cctv: 'CCTV',
        cloudGcpAws: 'Cloud (GCP/AWS)',

        // Status Options
        active: 'Aktif',
        inactive: 'Tidak Aktif',
        terminated: 'Dihentikan',

        // Table
        servicesList: 'Daftar Layanan',
        customerHeader: 'Pelanggan',
        serviceTypeHeader: 'Jenis Layanan',
        statusHeader: 'Status',
        startDate: 'Tanggal Mulai',
        actions: 'Aksi',
        noServicesYet: 'Belum ada layanan',
        createFirst: 'Buat layanan pertama Anda di atas',

        // Loading
        loadingServices: 'Memuat layanan...',

        // Alerts
        oops: 'Ups',
        completeAllFields: 'Lengkapi semua kolom terlebih dahulu!',
        success: 'Berhasil!',
        serviceEdited: 'Layanan berhasil diedit!',
        serviceAdded: 'Layanan berhasil ditambahkan!',
        failed: 'Gagal!',
        unableToSave: 'Tidak dapat menyimpan layanan.',
        error: 'Kesalahan',
        connectionError: 'Terjadi kesalahan koneksi.',
        deleteService: 'Hapus layanan ini?',
        cannotUndo: 'Tindakan ini tidak dapat dibatalkan.',
        yesDelete: 'Ya, hapus',
        deleted: 'Terhapus!',
        serviceDeleted: 'Layanan berhasil dihapus.',
        unableToDelete: 'Tidak dapat menghapus layanan.'
        }
    },

    teams: {
        en: {
        // Form
        editTeam: 'Edit Team',
        addNewTeam: 'Add New Team',
        teamName: 'Team Name',
        teamNamePlaceholder: 'e.g., Marketing Team',
        manager: 'Manager',
        selectManager: 'Select Manager',
        noManager: 'No Manager',
        updateTeam: 'Update Team',
        addTeam: 'Add Team',
        cancel: 'Cancel',
        searchTeams: 'Search Teams',
        searchManager: 'Search Manager',

        // Table
        teamsList: 'Teams List',
        teamNameHeader: 'Team Name',
        managerHeader: 'Manager',
        createdAt: 'Created At',
        actions: 'Actions',
        noTeamsYet: 'No teams yet',
        createFirst: 'Create your first team above',

        // Loading
        loadingTeams: 'Loading teams...',

        // Alerts
        warning: 'Warning',
        teamNameRequired: 'Team name is required',
        success: 'Success!',
        teamEdited: 'Team successfully edited!',
        teamAdded: 'Team successfully added!',
        failed: 'Failed',
        error: 'Error',
        connectionError: 'A connection error occurred.',
        deleteTeam: 'Delete this team?',
        cannotUndo: 'This action cannot be undone.',
        yesDelete: 'Yes, delete',
        deleted: 'Deleted!',
        teamDeleted: 'Team successfully deleted.',
        unableToDelete: 'Unable to delete the team.'
        },

        id: {
        // Form
        editTeam: 'Edit Tim',
        addNewTeam: 'Tambah Tim Baru',
        teamName: 'Nama Tim',
        teamNamePlaceholder: 'contoh: Tim Pemasaran',
        manager: 'Manajer',
        selectManager: 'Pilih Manajer',
        noManager: 'Tanpa Manajer',
        updateTeam: 'Perbarui Tim',
        addTeam: 'Tambah Tim',
        cancel: 'Batal',
        searchTeams: 'Cari Tim',
        searchManager: 'Cari PJ',

        // Table
        teamsList: 'Daftar Tim',
        teamNameHeader: 'Nama Tim',
        managerHeader: 'Manajer',
        createdAt: 'Dibuat Pada',
        actions: 'Aksi',
        noTeamsYet: 'Belum ada tim',
        createFirst: 'Buat tim pertama Anda di atas',

        // Loading
        loadingTeams: 'Memuat tim...',

        // Alerts
        warning: 'Peringatan',
        teamNameRequired: 'Nama tim wajib diisi',
        success: 'Berhasil!',
        teamEdited: 'Tim berhasil diedit!',
        teamAdded: 'Tim berhasil ditambahkan!',
        failed: 'Gagal',
        error: 'Kesalahan',
        connectionError: 'Terjadi kesalahan koneksi.',
        deleteTeam: 'Hapus tim ini?',
        cannotUndo: 'Tindakan ini tidak dapat dibatalkan.',
        yesDelete: 'Ya, hapus',
        deleted: 'Terhapus!',
        teamDeleted: 'Tim berhasil dihapus.',
        unableToDelete: 'Tidak dapat menghapus tim.'
        }
    },

    tickets: {
        en: {
        // Form
        editTicket: 'Edit Ticket',
        addNewTicket: 'Add New Ticket',
        customer: 'Customer',
        selectCustomer: 'Select Customer',
        issueType: 'Issue Type',
        issueTypePlaceholder: 'e.g., Technical Support',
        priority: 'Priority',
        selectPriority: 'Select Priority',
        status: 'Status',
        selectStatus: 'Select Status',
        assignTo: 'Assign To',
        selectUser: 'Select Admin',
        updateTicket: 'Update Ticket',
        addTicket: 'Add Ticket',
        cancel: 'Cancel',
        searchTickets: 'Search Tickets',
        searchCustomers: 'Search Customers',
        searchPIC: 'Search Admin',

        // Priority levels
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent',

        // Status levels
        open: 'Open',
        inProgress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed',

        cannotEdit: 'Tidak Dapat Diedit',
        ticketAlreadyFinal: 'Ticket dengan status Resolved atau Closed tidak dapat diubah lagi',
        cannotEditFinalTicket: 'Ticket sudah selesai',


        // Table
        ticketsList: 'Tickets List',
        customerHeader: 'Customer',
        issue: 'Issue',
        priorityHeader: 'Priority',
        statusHeader: 'Status',
        assignedTo: 'Assigned To',
        createdAt: 'Created At',
        actions: 'Actions',
        noTicketsYet: 'No tickets yet',
        createFirst: 'Create your first ticket above',

        // Loading
        loadingTickets: 'Loading tickets...',

        // Alerts
        customerRequired: 'Customer Required!',
        pleaseSelectCustomer: 'Please select a customer.',
        issueTypeRequired: 'Issue Type Required!',
        pleaseEnterIssueType: 'Please enter issue type.',
        priorityRequired: 'Priority Required!',
        pleaseSelectPriority: 'Please select priority.',
        statusRequired: 'Status Required!',
        pleaseSelectStatus: 'Please select status.',
        backendError: 'Backend Error!',
        success: 'Success!',
        ticketAdded: 'Ticket successfully added!',
        ticketUpdated: 'Ticket successfully updated!',
        networkError: 'Network Error!',
        deleteTicket: 'Delete this ticket?',
        cannotUndo: 'This action cannot be undone.',
        yesDelete: 'Yes, delete',
        deleted: 'Deleted!',
        ticketDeleted: 'Ticket successfully deleted.',
        failed: 'Failed!',
        unableToDelete: 'Unable to delete the ticket.'
        },

        id: {
        // Form
        editTicket: 'Edit Tiket',
        addNewTicket: 'Tambah Tiket Baru',
        customer: 'Pelanggan',
        selectCustomer: 'Pilih Pelanggan',
        issueType: 'Jenis Masalah',
        issueTypePlaceholder: 'contoh: Dukungan Teknis',
        priority: 'Prioritas',
        selectPriority: 'Pilih Prioritas',
        status: 'Status',
        selectStatus: 'Pilih Status',
        assignTo: 'Tugaskan Ke',
        selectUser: 'Pilih Admin',
        updateTicket: 'Perbarui Tiket',
        addTicket: 'Tambah Tiket',
        cancel: 'Batal',
        searchTickets: 'Cari Tiket',
        searchCustomers: 'Cari Pelanggan',
        searchPIC: 'Cari Admin',

        // Priority levels
        low: 'Rendah',
        medium: 'Sedang',
        high: 'Tinggi',
        urgent: 'Mendesak',

        // Status levels
        open: 'Terbuka',
        inProgress: 'Dalam Proses',
        resolved: 'Selesai',
        closed: 'Ditutup',

        cannotEdit: 'Cannot Edit',
        ticketAlreadyFinal: 'Tickets with Resolved or Closed status cannot be modified',
        cannotEditFinalTicket: 'Ticket already completed',

        // Table
        ticketsList: 'Daftar Tiket',
        customerHeader: 'Pelanggan',
        issue: 'Masalah',
        priorityHeader: 'Prioritas',
        statusHeader: 'Status',
        assignedTo: 'Ditugaskan Ke',
        createdAt: 'Dibuat Pada',
        actions: 'Aksi',
        noTicketsYet: 'Belum ada tiket',
        createFirst: 'Buat tiket pertama Anda di atas',

        // Loading
        loadingTickets: 'Memuat tiket...',

        // Alerts
        customerRequired: 'Pelanggan Wajib Diisi!',
        pleaseSelectCustomer: 'Silakan pilih pelanggan.',
        issueTypeRequired: 'Jenis Masalah Wajib Diisi!',
        pleaseEnterIssueType: 'Silakan masukkan jenis masalah.',
        priorityRequired: 'Prioritas Wajib Diisi!',
        pleaseSelectPriority: 'Silakan pilih prioritas.',
        statusRequired: 'Status Wajib Diisi!',
        pleaseSelectStatus: 'Silakan pilih status.',
        backendError: 'Kesalahan Backend!',
        success: 'Berhasil!',
        ticketAdded: 'Tiket berhasil ditambahkan!',
        ticketUpdated: 'Tiket berhasil diperbarui!',
        networkError: 'Kesalahan Jaringan!',
        deleteTicket: 'Hapus tiket ini?',
        cannotUndo: 'Tindakan ini tidak dapat dibatalkan.',
        yesDelete: 'Ya, hapus',
        deleted: 'Terhapus!',
        ticketDeleted: 'Tiket berhasil dihapus.',
        failed: 'Gagal!',
        unableToDelete: 'Tidak dapat menghapus tiket.'
        }
    },

    client: {
    en: {
        // Layout
        dashboard: 'Dashboard',
        profile: 'Profile',
        services: 'Services',
        history: 'History',
        logout: 'Logout',
        client: 'Client',

        // Dashboard
        welcomeBack: 'Welcome Back',
        dashboardSubtitle: 'Manage your account and view your services',
        completeProfile: 'Complete Your Profile',
        profileIncomplete: 'Your profile is incomplete. Please complete your information to get the best experience.',
        completeNow: 'Complete Now',
        remindLater: 'Remind Me Later',

        // Profile Form in Modal
        fillProfile: 'Fill Your Profile',
        profileDescription: 'Please complete your profile information below',
        fullName: 'Full Name',
        namePlaceholder: 'e.g., John Doe',
        email: 'Email',
        emailPlaceholder: 'you@example.com',
        phone: 'Phone Number',
        phonePlaceholder: 'e.g., +62 812 3456 7890',
        address: 'Address',
        addressPlaceholder: 'e.g., Jakarta, Indonesia',
        saveProfile: 'Save Profile',
        cancel: 'Cancel',

        // Profile Page
        myProfile: 'My Profile',
        profileInfo: 'Profile Information',
        editProfile: 'Edit Profile',
        updateProfile: 'Update Profile',

        // Account Info
        accountInfo: 'Account Information',
        accountCreated: 'Account Created',
        customerID: 'Customer ID',

        // Services Page
        myServices: 'My Active Services',
        myServicesDesc: 'View your active service credentials and details',
        requestNewService: 'Request New Service',
        requestServiceDesc: 'Submit a request for a new service',
        serviceType: 'Service Type',
        selectServiceType: 'Select Service Type',
        sipTrunk: 'SIP Trunk',
        cctv: 'CCTV',
        cloudService: 'Cloud (GCP/AWS)',
        provider: 'Provider',
        selectProvider: 'Select Provider',
        gcp: 'Google Cloud Platform (GCP)',
        aws: 'Amazon Web Services (AWS)',
        notesRequest: 'Notes / Special Request',
        notesPlaceholder: 'Explain your service requirements in detail...',
        submitRequest: 'Submit Request',
        noActiveServices: 'No active services yet',
        requestFirstService: 'Request your first service using the form below',

        // Service Details
        serviceDetails: 'Service Details',
        credentials: 'Credentials',
        userIdPhone: 'User ID / Phone',
        password: 'Password',
        sipServer: 'SIP Server',
        userAccount: 'User Account',
        serialNumber: 'Serial Number',
        encryptionCode: 'Encryption Code',
        mobileAppUser: 'Mobile App User',
        mobileAppPassword: 'Mobile App Password',
        userEmail: 'User Email',
        showPassword: 'Show Password',
        hidePassword: 'Hide Password',
        copy: 'Copy',
        copied: 'Copied!',

        // Service Status
        active: 'Active',
        inactive: 'Inactive',
        pending: 'Pending',
        terminated: 'Terminated',

        // History Page
        paymentHistory: 'Payment History',
        paymentHistoryDesc: 'View your invoice and payment records',
        serviceHistory: 'Service History',
        serviceHistoryDesc: 'View your terminated or inactive services',
        invoiceId: 'Invoice ID',
        amount: 'Amount',
        dueDate: 'Due Date',
        status: 'Status',
        createdDate: 'Created Date',
        startDate: 'Start Date',
        endDate: 'End Date',
        noPaymentHistory: 'No payment history yet',
        noServiceHistory: 'No service history yet',
        paid: 'Paid',
        overdue: 'Overdue',

        // Alerts
        confirmLogout: 'Confirm Logout',
        logoutConfirm: 'Are you sure you want to log out?',
        yesLogout: 'Yes, Logout',
        logoutSuccess: 'Logout successful!',
        seeYouAgain: 'See you again!',
        success: 'Success!',
        profileUpdated: 'Profile successfully updated!',
        profileSaved: 'Profile successfully saved!',
        requestSubmitted: 'Service request submitted!',
        requestSuccess: 'Your service request has been submitted successfully. Our team will review it shortly.',
        failed: 'Failed!',
        errorSaving: 'An error occurred while saving your profile.',
        errorSubmitting: 'An error occurred while submitting your request.',
        allFieldsRequired: 'All fields are required.',

        // Loading
        loading: 'Loading...',
        loadingProfile: 'Loading profile...',
        loadingServices: 'Loading services...',
        loadingHistory: 'Loading history...',

        // Access
        accessDenied: 'Access Denied',
        mustLogin: 'You must login first!'
    },

    id: {
        // Layout
        dashboard: 'Beranda',
        profile: 'Profil',
        services: 'Layanan',
        history: 'Riwayat',
        logout: 'Keluar',
        client: 'Klien',

        // Dashboard
        welcomeBack: 'Selamat Datang Kembali',
        dashboardSubtitle: 'Kelola akun Anda dan lihat layanan Anda',
        completeProfile: 'Lengkapi Profil Anda',
        profileIncomplete: 'Profil Anda belum lengkap. Harap lengkapi informasi Anda untuk mendapatkan pengalaman terbaik.',
        completeNow: 'Lengkapi Sekarang',
        remindLater: 'Ingatkan Nanti',

        // Profile Form in Modal
        fillProfile: 'Isi Profil Anda',
        profileDescription: 'Silakan lengkapi informasi profil Anda di bawah ini',
        fullName: 'Nama Lengkap',
        namePlaceholder: 'contoh: John Doe',
        email: 'Email',
        emailPlaceholder: 'anda@example.com',
        phone: 'Nomor Telepon',
        phonePlaceholder: 'contoh: +62 812 3456 7890',
        address: 'Alamat',
        addressPlaceholder: 'contoh: Jakarta, Indonesia',
        saveProfile: 'Simpan Profil',
        cancel: 'Batal',

        // Profile Page
        myProfile: 'Profil Saya',
        profileInfo: 'Informasi Profil',
        editProfile: 'Edit Profil',
        updateProfile: 'Perbarui Profil',

        // Account Info
        accountInfo: 'Informasi Akun',
        accountCreated: 'Akun Dibuat',
        customerID: 'ID Pelanggan',

        // Services Page
        myServices: 'Layanan Aktif Saya',
        myServicesDesc: 'Lihat kredensial dan detail layanan aktif Anda',
        requestNewService: 'Ajukan Layanan Baru',
        requestServiceDesc: 'Kirim permintaan untuk layanan baru',
        serviceType: 'Jenis Layanan',
        selectServiceType: 'Pilih Jenis Layanan',
        sipTrunk: 'SIP Trunk',
        cctv: 'CCTV',
        cloudService: 'Cloud (GCP/AWS)',
        provider: 'Penyedia',
        selectProvider: 'Pilih Penyedia',
        gcp: 'Google Cloud Platform (GCP)',
        aws: 'Amazon Web Services (AWS)',
        notesRequest: 'Catatan / Permintaan Khusus',
        notesPlaceholder: 'Jelaskan kebutuhan layanan Anda secara detail...',
        submitRequest: 'Kirim Permintaan',
        noActiveServices: 'Belum ada layanan aktif',
        requestFirstService: 'Ajukan layanan pertama Anda menggunakan formulir di bawah',

        // Service Details
        serviceDetails: 'Detail Layanan',
        credentials: 'Kredensial',
        userIdPhone: 'User ID / Telepon',
        password: 'Kata Sandi',
        sipServer: 'SIP Server',
        userAccount: 'Akun Pengguna',
        serialNumber: 'Nomor Seri',
        encryptionCode: 'Kode Enkripsi',
        mobileAppUser: 'Pengguna Aplikasi Mobile',
        mobileAppPassword: 'Kata Sandi Aplikasi Mobile',
        userEmail: 'Email Pengguna',
        showPassword: 'Tampilkan Kata Sandi',
        hidePassword: 'Sembunyikan Kata Sandi',
        copy: 'Salin',
        copied: 'Tersalin!',

        // Service Status
        active: 'Aktif',
        inactive: 'Tidak Aktif',
        pending: 'Menunggu',
        terminated: 'Dihentikan',

        // History Page
        paymentHistory: 'Riwayat Pembayaran',
        paymentHistoryDesc: 'Lihat catatan faktur dan pembayaran Anda',
        serviceHistory: 'Riwayat Layanan',
        serviceHistoryDesc: 'Lihat layanan yang dihentikan atau tidak aktif',
        invoiceId: 'ID Faktur',
        amount: 'Jumlah',
        dueDate: 'Tanggal Jatuh Tempo',
        status: 'Status',
        createdDate: 'Tanggal Dibuat',
        startDate: 'Tanggal Mulai',
        endDate: 'Tanggal Selesai',
        noPaymentHistory: 'Belum ada riwayat pembayaran',
        noServiceHistory: 'Belum ada riwayat layanan',
        paid: 'Dibayar',
        overdue: 'Terlambat',

        // Alerts
        confirmLogout: 'Konfirmasi Keluar',
        logoutConfirm: 'Apakah Anda yakin ingin keluar?',
        yesLogout: 'Ya, Keluar',
        logoutSuccess: 'Berhasil keluar!',
        seeYouAgain: 'Sampai jumpa lagi!',
        success: 'Berhasil!',
        profileUpdated: 'Profil berhasil diperbarui!',
        profileSaved: 'Profil berhasil disimpan!',
        requestSubmitted: 'Permintaan layanan terkirim!',
        requestSuccess: 'Permintaan layanan Anda telah berhasil dikirim. Tim kami akan meninjau segera.',
        failed: 'Gagal!',
        errorSaving: 'Terjadi kesalahan saat menyimpan profil Anda.',
        errorSubmitting: 'Terjadi kesalahan saat mengirim permintaan Anda.',
        allFieldsRequired: 'Semua kolom wajib diisi.',

        // Loading
        loading: 'Memuat...',
        loadingProfile: 'Memuat profil...',
        loadingServices: 'Memuat layanan...',
        loadingHistory: 'Memuat riwayat...',

        // Access
        accessDenied: 'Akses Ditolak',
        mustLogin: 'Anda harus login terlebih dahulu!'
    }
    }
}


export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en')

    useEffect(() => {
        const savedLang = localStorage.getItem('language') || 'en'
        setLanguage(savedLang)
    }, [])

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'id' : 'en'
        setLanguage(newLang)
        localStorage.setItem('language', newLang)
    }

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t: translations }}>
        {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    return useContext(LanguageContext)
}