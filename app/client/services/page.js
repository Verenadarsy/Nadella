'use client'
import { useEffect, useState } from 'react'
import { showAlert } from '@/lib/sweetalert'
import { useLanguage } from '@/lib/languageContext'
import {
  Wrench, Eye, EyeOff, Copy, Check,
  Server, Camera, Cloud, AlertCircle
} from 'lucide-react'

export default function ClientServices() {
  const { language, t } = useLanguage()
  const texts = t.client[language]
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState([])
  const [customerData, setCustomerData] = useState(null)
  const [showPasswords, setShowPasswords] = useState({})
  const [copiedField, setCopiedField] = useState('')
  const [form, setForm] = useState({
    service_type: '',
    provider: '',
    notes: ''
  })

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

        // Get services for this customer
        const resServices = await fetch('/api/services')
        const allServices = await resServices.json()
        const customerServices = allServices.filter(
          s => s.customer_id === customer.customer_id && s.status === 'active'
        )

        // Fetch service details for each service
        const servicesWithDetails = await Promise.all(
          customerServices.map(async (service) => {
            let details = null

            if (service.service_type === 'sip_trunk') {
              const res = await fetch(`/api/services/sip-trunk?service_id=${service.service_id}`)
              if (res.ok) details = await res.json()
            } else if (service.service_type === 'cctv') {
              const res = await fetch(`/api/services/cctv?service_id=${service.service_id}`)
              if (res.ok) details = await res.json()
            } else if (service.service_type === 'gcp_aws') {
              const res = await fetch(`/api/services/cloud?service_id=${service.service_id}`)
              if (res.ok) details = await res.json()
            }

            return { ...service, details }
          })
        )

        setServices(servicesWithDetails)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })

    // Reset provider if service type changes
    if (name === 'service_type' && value !== 'gcp_aws') {
      setForm(prev => ({ ...prev, provider: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.service_type || !form.notes) {
      showAlert({
        icon: 'warning',
        title: texts.failed,
        text: texts.allFieldsRequired
      }, darkMode)
      return
    }

    if (form.service_type === 'gcp_aws' && !form.provider) {
      showAlert({
        icon: 'warning',
        title: texts.failed,
        text: texts.allFieldsRequired
      }, darkMode)
      return
    }

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerData.customer_id,
          service_type: form.service_type,
          status: 'pending',
          notes: form.notes,
          provider: form.provider || null
        })
      })

      if (res.ok) {
        showAlert({
          icon: 'success',
          title: texts.requestSubmitted,
          text: texts.requestSuccess,
          timer: 2000,
          showConfirmButton: false
        }, darkMode)
        setForm({ service_type: '', provider: '', notes: '' })
        fetchData()
      } else {
        showAlert({
          icon: 'error',
          title: texts.failed,
          text: texts.errorSubmitting
        }, darkMode)
      }
    } catch (err) {
      console.error('Error submitting request:', err)
      showAlert({
        icon: 'error',
        title: texts.failed,
        text: texts.errorSubmitting
      }, darkMode)
    }
  }

  const togglePassword = (serviceId, field) => {
    const key = `${serviceId}-${field}`
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  const getServiceIcon = (type) => {
    switch(type) {
      case 'sip_trunk': return <Server className="w-6 h-6" />
      case 'cctv': return <Camera className="w-6 h-6" />
      case 'gcp_aws': return <Cloud className="w-6 h-6" />
      default: return <Wrench className="w-6 h-6" />
    }
  }

  const getServiceName = (type) => {
    switch(type) {
      case 'sip_trunk': return texts.sipTrunk
      case 'cctv': return texts.cctv
      case 'gcp_aws': return texts.cloudService
      default: return type
    }
  }

  const renderServiceDetails = (service) => {
    if (!service.details) return null

    const isPasswordVisible = (field) => showPasswords[`${service.service_id}-${field}`]
    const isCopied = (field) => copiedField === `${service.service_id}-${field}`

    const CredentialRow = ({ label, value, isPassword = false, fieldName }) => (
      <div className={`flex items-center justify-between p-3 rounded-lg ${
        darkMode ? 'bg-slate-700' : 'bg-gray-50'
      }`}>
        <div className="flex-1">
          <p className={`text-xs font-medium mb-1 ${
            darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {label}
          </p>
          <p className={`font-mono text-sm ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            {isPassword && !isPasswordVisible(fieldName) ? '••••••••' : value || '-'}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {isPassword && (
            <button
              onClick={() => togglePassword(service.service_id, fieldName)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'
              }`}
              title={isPasswordVisible(fieldName) ? texts.hidePassword : texts.showPassword}
            >
              {isPasswordVisible(fieldName) ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={() => copyToClipboard(value, `${service.service_id}-${fieldName}`)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'
            }`}
            title={texts.copy}
          >
            {isCopied(fieldName) ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    )

    if (service.service_type === 'sip_trunk') {
      return (
        <div className="space-y-3">
          <CredentialRow
            label={texts.userIdPhone}
            value={service.details.user_id_phone}
            fieldName="user_id_phone"
          />
          <CredentialRow
            label={texts.password}
            value={service.details.password}
            isPassword={true}
            fieldName="password"
          />
          <CredentialRow
            label={texts.sipServer}
            value={service.details.sip_server}
            fieldName="sip_server"
          />
        </div>
      )
    }

    if (service.service_type === 'cctv') {
      return (
        <div className="space-y-3">
          <CredentialRow
            label={texts.userAccount}
            value={service.details.user_account}
            fieldName="user_account"
          />
          <CredentialRow
            label={texts.password}
            value={service.details.password}
            isPassword={true}
            fieldName="password"
          />
          <CredentialRow
            label={texts.serialNumber}
            value={service.details.serial_no}
            fieldName="serial_no"
          />
          <CredentialRow
            label={texts.encryptionCode}
            value={service.details.encryption_code}
            fieldName="encryption_code"
          />
          <CredentialRow
            label={texts.mobileAppUser}
            value={service.details.user_mobile_app}
            fieldName="user_mobile_app"
          />
          <CredentialRow
            label={texts.mobileAppPassword}
            value={service.details.pwd_mobile_app}
            isPassword={true}
            fieldName="pwd_mobile_app"
          />
        </div>
      )
    }

    if (service.service_type === 'gcp_aws') {
      return (
        <div className="space-y-3">
          <CredentialRow
            label={texts.provider}
            value={service.details.provider?.toUpperCase()}
            fieldName="provider"
          />
          <CredentialRow
            label={texts.userEmail}
            value={service.details.user_email}
            fieldName="user_email"
          />
          <CredentialRow
            label={texts.password}
            value={service.details.password}
            isPassword={true}
            fieldName="password"
          />
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className={`h-12 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
          <div className={`h-64 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* My Active Services */}
      <div className={`rounded-xl p-6 shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className="mb-6">
          <h2 className={`text-2xl font-bold ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            {texts.myServices}
          </h2>
          <p className={`mt-2 ${
            darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {texts.myServicesDesc}
          </p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {texts.noActiveServices}
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {texts.requestFirstService}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {services.map((service) => (
              <div
                key={service.service_id}
                className={`rounded-xl p-6 border-2 ${
                  darkMode
                    ? 'bg-slate-700/50 border-slate-600'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${
                      darkMode ? 'bg-blue-600' : 'bg-blue-900'
                    }`}>
                      <div className="text-white">
                        {getServiceIcon(service.service_type)}
                      </div>
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        darkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {getServiceName(service.service_type)}
                      </h3>
                      <p className={`text-sm ${
                        darkMode ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {texts.startDate}: {new Date(service.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    darkMode
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {texts.active}
                  </span>
                </div>

                {renderServiceDetails(service)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request New Service */}
      <div className={`rounded-xl p-6 shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className="mb-6">
          <h2 className={`text-2xl font-bold ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            {texts.requestNewService}
          </h2>
          <p className={`mt-2 ${
            darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {texts.requestServiceDesc}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Type */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {texts.serviceType}
            </label>
            <select
              name="service_type"
              value={form.service_type}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-200 text-slate-900 focus:border-blue-600'
              } outline-none`}
            >
              <option value="">{texts.selectServiceType}</option>
              <option value="sip_trunk">{texts.sipTrunk}</option>
              <option value="cctv">{texts.cctv}</option>
              <option value="gcp_aws">{texts.cloudService}</option>
            </select>
          </div>

          {/* Provider (only for Cloud) */}
          {form.service_type === 'gcp_aws' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.provider}
              </label>
              <select
                name="provider"
                value={form.provider}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 focus:border-blue-600'
                } outline-none`}
              >
                <option value="">{texts.selectProvider}</option>
                <option value="gcp">{texts.gcp}</option>
                <option value="aws">{texts.aws}</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {texts.notesRequest}
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              required
              rows="4"
              placeholder={texts.notesPlaceholder}
              className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors resize-none ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                  : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
              } outline-none`}
            />
          </div>

          {/* Info Box */}
          <div className={`flex items-start gap-3 p-4 rounded-lg ${
            darkMode ? 'bg-blue-900/20 border-2 border-blue-600' : 'bg-blue-50 border-2 border-blue-200'
          }`}>
            <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
              darkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <p className={`text-sm ${
              darkMode ? 'text-blue-300' : 'text-blue-700'
            }`}>
              {language === 'en'
                ? 'Your service request will be reviewed by our team. You will receive your service credentials once approved.'
                : 'Permintaan layanan Anda akan ditinjau oleh tim kami. Anda akan menerima kredensial layanan setelah disetujui.'
              }
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            {texts.submitRequest}
          </button>
        </form>
      </div>
    </div>
  )
}