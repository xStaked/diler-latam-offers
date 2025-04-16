import { useEffect, useState, useRef } from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  customerResponse,
  getNegotiationByOrderId,
} from "@/services/negotiationService";
import { useParams } from "react-router-dom";
import { API_URL } from "@/constants";
import DilerLogo from "@/assets/diler-logo.webp";
import DeliveryTimeline from "@/components/ui/DeliveryTimeline";


interface Offer {
  id: string;
  price: number;
  proposedBy: string;
  timestamp: string;
  status?: string;
}

interface Negotiation {
  _id: string;
  orderId: string;
  deliveryId: string;
  storeId: string;
  initialPrice: number;
  currentPrice: number;
  priceHistory: Offer[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  _id: string;
  deliveryId: string;
  storeId: string;
  pickupAddress: string;
  deliveryAddress: string;
  orderDescription: string;
  customerEmail: string;
  status: string;
  deliveryStatus: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetail() {
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counterOfferPrice, setCounterOfferPrice] = useState("");
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const { orderId, token } = useParams(); // ¡Funciona igual que en v5/v6!

  const pollingIntervalRef = useRef<number | null>(null);

  const fetchNegotiationData = async () => {
    if (!orderId || !token) return;

    try {
      const negotiationData = await getNegotiationByOrderId(
        orderId as string,
        token
      );
      setNegotiation(negotiationData);
      return negotiationData;
    } catch (err) {
      console.log("Error al cargar la negociación:", err);
      return null;
    }
  };

  const fetchOrderData = async () => {
    if (!orderId) return;

    try {
      const orderResponse = await fetch(
        `${API_URL}/negotiation/by-order/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!orderResponse.ok) throw new Error("Error al cargar la orden");
      const orderData = await orderResponse.json();
      setOrder(orderData);
      console.log(orderData);
      console.log("Polling activo:", Boolean(pollingIntervalRef.current));

      return orderData;
    } catch (err) {
      console.log("Error al cargar la orden:", err);
      setError("Error al cargar los datos de la orden");
      return null;
    }
  };

  const startPolling = () => {
    console.log("Polling activo:", Boolean(pollingIntervalRef.current));

    console.log("Dentro")
    const getRandomInterval = () => Math.floor(Math.random() * 5000);

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = window.setInterval(async () => {
      console.log("Polling for updates...");
    
      // Actualiza orden
      const orderData = await fetchOrderData();
      console.log("Estado actual de la orden:", orderData?.status);
    
      // Actualiza negociación
      const updatedNegotiation = await fetchNegotiationData();
    
      // Verifica condiciones para detener polling
      const isNegotiationAccepted = updatedNegotiation?.status === "accepted";
      const isOrderDelivered = orderData?.status === "delivered";
    
      if (isNegotiationAccepted && isOrderDelivered) {
        console.log("Negociación aceptada y orden entregada, deteniendo polling");
        if (pollingIntervalRef.current) {
          window.clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    }, getRandomInterval());
  };

  useEffect(() => {
    if (!orderId) return;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        await fetchOrderData();
        const negotiationData = await fetchNegotiationData();
        if (negotiationData && negotiationData.status !== "delivered") {
          startPolling();
          console.log("1");
        }
      } catch (err) {
        console.log(err);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Cleanup function to clear interval when component unmounts
    return () => {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
      }
    };
  }, [orderId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const acceptOffer = async () => {
    if (!negotiation) return;

    try {
      const updatedNegotiation = await customerResponse(
        negotiation._id,
        "accept",
        undefined,
        token
      );
      setNegotiation(updatedNegotiation);

      // Stop polling if negotiation is accepted
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    } catch (err) {
      setError("Error al aceptar la oferta");
      console.error(err);
    }
  };

  const rejectOffer = () => {
    setShowCounterOffer(true);
  };

  const sendCounterOffer = async () => {
    if (!negotiation) return;

    const price = Number.parseFloat(counterOfferPrice);
    if (isNaN(price)) return;

    try {
      const updatedNegotiation = await customerResponse(
        negotiation._id,
        "reject",
        price,
        token
      );
      setNegotiation(updatedNegotiation);
      setCounterOfferPrice("");
      setShowCounterOffer(false);

      // Ensure polling is active after counter-offer
      if (!pollingIntervalRef.current) {
        startPolling();
      }
    } catch (err) {
      setError("Error al enviar la contraoferta");
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "created":
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-200"
          >
            Creado
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-800 border-amber-200"
          >
            Pendiente
          </Badge>
        );
      case "confirmed":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-200"
          >
            Confirmado
          </Badge>
        );
      case "delivered":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-200"
          >
            Entregado
          </Badge>
        );
  
      case "assigned":
        return (
          <Badge
            variant="outline"
            className="bg-sky-100 text-sky-800 border-sky-200"
          >
            Asignado
          </Badge>
        );
      case "heading_to_store":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-200"
          >
            En ruta al negocio
          </Badge>
        );
      case "arrived_at_store":
        return (
          <Badge
            variant="outline"
            className="bg-orange-100 text-orange-800 border-orange-200"
          >
            Llegó al negocio
          </Badge>
        );
      case "heading_to_customer":
        return (
          <Badge
            variant="outline"
            className="bg-indigo-100 text-indigo-800 border-indigo-200"
          >
            En ruta al cliente
          </Badge>
        );
      case "arrived_at_customer":
        return (
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-800 border-purple-200"
          >
            Llegó al destino
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-200"
          >
            Entregado
          </Badge>
        );
  
      // Fallback
      default:
        return (
          <Badge
            variant="outline"
            className="bg-neutral-100 text-neutral-800 border-neutral-200"
          >
            Desconocido
          </Badge>
        );
    }
  };
  

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>{error}</div>;
  if (!negotiation) return <div>No se encontró la negociación</div>;

  const lastDeliveryOffer = negotiation.priceHistory
    .filter((offer) => offer.proposedBy === "delivery")
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

  return (
    <div className="flex min-h-screen w-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-white px-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">Detalles del Pedido</h2>
          </div>
          <div className="h-25 w-25">
            <img
              src={DilerLogo || "/placeholder.svg"}
              alt="Diler Logo"
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 bg-gray-50">
        <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
        {/* Order details card */}
            <Card className="flex-1 border-none shadow-md">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#A4D150]">
                    Pedido #{order?._id}
                  </CardTitle>
                  {getStatusBadge(order?.status as string)}
                </div>
                <CardDescription>
                  Creado el {formatDate(order?.createdAt as string)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">
                    Descripción del Pedido
                  </h3>
                  <p>{order?.orderDescription}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">
                      Dirección de Recogida
                    </h3>
                    <p>{order?.pickupAddress}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">
                      Dirección de Entrega
                    </h3>
                    <p>{order?.deliveryAddress}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">
                    Estado de la Entrega
                  </h3>
                  {getStatusBadge(order?.deliveryStatus || "unknown")}
                </div>

                <DeliveryTimeline currentStatus={order?.deliveryStatus || "assigned"} />

              </CardContent>
            </Card>

            <Card className="flex-1 border-none shadow-md">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-[#A4D150]">
                  Negociación con Repartidor
                </CardTitle>
                <CardDescription>
                  Negocia el precio de entrega con tu repartidor
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {(negotiation.status === "pending" ||
                  negotiation.status === "counter_offered" ||
                  negotiation.status === "counter-offered") &&
                  lastDeliveryOffer && (
                    <div className="border rounded-md p-4 space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">
                          Oferta del Repartidor
                        </p>
                        <p className="text-3xl font-bold">
                          €{lastDeliveryOffer.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          className="bg-[#A4D150] hover:bg-[#94BD48] dark:text-white text-black flex items-center justify-center gap-2"
                          onClick={acceptOffer}
                        >
                          <Check className="h-4 w-4" />
                          Aceptar
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                          onClick={rejectOffer}
                        >
                          <X className="h-4 w-4" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  )}

                {/* Mostrar formulario de contraoferta si el usuario hizo clic en Rechazar */}
                {showCounterOffer && negotiation.status !== "accepted" && (
                  <div className="border rounded-md p-4 space-y-4">
                    <h3 className="font-medium">Hacer Contraoferta</h3>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5">€</span>
                        <Input
                          type="number"
                          step="0.50"
                          min="0"
                          className="pl-7"
                          placeholder="0.00"
                          value={counterOfferPrice}
                          onChange={(e) => setCounterOfferPrice(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={sendCounterOffer}
                        className="bg-[#A4D150] hover:bg-[#94BD48] dark:text-white text-black"
                      >
                        Enviar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Mostrar precio acordado si la negociación fue aceptada */}
                {negotiation.status === "accepted" && (
                  <div className="border rounded-md p-4 bg-[#E8F4D4] border-[#A4D150]/30">
                    <div className="text-center">
                      <p className="text-sm text-[#6A8633] mb-1">
                        Precio Acordado
                      </p>
                      <p className="text-3xl font-bold text-[#A4D150]">
                        €{negotiation.currentPrice.toFixed(2)}
                      </p>
                      <p className="text-sm text-[#6A8633] mt-2">
                        ¡Genial! Has acordado un precio con tu repartidor.
                      </p>
                    </div>
                  </div>
                )}

                {/* Historial de ofertas */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Historial de Ofertas</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {negotiation.priceHistory?.map((offer, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 border rounded-md text-sm"
                      >
                        <div>
                          <span className="font-medium">
                            {offer.proposedBy === "delivery"
                              ? "Repartidor"
                              : "Tú"}
                            :
                          </span>{" "}
                          €{offer.price.toFixed(2)}
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            negotiation.status === "accepted" &&
                            negotiation.currentPrice === offer.price
                              ? "bg-[#E8F4D4] text-[#A4D150] border-[#A4D150]/30"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          }
                        >
                          {negotiation.status === "accepted" &&
                          negotiation.currentPrice === offer.price
                            ? "Aceptada"
                            : "Pendiente"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
