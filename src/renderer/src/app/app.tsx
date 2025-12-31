import React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import Loading from "@/pages/loading/loading";
import Info from "@/pages/info/info";
import Hotkey from "@/pages/hot-key/hot-key";

function App(): React.JSX.Element {
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
