import { Routes } from "react-router-dom";
import "./App.css";
import OrderDetail from "./pages/delivery-offers";
import { Route } from "react-router-dom";

function App() {
  return (
    <>
      <Routes>
        <Route path="/order/:orderId" element={<OrderDetail />} />
      </Routes>
    </>
  );
}

export default App;
