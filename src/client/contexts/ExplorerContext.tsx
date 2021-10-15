import * as React from "react";
import { useState, createContext, useContext, useRef, useEffect } from "react";
import { FileEvent } from "../../shared/types/FileEvent";
import { TreeNode } from "../types/TreeNode";
import type { FileInfo } from '../types/FileInfo';

const ExplorerContext = createContext({ getChildren: (path: string[]): null | FileInfo[] => null, open: (path: string[]) => { }, close: (path: string[]) => { } });
const ExplorerProvider = ({ children }: React.PropsWithChildren<{}>) => {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [tree, setTree] = useState<TreeNode>({});
    const [opened, setOpened] = useState(new Set());
    useEffect(() => {
        const ws = new WebSocket('ws://' + location.host);
        ws.onopen = () => setWs(ws);
        ws.onclose = () => setWs(null);
        return () => ws.close();
    }, []);

    if (!ws || ws.readyState !== WebSocket.OPEN) return <h2>Establishing connection...</h2>;
    ws.onmessage = (message) => {
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

        switch (eventType) {
            case "file":
                pointer[path.shift()] = "FILE";
                break;
            case "folder":
                pointer[path.shift()] = {};
                break;
            case "unlink":
                delete pointer[path.shift()];
                break;
            // Folder is empty, nothing to do
            case "empty":
                break;
        }

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
        return Object.entries(pointer).map(([name, value]): FileInfo => {
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

export { ExplorerContext, ExplorerProvider };