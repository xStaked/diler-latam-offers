import { Routes } from "react-router-dom";
import "./App.css";
import OrderDetail from "./pages/delivery-offers";
import { Route } from "react-router-dom";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<h1>Hellow world</h1>} />
        <Route path="/order/:orderId" element={<OrderDetail />} />
      </Routes>
    </>
  );
}

export default App;
