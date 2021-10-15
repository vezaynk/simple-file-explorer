import * as React from "react";
import { ExplorerProvider } from "./contexts/ExplorerContext";
import Roots from './components/Roots';

export const App = () => (
  <ExplorerProvider>
    <Roots />
  </ExplorerProvider>
);;