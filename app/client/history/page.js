'use client'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/languageContext'
import { FileText, Wrench, Receipt, Calendar } from 'lucide-react'

export default function ClientHistory() {
  const { language, t } = useLanguage()
  const texts = t.client[language]
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState([])
  const [serviceHistory, setServiceHistory] = useState([])
  const [customerData, setCustomerData] = useState(null)

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    fetchData()

    return () => observer.disconnect()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Get customer data
      const emailCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userEmail='))
        ?.split('=')[1]

      const decodedEmail = emailCookie ? decodeURIComponent(emailCookie) : ''

      const resCustomers = await fetch('/api/customers')
      const customers = await resCustomers.json()
      const customer = customers.find(c => c.email === decodedEmail)

      if (customer) {
        setCustomerData(customer)

        // Get invoices
        const resInvoices = await fetch('/api/invoices')
        const allInvoices = await resInvoices.json()
        const customerInvoices = allInvoices.filter(
          inv => inv.customer_id === customer.customer_id
        )
        setInvoices(customerInvoices)

        // Get service history (terminated/inactive)
        const resServices = await fetch('/api/services')
        const allServices = await resServices.json()
        const customerServiceHistory = allServices.filter(
          s => s.customer_id === customer.customer_id &&
               (s.status === 'terminated' || s.status === 'inactive')
        )
        setServiceHistory(customerServiceHistory)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const configs = {
      paid: {
        bg: darkMode ? 'bg-green-600' : 'bg-green-100',
        text: darkMode ? 'text-white' : 'text-green-800',
        label: texts.paid
      },
      pending: {
        bg: darkMode ? 'bg-yellow-600' : 'bg-yellow-100',
        text: darkMode ? 'text-white' : 'text-yellow-800',
        label: texts.pending
      },
      overdue: {
        bg: darkMode ? 'bg-red-600' : 'bg-red-100',
        text: darkMode ? 'text-white' : 'text-red-800',
        label: texts.overdue
      },
      terminated: {
        bg: darkMode ? 'bg-red-600' : 'bg-red-100',
        text: darkMode ? 'text-white' : 'text-red-800',
        label: texts.terminated
      },
      inactive: {
        bg: darkMode ? 'bg-gray-600' : 'bg-gray-100',
        text: darkMode ? 'text-white' : 'text-gray-800',
        label: texts.inactive
      }
    }

    const config = configs[status] || configs.pending
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getServiceName = (type) => {
    switch(type) {
      case 'sip_trunk': return texts.sipTrunk
      case 'cctv': return texts.cctv
      case 'gcp_aws': return texts.cloudService
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className={`h-12 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
          <div className={`h-64 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
          <div className={`h-64 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Payment History */}
      <div className={`rounded-xl p-6 shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className="mb-6">
          <h2 className={`text-2xl font-bold flex items-center gap-3 ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            <Receipt className="w-7 h-7" />
            {texts.paymentHistory}
          </h2>
          <p className={`mt-2 ${
            darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {texts.paymentHistoryDesc}
          </p>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {texts.noPaymentHistory}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.invoiceId}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.amount}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.dueDate}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.status}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.createdDate}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {invoices.map((invoice) => (
                  <tr key={invoice.invoice_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 text-sm font-mono ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      {invoice.invoice_id?.substring(0, 8)}...
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold ${
                      darkMode ? 'text-slate-300' : 'text-gray-900'
                    }`}>
                      Rp {Number(invoice.amount).toLocaleString('id-ID')}
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Service History */}
      <div className={`rounded-xl p-6 shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className="mb-6">
          <h2 className={`text-2xl font-bold flex items-center gap-3 ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            <Wrench className="w-7 h-7" />
            {texts.serviceHistory}
          </h2>
          <p className={`mt-2 ${
            darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {texts.serviceHistoryDesc}
          </p>
        </div>

        {serviceHistory.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {texts.noServiceHistory}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceHistory.map((service) => (
              <div
                key={service.service_id}
                className={`rounded-xl p-5 border-2 ${
                  darkMode
                    ? 'bg-slate-700/30 border-slate-600'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className={`text-lg font-semibold ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {getServiceName(service.service_type)}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      darkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {texts.startDate}: {new Date(service.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(service.status)}
                </div>

                <div className={`flex items-center gap-2 text-sm ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <Calendar className="w-4 h-4" />
                  <span>
                    {language === 'en' ? 'Service ended' : 'Layanan berakhir'}: {
                      service.end_date
                        ? new Date(service.end_date).toLocaleDateString()
                        : '-'
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}