import { HashRouter, Route, Routes } from "react-router-dom";

import Loading from "./components/Loading.jsx";
import Info from "./components/Info.jsx";
import Hotkey from "./components/HotkeyComponent.jsx";

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
