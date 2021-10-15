import * as React from "react";
import { useState, createContext, useContext, useRef, useEffect } from "react";
import { FileEvent } from "../types/FileEvent";

interface TreeNode {
  [nodeName: string]: TreeNode | "FILE";
};

const ExplorerContext = createContext({ getChildren: (path: string[]): null | File[] => null, open: (path: string[]) => { }, close: (path: string[]) => { } });
const ExplorerProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [tree, setTree] = useState<TreeNode>({});
  const [opened, setOpened] = useState(new Set());
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:9999');
    ws.onopen = () => setWs(ws);
    ws.onclose = () => setWs(null);
    return () => ws.close();
  }, []);

  if (!ws || ws.readyState !== WebSocket.OPEN) return <h2>Establishing connection...</h2>;
  ws.onmessage = (message) => {
    console.log(JSON.parse(message.data));
    const { eventType, filename, pathname } = JSON.parse(message.data) as FileEvent;
    const path = [...pathname.split("/").filter(p => p), filename];
    let pointer = tree;
    while (path.length > 1) {
      let nextChild = path.shift();
      let next = pointer[nextChild];
      if (!next) {
        pointer[nextChild] = {};
        next = pointer[nextChild];
      }
      if (next == "FILE") throw new Error("File nested in file. Impossible.");
      pointer = next;
    }

    if (eventType == "file") pointer[path.shift()] = "FILE";
    if (eventType == "folder") pointer[path.shift()] = null;
    if (eventType == "unlink") delete pointer[path.shift()];

    setTree({ ...tree });
  };




  const getChildren = (path: Readonly<string[]>) => {
    const pathname = "/" + path.join("/");
    if (!opened.has(pathname)) {
      return null;
    }
    let pointer: TreeNode = tree;
    let directions = [...path];
    while (directions.length) {
      const next = pointer[directions.shift()];
      if (next == "FILE" || next == null) return null;
      pointer = next;
    }
    return Object.entries(pointer).map(([name, value]): File => {
      return {
        name,
        isFolder: value !== "FILE"
      };
    });
  };
  const close = (path: string[]) => {
    const pathname = "/" + path.join("/");
    if (!opened.has(pathname)) {
      return;
    }
    ws.send(JSON.stringify({
      type: "close",
      pathname: pathname
    }));
    opened.delete(pathname);
    setOpened(new Set(opened));
  };
  const open = (path: string[]) => {
    const pathname = "/" + path.join("/");
    if (opened.has(pathname)) return;
    opened.add(pathname);
    setOpened(new Set(opened));
    ws.send(JSON.stringify({
      type: "open",
      pathname: pathname
    }));
  };

  return (<ExplorerContext.Provider value={{ getChildren, open, close }}>
    {children}
  </ExplorerContext.Provider>);
};
interface File {
  name: string;
  isFolder?: boolean;
}

interface FileProps {
  name: string;
}

interface FolderProps {
  name: string;
  path: string[];
}

const File = (props: FileProps) => {
  return <li>{props.name}</li>;
};
const Folder = (props: FolderProps) => {
  const explorerContext = useContext(ExplorerContext);

  const files = explorerContext.getChildren(props.path);
  console.log("Files:", files);
  const [showChildren, setShowChildren] = useState(false);
  useEffect(() => {
    return () => explorerContext.close(props.path);
  }, []);
  useEffect(() => {
    if (showChildren) {
      explorerContext.open(props.path);
    } else {
      explorerContext.close(props.path);
    }
  }, [showChildren]);
  let fileListing = showChildren && <span>Loading...</span>;
  if (files != null) {
    fileListing = <ul>
      {files.map(file => {
        const path = [...props.path, file.name];
        if (file.isFolder) {
          return <Folder key={path.join('/')} path={path} name={file.name} />;
        } else {
          return <File key={path.join('/')} name={file.name} />;
        }
      })}
    </ul>;
  }
  return <li>
    <strong onClick={() => setShowChildren(!showChildren)}>{props.name}</strong>
    {showChildren && fileListing}
  </li>;
};

export const App = () => (
  <ExplorerProvider>
    <Folder name="myFolder" path={["home", "slava", "testdir"]} />
  </ExplorerProvider>
);