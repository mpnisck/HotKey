import { HashRouter, Route, Routes } from "react-router-dom";
import Loading from "../pages/loading/Loading";
import Info from "../pages/info/Info";
import Hotkey from "../pages/hotkey/Hotkey";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Loading />} />
        <Route path="/main" element={<Info />} />
        <Route path="/hotkey" element={<Hotkey />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
