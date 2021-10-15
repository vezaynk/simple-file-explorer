import * as React from "react";
import { ExplorerProvider, ExplorerContext } from "./contexts/ExplorerContext";
import Folder from './components/Folder';

const Roots = () => {
  const { roots } = React.useContext(ExplorerContext);
  return <>
    {roots.map(root => {
      const path = root.split("/").filter(p => p);
      return <Folder name={path[path.length - 1]} key={root} path={path} />;
    })}
  </>;
};
export const App = () => (
  <ExplorerProvider>
    <Roots />
  </ExplorerProvider>
);