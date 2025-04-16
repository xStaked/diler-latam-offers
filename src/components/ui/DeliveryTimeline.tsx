import React from "react";
import {
    UserCheck,
    Navigation,
    Store,
    Truck,
    MapPin,
    CheckCircle,
} from "lucide-react";

const deliverySteps = [
    { key: "assigned", label: "Asignado", icon: UserCheck },
    { key: "heading_to_store", label: "En ruta al negocio", icon: Navigation },
    { key: "arrived_at_store", label: "Llegó al negocio", icon: Store },
    { key: "heading_to_customer", label: "En ruta al cliente", icon: Truck },
    { key: "arrived_at_customer", label: "Llegó al destino", icon: MapPin },
    { key: "completed", label: "Entregado", icon: CheckCircle },
];

interface DeliveryTimelineProps {
    currentStatus: string;
}

const DeliveryTimeline: React.FC<DeliveryTimelineProps> = ({ currentStatus }) => {
    const currentIndex = deliverySteps.findIndex((step) => step.key === currentStatus);
    const progressPercentage = ((currentIndex + 1) / deliverySteps.length) * 100;

    return (
        <div className="border-2 border-[#E8F4D4] rounded-lg shadow-lg p-4 sm:p-2 w-full overflow-x-auto z-0 relative">
            <h2 className="text-lg sm:text-base font-semibold mb-6 text-center">Seguimiento del pedido</h2>


            <div className="left-3 relative flex items-center justify-between w-[90%] px">

                <div className="absolute top-[20px] left-0 right-0 h-0.5 bg-gray-300 z-0" />
                <div
                    className="absolute top-[20px] left-0 h-0.5 bg-green-500 z-0 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                />



                {deliverySteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = index === currentIndex;
                    const isCompleted = index < currentIndex;

                    return (
                        <div key={step.key} className="left-6 flex flex-col items-center z-10 w-full relative">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${isActive
                                        ? "bg-green-600 border-green-600 text-white"
                                        : isCompleted
                                            ? "bg-green-100 border-green-300 text-green-600"
                                            : "bg-white border-gray-300 text-gray-400"
                                    }`}
                            >
                                <Icon size={20} />
                            </div>
                            <span
                                className={`mt-2 text-sm sm:text-xs text-center h-10 flex items-center justify-center ${isActive ? "text-green-600 font-semibold" : "text-gray-500"
                                    }`}
                            >
                                {step.label}
                            </span>


                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DeliveryTimeline;
