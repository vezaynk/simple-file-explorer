import * as React from "react";
import { useState, useContext, useEffect } from "react";
import { ExplorerContext } from "../contexts/ExplorerContext";
import File from './File';

interface FolderProps {
    name: string;
    path: string[];
}

const Folder = ({ path, name }: FolderProps) => {
    const explorerContext = useContext(ExplorerContext);

    const files = explorerContext.getChildren(path);
    const [showChildren, setShowChildren] = useState(false);
    useEffect(() => {
        return () => { if (showChildren) explorerContext.close(path); };
    }, []);

    let fileListing = <span>Loading...</span>;
    if (files != null) {
        fileListing = <ul>
            {files.sort().map(file => {
                const filepath = [...path, file.name];
                if (file.isFolder) {
                    return <Folder key={filepath.join('/')} path={filepath} name={file.name} />;
                } else {
                    return <File key={filepath.join('/')} name={file.name} />;
                }
            })}
        </ul>;

        if (!files.length) {
            fileListing = <ul><li><em>Empty folder</em></li></ul>;
        }
    }
    return <li>
        <strong onClick={() => {
            setShowChildren(!showChildren);
            if (showChildren) {
                explorerContext.close(path);
            } else {
                explorerContext.open(path);
            }
        }}>{name}</strong>
        {showChildren && fileListing}
    </li>;
};

export default Folder;