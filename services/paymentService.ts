import { DONATION_CONFIG } from "../constants";

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'authorized' | 'active' | 'cancelled' | 'approved' | 'rejected' | 'in_process';
  initPoint?: string; // Link para o usuário pagar/autorizar
  qrCode?: string;
  qrCodeBase64?: string;
}

const API_BASE = '/api/mp';

export const paymentService = {
  /**
   * Cria um pagamento via Pix (Créditos avulsos)
   */
  createPayment: async (amount: number, description: string, email: string): Promise<PaymentStatus> => {
    try {
      const response = await fetch(`${API_BASE}/v1/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DONATION_CONFIG.mercadoPagoAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transaction_amount: amount,
          description: description,
          payment_method_id: 'pix',
          payer: {
            email: email
          }
        })
      });

      if (!response.ok) throw new Error("Erro ao criar pagamento Pix");
      
      const data = await response.json();
      
      return {
        id: data.id.toString(),
        status: data.status,
        qrCode: data.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64
      };
    } catch (error) {
      console.error("Erro no pagamento Pix:", error);
      throw error;
    }
  },

  /**
   * Cria uma assinatura recorrente (PreApproval).
   * O usuário será redirecionado para o Checkout Pro para autorizar.
   */
  createSubscription: async (amount: number, title: string, email: string): Promise<PaymentStatus> => {
    try {
      const response = await fetch(`${API_BASE}/preapproval`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DONATION_CONFIG.mercadoPagoAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          back_url: window.location.origin + "/dashboard?subscription_success=true",
          reason: title,
          payer_email: email,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: amount,
            currency_id: "BRL"
          },
          status: "pending"
        })
      });

      if (!response.ok) {
          const errorData = await response.json();
          console.error("MP API Error:", errorData);
          throw new Error("Erro na API do Mercado Pago");
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        status: data.status,
        initPoint: data.init_point // Link de pagamento Checkout Pro
      };
    } catch (error) {
      console.error("Erro na assinatura:", error);
      throw error;
    }
  },

  /**
   * Verifica o status de um pagamento ou assinatura
   */
  checkStatus: async (paymentId: string): Promise<string> => {
    const isNumeric = /^\d+$/.test(paymentId);
    const endpoint = isNumeric ? 'v1/payments' : 'preapproval';

    try {
      const response = await fetch(`${API_BASE}/${endpoint}/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${DONATION_CONFIG.mercadoPagoAccessToken}` }
      });
      if (!response.ok) return 'pending';
      const data = await response.json();
      return data.status;
    } catch (e) {
      return 'pending';
    }
  }
};