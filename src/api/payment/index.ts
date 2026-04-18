import { handleApiError } from '../errorHandler'
import { API_BASE_URL } from '../../lib/api'

function getCookie(name: string): string | null {
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookieElement = cookies[i]
      if (cookieElement) {
        const cookie = cookieElement.trim()
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
          break
        }
      }
    }
  }
  return cookieValue
}

export type PaymentMethodType = 'card' | 'google_pay' | 'apple_pay'

export interface SubscriptionStatus {
    id: string
    status: 'free' | 'paid'
    expires_at?: string
    is_paid: boolean
    is_active: boolean
    created_at: string
    updated_at: string
    // Subscription auto-renewal fields
    auto_renew?: boolean
    saved_card_last4?: string
    saved_card_brand?: string
    saved_payment_method_type?: PaymentMethodType
    next_billing_date?: string
    has_saved_payment_method?: boolean
}

export interface Payment {
    id: string
    order_id: string
    amount: number
    currency: string
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
    checkout_url?: string
    payment_method_type?: PaymentMethodType
    card_last4?: string
    card_brand?: string
    is_renewal?: boolean
    created_at: string
}

export interface CreatePaymentResponse {
    payment_id: string
    checkout_url: string
    order_id: string
    amount: number
    currency: string
}

export interface CreateEmbeddedPaymentResponse {
    payment_id: string
    token: string
    order_id: string
    merchant_id: number
    amount: number
    currency: string
}

export const paymentApi = {
  // Get current subscription status
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const response = await fetch(`${API_BASE_URL}/api/payment/subscription/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    return await response.json()
  },

  // Create a new payment for premium subscription
  createPayment: async (options?: {
    auto_renew?: boolean
    save_payment_method?: boolean
  }): Promise<CreatePaymentResponse> => {
    const csrfToken = getCookie('csrftoken')

    const response = await fetch(`${API_BASE_URL}/api/payment/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || ''
      },
      credentials: 'include',
      body: JSON.stringify({
        auto_renew: options?.auto_renew || false,
        save_payment_method: options?.save_payment_method || false
      })
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    return await response.json()
  },

  // Get payment history
  getPaymentHistory: async (): Promise<Payment[]> => {
    const response = await fetch(`${API_BASE_URL}/api/payment/history/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    return await response.json()
  },

  // Cancel subscription auto-renewal
  cancelSubscription: async (): Promise<SubscriptionStatus> => {
    const csrfToken = getCookie('csrftoken')

    const response = await fetch(`${API_BASE_URL}/api/payment/subscription/cancel/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || ''
      },
      credentials: 'include'
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    return await response.json()
  },

  // Reactivate subscription auto-renewal
  reactivateSubscription: async (): Promise<SubscriptionStatus> => {
    const csrfToken = getCookie('csrftoken')

    const response = await fetch(`${API_BASE_URL}/api/payment/subscription/reactivate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || ''
      },
      credentials: 'include'
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    return await response.json()
  },

  // Remove saved payment method
  removePaymentMethod: async (): Promise<SubscriptionStatus> => {
    const csrfToken = getCookie('csrftoken')

    const response = await fetch(`${API_BASE_URL}/api/payment/subscription/remove-payment-method/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || ''
      },
      credentials: 'include'
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    return await response.json()
  },

  // Create embedded payment token for ChatGPT-style checkout page
  createEmbeddedPayment: async (options?: {
    auto_renew?: boolean
    save_payment_method?: boolean
    region?: string  // Country code for region-based pricing
  }): Promise<CreateEmbeddedPaymentResponse> => {
    const csrfToken = getCookie('csrftoken')

    const response = await fetch(`${API_BASE_URL}/api/payment/create-embedded/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || ''
      },
      credentials: 'include',
      body: JSON.stringify({
        auto_renew: options?.auto_renew || false,
        save_payment_method: options?.save_payment_method || false,
        region: options?.region || 'GE'  // Default to Georgia
      })
    })

    if (!response.ok) {
      await handleApiError(response)
    }

    return await response.json()
  }
}
