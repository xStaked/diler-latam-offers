import { API_URL } from "@/constants";

export const createNegotiation = async (
  orderId: string,
  initialPrice: number,
  deliveryId: string,
  token: string
) => {
  const response = await fetch(`${API_URL}/negotiation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderId,
      initialPrice,
    }),
  });
  return response.json();
};

export const customerResponse = async (
  negotiationId: string,
  action: string,
  counterOffer?: number,
  token?: string
) => {
  const response = await fetch(
    `${API_URL}/negotiation/${negotiationId}/customer-response`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action,
        ...(counterOffer && { counterOffer }),
      }),
    }
  );
  return response.json();
};

export const getNegotiationByOrderId = async (
  orderId: string,
  token: string
) => {
  const response = await fetch(`${API_URL}/negotiation/order-negotiation/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const getPendingNegotiationsForCustomer = async (
  customerEmail: string,
  token: string
) => {
  const response = await fetch(`${API_URL}/negotiation/customer/pending`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};
