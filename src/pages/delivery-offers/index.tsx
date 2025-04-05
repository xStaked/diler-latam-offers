import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
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
  const { orderId } = useParams(); // ¡Funciona igual que en v5/v6!

  const pollingIntervalRef = useRef<number | null>(null);

  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvaG5kb2VAZ21haWwuY29tIiwicm9sZSI6WyJkZWxpdmVyeSJdLCJpZCI6IjY3ZTc2M2U2YTFiMDZiZDUyNTlkMTYyZiIsImlhdCI6MTc0MzgyNzg5OSwiZXhwIjoxNzQ2NDE5ODk5fQ.R1VeXox_JnNXtclALwMMm134pErRXXuctg7CQw4NQ2g";

  const fetchNegotiationData = async () => {
    if (!orderId) return;

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
      const orderResponse = await fetch(`${API_URL}/order/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!orderResponse.ok) throw new Error("Error al cargar la orden");
      const orderData = await orderResponse.json();
      setOrder(orderData);
      return orderData;
    } catch (err) {
      console.log("Error al cargar la orden:", err);
      setError("Error al cargar los datos de la orden");
      return null;
    }
  };

  const startPolling = () => {
    // Generate a random interval between 15-20 seconds (15000-20000 ms)
    const getRandomInterval = () => Math.floor(Math.random() * 5000) + 15000;

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
    }

    // Set new interval
    pollingIntervalRef.current = window.setInterval(async () => {
      // Only fetch negotiation if it's not in a final state
      if (negotiation && negotiation.status !== "accepted") {
        console.log("Polling for negotiation updates...");
        const updatedNegotiation = await fetchNegotiationData();

        // If negotiation is now accepted, we can stop polling
        if (updatedNegotiation && updatedNegotiation.status === "accepted") {
          console.log("Negotiation accepted, stopping polling");
          if (pollingIntervalRef.current) {
            window.clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } else if (!negotiation) {
        // If no negotiation exists yet, try to fetch it
        await fetchNegotiationData();
      } else if (negotiation.status === "accepted") {
        // If negotiation is already accepted, stop polling
        console.log("Negotiation already accepted, stopping polling");
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

        // Only start polling if negotiation exists and isn't accepted
        if (negotiationData && negotiationData.status !== "accepted") {
          startPolling();
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
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-800 border-amber-200"
          >
            Pendiente
          </Badge>
        );
      case "accepted":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-200"
          >
            Aceptado
          </Badge>
        );
      case "counter-offered":
      case "counter_offered":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 border-blue-200"
          >
            Contraoferta
          </Badge>
        );
      default:
        return <Badge variant="outline">Desconocido</Badge>;
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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background px-4 py-3">
        <div className="flex items-center">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Detalles del Pedido</h1>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Order details card */}
            <Card className="flex-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pedido #{orderId}</CardTitle>
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
              </CardContent>
            </Card>

            {/* Negotiation card */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Negociación con Repartidor</CardTitle>
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
                          className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
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
                      <Button onClick={sendCounterOffer}>Enviar</Button>
                    </div>
                  </div>
                )}

                {/* Mostrar precio acordado si la negociación fue aceptada */}
                {negotiation.status === "accepted" && (
                  <div className="border rounded-md p-4 bg-green-50 border-green-200">
                    <div className="text-center">
                      <p className="text-sm text-green-700 mb-1">
                        Precio Acordado
                      </p>
                      <p className="text-3xl font-bold text-green-800">
                        €{negotiation.currentPrice.toFixed(2)}
                      </p>
                      <p className="text-sm text-green-700 mt-2">
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
                              ? "bg-green-100 text-green-800 border-green-200"
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
