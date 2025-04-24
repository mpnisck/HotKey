import { HashRouter, Route, Routes } from "react-router-dom";

import Loading from "./renderer/components/Loading.jsx";
import Info from "./renderer/components/Info.jsx";
import HotKey from "./renderer/components/HotKey.jsx";

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
