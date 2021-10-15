import * as React from "react";

interface FileProps {
    name: string;
}

const File = ({ name }: FileProps) => {
    return <li>{name}</li>;
};

export default File;