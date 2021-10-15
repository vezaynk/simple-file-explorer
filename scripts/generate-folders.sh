#!/bin/bash

rm -rf tmp/folders/
mkdir -p tmp/folders/{root1/deeply/nested/folder/structure,root2/{folder1,folder2,folder3},root3}

touch tmp/folders/root1/deeply/nested/folder/structure/the_end.docx
touch tmp/folders/root2/diary.txt
touch tmp/folders/root2/{folder1,folder2,folder3}/nested_files.txt

touch tmp/folders/root3/{file1.js,file2.php,another_file.gif,zzzzz.png}