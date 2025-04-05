import { HashRouter, Routes, Route } from "react-router-dom";
import OrderDetail from "./pages/delivery-offers";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<h1>Hello World</h1>} />
        <Route path="/order/:orderId" element={<OrderDetail />} />
      </Routes>
    </HashRouter>
  );
}
export default App;
