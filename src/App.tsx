import { HashRouter, Routes, Route } from "react-router-dom";
import OrderDetail from "./pages/delivery-offers";
import ResetPasswordPage from "./pages/reset-password";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<h1>Hello World</h1>} />
        <Route path="/order/:orderId/:token" element={<OrderDetail />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </HashRouter>
  );
}
export default App;
