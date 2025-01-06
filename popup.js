document.addEventListener('DOMContentLoaded', function() {
    // Récupération des éléments du DOM
    const folderInput = document.getElementById('folderInput');
    const customPatternsInput = document.getElementById('customPatterns');
    const maxDepthInput = document.getElementById('maxDepth');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const resultDiv = document.getElementById('result');

    // Patterns prédéfinis
    const predefinedPatterns = {
        basic: ['*.git', '*.idea'],
        node: ['node_modules', '*.next'],
        python: ['*.venv', '__pycache__'],
        build: ['build/', 'dist/'],
        all: ['*.git', '*.idea', 'node_modules', '*.next', '*.venv', '__pycache__', 'build/', 'dist/'],
        custom: []
    };

    // Gestion du champ personnalisé
    document.querySelectorAll('input[name="pattern"]').forEach(radio => {
        radio.addEventListener('change', function() {
            customPatternsInput.disabled = this.value !== 'custom';
            if (this.value === 'custom') {
                customPatternsInput.focus();
            }
        });
    });

    // Fonction pour vérifier si un fichier/dossier doit être ignoré
    function shouldIgnore(name, patterns) {
        return patterns.some(pattern => {
            const regexPattern = pattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*')
                .replace(/\?/g, '.');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(name);
        });
    }

    // Fonction pour récupérer les patterns sélectionnés
    function getSelectedPatterns() {
        const selectedPattern = document.querySelector('input[name="pattern"]:checked').value;
        if (selectedPattern === 'custom') {
            return customPatternsInput.value.split(',').map(p => p.trim()).filter(p => p);
        }
        return predefinedPatterns[selectedPattern];
    }

    // Fonction pour construire l'arborescence à partir des fichiers
    function buildTreeFromFiles(files, ignorePatterns, maxDepth) {
        const tree = new Map();
        const rootPath = files[0].webkitRelativePath.split('/')[0];

        // Construire la structure de l'arbre
        for (const file of files) {
            const pathParts = file.webkitRelativePath.split('/');
            let currentLevel = tree;
            let currentDepth = 0;

            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];

                // Vérifier la profondeur maximale
                if (currentDepth > maxDepth) break;

                // Vérifier si le fichier/dossier doit être ignoré
                if (shouldIgnore(part, ignorePatterns)) break;

                if (!currentLevel.has(part)) {
                    if (i === pathParts.length - 1) {
                        // C'est un fichier
                        currentLevel.set(part, null);
                    } else {
                        // C'est un dossier
                        currentLevel.set(part, new Map());
                    }
                }

                if (currentLevel.get(part) instanceof Map) {
                    currentLevel = currentLevel.get(part);
                    currentDepth++;
                }
            }
        }

        // Fonction pour générer la représentation textuelle
        function generateTreeText(node, prefix = '', isLast = true) {
            let result = [];
            if (prefix) {
                result.push(prefix + (isLast ? '└── ' : '├── ') + node[0]);
            } else {
                result.push(node[0]);
            }

            if (node[1] instanceof Map) {
                const entries = Array.from(node[1].entries());
                entries.forEach(([key, value], index) => {
                    const newPrefix = prefix + (isLast ? '    ' : '│   ');
                    const childLines = generateTreeText(
                        [key, value],
                        newPrefix,
                        index === entries.length - 1
                    );
                    result = result.concat(childLines);
                });
            }

            return result;
        }

        // Générer le texte de l'arborescence
        const rootEntry = [rootPath, tree.get(rootPath)];
        return generateTreeText(rootEntry).join('\n');
    }

    // Gestionnaire du bouton de génération
    generateBtn.addEventListener('click', () => {
        if (!folderInput.files.length) {
            alert('Veuillez sélectionner un dossier');
            return;
        }

        const ignorePatterns = getSelectedPatterns();
        const maxDepth = parseInt(maxDepthInput.value) || 999;

        try {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Génération en cours...';

            const treeStructure = buildTreeFromFiles(
                Array.from(folderInput.files),
                ignorePatterns,
                maxDepth
            );

            resultDiv.textContent = treeStructure;
            resultDiv.style.display = 'block';
            copyBtn.style.display = 'block';

        } catch (error) {
            console.error('Erreur:', error);
            resultDiv.textContent = 'Une erreur est survenue lors de la génération: ' + error.message;
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Générer l\'arborescence';
        }
    });

    // Gestionnaire du bouton de copie
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(resultDiv.textContent);
            copyBtn.textContent = 'Copié !';
            setTimeout(() => {
                copyBtn.textContent = 'Copier';
            }, 2000);
        } catch (error) {
            console.error('Erreur de copie:', error);
            copyBtn.textContent = 'Erreur de copie';
            setTimeout(() => {
                copyBtn.textContent = 'Copier';
            }, 2000);
        }
    });
});