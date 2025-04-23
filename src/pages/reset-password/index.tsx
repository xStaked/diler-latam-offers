import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPassword } from "@/services/resetPasswordService";
import DilerLogo from "@/assets/diler-logo.webp";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");

    const handleReset = async () => {
        if (!token) {
            setError("Token no válido.");
            return;
        }

        if (!newPassword || !confirmPassword) {
            setError("Todos los campos son obligatorios.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        try {
            setLoading(true);
            const response = await resetPassword(token, newPassword);
            if (response.success) {
                setSuccess(true);
                setTimeout(() => navigate("/login"), 3000);
            } else {
                setError(response.message || "Error al cambiar la contraseña.");
            }
        } catch (err) {
            setError("Error del servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-white px-4 py-8">
            <Card className="w-full max-w-sm shadow-md border-none bg-[#F1FCE9] text-black rounded-xl">
                <CardHeader className="text-center">
                    <img src={DilerLogo} alt="Logo" className="w-28 h-28 mx-auto mb-2" />
                    <CardTitle className="text-[#020202] text-lg font-bold">
                        Restablecer Contraseña
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {success ? (
                        <p className="text-green-600 text-center font-medium">
                            ¡Contraseña actualizada con éxito! Redirigiendo al login...
                        </p>
                    ) : (
                        <>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                            <input
                                type="password"
                                placeholder="Nueva contraseña"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-[#A4D150] rounded-md bg-white placeholder-gray-500"
                            />
                            <input
                                type="password"
                                placeholder="Confirmar contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-[#A4D150] rounded-md bg-white placeholder-gray-500"
                            />
                            <button
                                onClick={handleReset}
                                disabled={loading}
                                className="w-full text-black font-bold py-2 rounded-md"
                                style={{
                                    backgroundColor: "#A4D150",        // verde exacto del logo
                                    border: "none",
                                    outline: "none",
                                    boxShadow: "none",
                                    opacity: loading ? 0.6 : 1,         // se ve "deshabilitado" si loading
                                    cursor: loading ? "not-allowed" : "pointer"
                                }}
                            >
                                {loading ? "Procesando..." : "Actualizar contraseña"}
                            </button>





                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
