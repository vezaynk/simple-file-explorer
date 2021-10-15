import * as React from "react";
import { ExplorerProvider } from "./contexts/ExplorerContext";
import Folder from './components/Folder';

export const App = () => (
  <ExplorerProvider>
    <Folder name="testdir" path={["home", "slava", "testdir"]} />
    <Folder name="testdir2" path={["home", "slava", "testdir2"]} />
  </ExplorerProvider>
);