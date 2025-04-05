import { BrowserRouter, Routes, Route } from "react-router-dom";
import OrderDetail from "./pages/delivery-offers";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Hello World</h1>} />
        <Route path="/order/:orderId" element={<OrderDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
