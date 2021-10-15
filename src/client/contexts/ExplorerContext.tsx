import * as React from "react";
import { useState, createContext, useContext, useRef, useEffect } from "react";
import { FileEvent } from "../../shared/types/FileEvent";
import { TreeNode } from "../types/TreeNode";
import type { FileInfo } from '../types/FileInfo';

const ExplorerContext = createContext({ getChildren: (path: string[]): null | FileInfo[] => null, open: (path: string[]) => { }, close: (path: string[]) => { }, roots: new Array<string>() });
const ExplorerProvider = ({ children }: React.PropsWithChildren<{}>) => {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [tree, setTree] = useState<TreeNode>({});
    const [opened, setOpened] = useState(new Map<string, number>());
    const [roots, setRoots] = useState<string[]>([]);

    useEffect(() => {
        const ws = new WebSocket('ws://' + location.host);
        ws.onopen = () => setWs(ws);
        ws.onclose = () => setWs(null);
        return () => ws.close();
    }, []);

    if (!ws || ws.readyState !== WebSocket.OPEN) return <h2>No Connection</h2>;
    function handleFileEvent(fileEvent: FileEvent) {
        const { eventType, filename, pathname } = fileEvent;
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
            case "root":
                roots.push(pathname);
                setRoots([...roots]);
                break;
            case "folder":
                let name = path.shift();
                pointer[name] = pointer[name] || {};
                break;
            case "unlink":
                close(path);
                delete pointer[path.shift()];
                break;
            // Folder is empty, nothing to do
            case "empty":
                break;
        }

        setTree({ ...tree });
    }
    ws.onmessage = (messageJson) => {
        const message = JSON.parse(messageJson.data) as FileEvent | FileEvent[];
        if (Array.isArray(message)) {
            for (let m of message) {
                handleFileEvent(m);
            }
        } else {
            handleFileEvent(message);
        }
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
        }).sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLowerCase()));
    };
    const close = (path: string[]) => {
        const pathname = "/" + path.join("/");
        if (!opened.has(pathname)) {
            return;
        }
        const watchers = opened.get(pathname);
        opened.set(pathname, watchers - 1);

        if (watchers > 1) return;
        ws.send(JSON.stringify({
            type: "close",
            pathname: pathname
        }));
        opened.delete(pathname);
        setOpened(new Map(opened));
    };
    const open = (path: string[]) => {
        const pathname = "/" + path.join("/");
        const watchers = opened.get(pathname) || 0;
        opened.set(pathname, watchers + 1);
        setOpened(new Map(opened));

        // Subscribe, but only if first watcher
        if (watchers == 0)
            ws.send(JSON.stringify({
                type: "open",
                pathname: pathname
            }));
    };

    return (<ExplorerContext.Provider value={{ getChildren, open, close, roots }}>
        {children}
    </ExplorerContext.Provider>);
};

export { ExplorerContext, ExplorerProvider };