import * as React from "react";
import Folder from './Folder';
import { ExplorerContext } from "../contexts/ExplorerContext";

const Roots = () => {
    const { roots } = React.useContext(ExplorerContext);

    return <ul className="tree">
        {roots.map(root => {
            const path = root.split("/").filter(p => p);
            return <Folder name={path[path.length - 1]} key={root} path={path} />;
        })}
    </ul>;
};

export default Roots;