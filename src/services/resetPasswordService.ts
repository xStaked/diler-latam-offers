import { API_URL } from "@/constants";

export const resetPassword = async (token: string, newPassword: string) => {
  const response = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      newPassword,
    }),
  });
  return response.json();
};
