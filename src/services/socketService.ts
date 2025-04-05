/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/socketService.ts
import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000/api"; // Replace with your actual API URL

// Socket service for handling negotiation events
export class SocketService {
  private socket: Socket | null = null;
  private token: string;
  private customerEmail: string;
  private deliveryId: string;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor(token: string, customerEmail?: string, deliveryId?: string) {
    this.token = token;
    this.customerEmail = customerEmail || "";
    this.deliveryId = deliveryId || "";
  }

  // Initialize the socket connection
  connect(): void {
    if (this.socket) return;

    this.socket = io(API_URL, {
      auth: {
        token: this.token,
      },
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("Socket connected");

      // Join rooms based on user type
      if (this.customerEmail) {
        this.socket?.emit("join_customer_room", {
          customerEmail: this.customerEmail,
        });
      }

      if (this.deliveryId) {
        this.socket?.emit("join_delivery_room", {
          deliveryId: this.deliveryId,
        });
      }
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Setup default listeners for negotiation events
    this.setupDefaultListeners();
  }

  // Setup default listeners for all negotiation events
  private setupDefaultListeners(): void {
    if (!this.socket) return;

    // Listen for customer updates
    this.socket.on("customer_update", (data) => {
      console.log("Customer update received:", data);
      this.notifyListeners("customer_update", data);

      // Notify specific action listeners
      if (data.action) {
        this.notifyListeners(`customer_${data.action}`, data);
      }
    });

    // Listen for delivery updates
    this.socket.on("delivery_update", (data) => {
      console.log("Delivery update received:", data);
      this.notifyListeners("delivery_update", data);

      // Notify specific action listeners
      if (data.action) {
        this.notifyListeners(`delivery_${data.action}`, data);
      }
    });

    // Listen for negotiation updates
    this.socket.on("negotiation_update", (data) => {
      console.log("Negotiation update received:", data);
      this.notifyListeners("negotiation_update", data);

      // Notify specific action listeners
      if (data.action) {
        this.notifyListeners(`negotiation_${data.action}`, data);
      }
    });
  }

  // Subscribe to a specific event
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Notify all listeners for a specific event
  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for event '${event}':`, error);
        }
      });
    }
  }

  // Disconnect the socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a specific negotiation room
  joinNegotiationRoom(negotiationId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("join_negotiation_room", { negotiationId });
    }
  }
}

// React hook for using the socket service
export function useSocketService(
  token: string,
  customerEmail?: string,
  deliveryId?: string
) {
  const [socketService] = useState<SocketService>(
    () => new SocketService(token, customerEmail, deliveryId)
  );

  useEffect(() => {
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, [socketService]);

  return socketService;
}
