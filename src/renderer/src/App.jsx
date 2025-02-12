import { BrowserRouter, Route, Routes } from "react-router-dom";
import Loading from "./components/Loading";
import Info from "./components/Info";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Loading />} />
        <Route path="/main" element={<Info />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
