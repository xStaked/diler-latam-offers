import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPassword } from "@/services/resetPasswordService";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import DilerLogo from "@/assets/diler-logo.webp";

const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;

  let strength = 0;

  if (password.length >= 8) strength += 25;

  if (/\d/.test(password)) strength += 25;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;

  if (/[^A-Za-z0-9]/.test(password)) strength += 25;

  return strength;
};

const getStrengthColor = (strength: number): string => {
  if (strength < 50) return "bg-red-500";
  if (strength < 75) return "bg-yellow-500";
  return "bg-green-500";
};

const getStrengthText = (strength: number): string => {
  if (strength < 50) return "Débil";
  if (strength < 75) return "Media";
  return "Fuerte";
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();

  const [formState, setFormState] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formState.newPassword));
  }, [formState.newPassword]);

  // Manejar la cuenta regresiva después del éxito
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isSuccess && countdown === 0) {
      navigate("/login");
    }
  }, [isSuccess, countdown, navigate]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formState.newPassword) {
      newErrors.newPassword = "La contraseña es obligatoria";
    } else if (formState.newPassword.length < 8) {
      newErrors.newPassword = "La contraseña debe tener al menos 8 caracteres";
    }

    if (!formState.confirmPassword) {
      newErrors.confirmPassword = "Debes confirmar la contraseña";
    } else if (formState.newPassword !== formState.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));

    // Limpiar errores al escribir
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setServerError(
        "Token no válido o expirado. Solicita un nuevo enlace de restablecimiento."
      );
      return;
    }

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setServerError("");

      const response = await resetPassword(token, formState.newPassword);

      if (response.success) {
        setIsSuccess(true);
      } else {
        setServerError(
          response.message ||
            "Error al cambiar la contraseña. Inténtalo de nuevo."
        );
      }
    } catch (error) {
      setServerError(
        "Ha ocurrido un error en el servidor. Inténtalo más tarde."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-b from-white to-[#F8FDF3] p-4">
      <Card className="w-full max-w-md shadow-lg border border-[#E5F5D3] bg-white rounded-xl">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-center mb-2">
            <img
              src={DilerLogo || "/placeholder.svg"}
              alt="Diler Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-[#333333]">
            Restablecer Contraseña
          </CardTitle>
          <CardDescription className="text-[#666666]">
            Crea una nueva contraseña segura para tu cuenta
          </CardDescription>
        </CardHeader>

        <CardContent>
          {serverError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {isSuccess ? (
            <div className="space-y-4 text-center py-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-green-700">
                ¡Contraseña actualizada con éxito!
              </h3>
              <p className="text-gray-600">
                Tu contraseña ha sido restablecida correctamente. Serás
                redirigido a la página de inicio de sesión en {countdown}{" "}
                segundos.
              </p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={handleBackToLogin}
              >
                Ir al inicio de sesión ahora
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu nueva contraseña"
                    value={formState.newPassword}
                    onChange={handleInputChange}
                    className={`pr-10 ${
                      errors.newPassword
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-[#A4D150] focus-visible:ring-[#A4D150]"
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"}
                    </span>
                  </Button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.newPassword}
                  </p>
                )}

                {formState.newPassword && (
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span>Fortaleza:</span>
                      <span
                        className={
                          passwordStrength >= 75
                            ? "text-green-600"
                            : passwordStrength >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {getStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <Progress
                      value={passwordStrength}
                      className={`h-1.5 ${getStrengthColor(passwordStrength)}`}
                    />

                    <ul className="text-xs space-y-1 mt-2 text-gray-600">
                      <li
                        className={`flex items-center gap-1 ${
                          formState.newPassword.length >= 8
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Al menos 8 caracteres
                      </li>
                      <li
                        className={`flex items-center gap-1 ${
                          /\d/.test(formState.newPassword)
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Al menos un número
                      </li>
                      <li
                        className={`flex items-center gap-1 ${
                          /[a-z]/.test(formState.newPassword) &&
                          /[A-Z]/.test(formState.newPassword)
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Mayúsculas y minúsculas
                      </li>
                      <li
                        className={`flex items-center gap-1 ${
                          /[^A-Za-z0-9]/.test(formState.newPassword)
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Al menos un carácter especial
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirma tu nueva contraseña"
                    value={formState.confirmPassword}
                    onChange={handleInputChange}
                    className={`pr-10 ${
                      errors.confirmPassword
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "border-[#A4D150] focus-visible:ring-[#A4D150]"
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showConfirmPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"}
                    </span>
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-[#A4D150] hover:bg-[#93BC45]  font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    "Actualizar contraseña"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t border-[#E5F5D3] pt-4 pb-6">
          <div className="flex flex-col items-center text-sm text-gray-500">
            <div className="flex items-center gap-1 mt-2 text-xs">
              <ShieldCheck className="h-3 w-3" />
              <span>Conexión segura</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
