import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Mail, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ToastProvider'
import { useTranslation } from 'react-i18next'

export default function ResetPassword() {
  const { t } = useTranslation(['auth'])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { resetPassword } = useAuth()
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await resetPassword(email)
      setSent(true)
      toast.success(t('auth:resetPassword.resetEmailSent'))
    } catch (error: any) {
      toast.error(error.message || t('auth:resetPassword.resetFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="p-3 bg-green-600 rounded-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {t('auth:resetPassword.checkEmailTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth:resetPassword.checkEmailMessage')}{' '}
            <span className="font-medium">{email}</span>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                {t('auth:resetPassword.checkEmailInstructions')}
              </p>

              <div className="pt-4">
                <button
                  onClick={() => setSent(false)}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {t('auth:resetPassword.didntReceive')}
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-500"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  {t('auth:resetPassword.backToSignIn')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {t('auth:resetPassword.resetTitle')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('auth:resetPassword.resetInstructions')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth:resetPassword.email')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('auth:resetPassword.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '44px' }} // Touch-friendly
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  t('auth:resetPassword.sendResetLink')
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-500"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t('auth:resetPassword.backToSignIn')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
