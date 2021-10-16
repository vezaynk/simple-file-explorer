import * as React from "react";
import { ExplorerProvider } from "./contexts/ExplorerContext";
import Roots from './components/Roots';
import "./styles.css";

export const App = () => (
  <ExplorerProvider>
    <Roots />
  </ExplorerProvider>
);;