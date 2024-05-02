import zipfile
import os
import sys

if __name__ == '__main__':
    if sys.argv.__len__() == 3:
        file_in = sys.argv[1]
        dir_out = sys.argv[2]

    with zipfile.ZipFile(file=file_in) as z:
        # ignore the top dir
        top_dir = z.filelist[0]
        files = z.filelist[1:].__len__()
        if top_dir.is_dir():
            for index, current in enumerate(z.filelist[1:]):
                
                out_path = os.path.join(
                   dir_out,
                   os.path.relpath(current.filename, top_dir.filename),
                )
                try:
                    if current.is_dir():
                        os.makedirs(out_path, exist_ok=True)
                    else:
                        data = z.read(current)

                        with open(out_path, 'wb') as f:
                            f.write(data)

                    print(f"extracting... [{index}/{files}] {out_path}", end='\r')
                except:
                    print(f"\nError: cannot extract {current.filename} => {out_path}")
            print()
