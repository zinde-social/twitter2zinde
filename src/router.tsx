import React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import Settings from "./pages/Settings";
import Migrate from "./pages/Migrate";
import Finish from "./pages/Finish";
import Intro from "@/pages/Intro";

const Router = () => (
  <HashRouter>
    <Routes>
      <Route path={"/"} element={<Intro />} />
      <Route path={"settings"} element={<Settings />} />
      <Route path={"migrate"} element={<Migrate />} />
      <Route path={"finish"} element={<Finish />} />
    </Routes>
  </HashRouter>
);

export default Router;
