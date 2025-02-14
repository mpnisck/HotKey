import { BrowserRouter, Route, Routes } from "react-router-dom";
import Loading from "./components/Loading";
import Info from "./components/Info";
import HotKey from "./components/HotKey";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Loading />} />
        <Route path="/main" element={<Info />} />
        <Route path="/hotkey" element={<HotKey />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
