import { HashRouter, Route, Routes } from "react-router-dom";
import Loading from "./components/Loading";
import Info from "./components/Info";
import HotKey from "./components/HotKey";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Loading />} />
        <Route path="/main" element={<Info />} />
        <Route path="/hotkey" element={<HotKey />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
