import os
import fnmatch


def should_ignore(name, ignore_patterns):
    return any(fnmatch.fnmatch(name, pattern) for pattern in ignore_patterns)


def get_directory_structure(path, ignore_patterns):
    structure = {}
    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if not should_ignore(d, ignore_patterns)]
        current = structure
        path_parts = os.path.relpath(root, path).split(os.sep)
        for part in path_parts:
            if part == '.':
                continue
            if part not in current:
                current[part] = {}
            current = current[part]
        current['files'] = [f for f in files if not should_ignore(f, ignore_patterns)]
    return structure

def generate_tree_structure(startpath, ignore_patterns):
    tree = []
    for root, dirs, files in os.walk(startpath):
        dirs[:] = [d for d in dirs if not should_ignore(d, ignore_patterns)]
        files = [f for f in files if not should_ignore(f, ignore_patterns)]

        level = root.replace(startpath, '').count(os.sep)
        indent = '|   ' * (level - 1) + '|_ ' if level > 0 else ''
        tree.append(f"{indent}{os.path.basename(root)}/")

        subindent = '|   ' * level + '|_ '
        for f in files:
            tree.append(f"{subindent}{f}")
    return '\n'.join(tree)


def export_tree_structure(path, output_file, ignore_patterns):
    tree = generate_tree_structure(path, ignore_patterns)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(tree)
    print(tree)



if __name__ == '__main__':
    path_to_scan = './'
    tree_output_file = 'directory_tree.txt'
    ignore_patterns = [
        '*.idea',
        '*.git',
        '*.githhub',
        '*.next',
        '*node_modules',
        'node_modules',
        '*.venv',
        '*build',
        'build'
    ]

    export_tree_structure(path_to_scan, tree_output_file, ignore_patterns)
    print(f"sauvegarde terminée")