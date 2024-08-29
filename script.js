document.fonts.ready.then(() => {
    // Define theme colors
    const themes = {
        default: {
            light: 0xD9D9D9,
            dark: 0x000000,
            button: '#F6D0E3'
        },
        pastel: {
            light: 0x464B9A,
            dark: 0xF6D0E3,
            button: '#DA624F'
        },
        peach: {
            light: 0xEFEFEF,
            dark: 0xDA624F,
            button: '#2A5744'
        },
        forest: {
            light: 0xFBECAF,
            dark: 0x2A5744,
            button: '#D9D9D9'
        }
    };

    let currentTheme = 'default';
    let colors = themes[currentTheme];

    // Define modes with corresponding text, positions, and rotations
    const modes = {
        hiragana: [
            [["なか", "そと"], [[0, 0, 0], [0, 0.55, 0]], [[0, 0], [0, 0]]],
            [["まえ", "うしろ", "みぎ", "ひだり", "うえ", "した"], [[0, 0, 0.58], [0, 0, -0.63], [0.58, 0, 0], [-0.63, 0, 0], [0, 0.55, 0], [0, -0.55, 0]], [[0, 0], [Math.PI, 0], [Math.PI / 2, 0], [-Math.PI / 2, 0], [0, Math.PI / 2], [0, -Math.PI / 2]]],
            [["あいだ", "まわり"], [[0, 0, 0], [0.63, 0, 0]], [[0, 0], [0, 0]]],
        ],
        kanji: [
            [["中", "外"], [[0, 0, 0], [0, 0.55, 0]], [[0, 0], [0, 0]]],
            [["前", "後ろ", "右", "左", "上", "下"], [[0, 0, 0.55], [0, 0, -0.58], [0.55, 0, 0], [-0.55, 0, 0], [0, 0.55, 0], [0, -0.55, 0]], [[0, 0], [Math.PI, 0], [Math.PI / 2, 0], [-Math.PI / 2, 0], [0, Math.PI / 2], [0, -Math.PI / 2]]],
            [["間", "周り"], [[0, 0, 0], [0.6, 0, 0]], [[0, 0], [0, 0]]],
        ],
        english: [
            [["Inside", "Outside"], [[0, 0, 0], [0, 0.55, 0]], [[0, 0], [0, 0]]],
            [["Front", "Back", "Right", "Left", "Top", "Bottom"], [[0, 0, 0.62], [0, 0, -0.61], [0.61, 0, 0], [-0.59, 0, 0], [0, 0.55, 0], [0, -0.55, 0]], [[0, 0], [Math.PI, 0], [Math.PI / 2, 0], [-Math.PI / 2, 0], [0, Math.PI / 2], [0, -Math.PI / 2]]],
            [["Between", "Around"], [[0, 0, 0], [0.66, 0, 0]], [[0, 0], [0, 0]]],
        ]
    };

    let currentMode = 'hiragana';
    const textSprites = [[], [], []];
    const edgeGroups = [[], [], []];
    const scenes = [];
    const cameras = [];
    const renderers = [];
    const meshes = [];

    // Function to set up a canvas with Three.js
    function setupCanvas(canvasId, objPath, index) {
        const canvas = document.getElementById(canvasId);
        const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 3);

        scene.background = new THREE.Color(colors.dark);
        camera.position.set(1, 0.7, 1);
        camera.lookAt(0, 0, 0);

        function setSize() {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            const pixelRatio = window.devicePixelRatio;

            renderer.setSize(width * pixelRatio, height * pixelRatio, false);
            renderer.setPixelRatio(pixelRatio);

            const aspectRatio = width / height;
            camera.left = -aspectRatio;
            camera.right = aspectRatio;
            camera.top = 1;
            camera.bottom = -1;
            camera.updateProjectionMatrix();
        }

        setSize();

        // Function to create thick edges for 3D objects
        function createThickEdges(object) {
            const edgesGeometry = new THREE.EdgesGeometry(object.geometry);
            const thickEdgesGroup = new THREE.Group();
            const edgeThickness = 0.003;

            edgesGeometry.attributes.position.array.forEach((_, i, array) => {
                if (i % 6 === 0) {
                    const start = new THREE.Vector3().fromArray(array, i);
                    const end = new THREE.Vector3().fromArray(array, i + 3);

                    const edgeVector = new THREE.Vector3().subVectors(end, start);
                    const edgeLength = edgeVector.length();

                    const cylinderGeometry = new THREE.CylinderGeometry(edgeThickness, edgeThickness, edgeLength, 8);
                    const cylinderMaterial = new THREE.MeshBasicMaterial({ color: colors.light });
                    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

                    cylinder.position.copy(start).add(end).divideScalar(2);
                    cylinder.lookAt(end);
                    cylinder.rotateX(Math.PI / 2);

                    thickEdgesGroup.add(cylinder);
                }
            });

            return thickEdgesGroup;
        }

        const objLoader = new THREE.OBJLoader();
        objLoader.load(objPath, (object) => {
            object.traverse((child) => {
                if (child.isMesh) {
                    const material = new THREE.MeshBasicMaterial({
                        color: colors.dark,
                        side: THREE.DoubleSide
                    });
                    child.material = material;

                    meshes.push(child);

                    const edges = createThickEdges(child);
                    scene.add(edges);
                    edgeGroups[index].push(edges);
                }
            });

            scene.add(object);
        });

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.rotateSpeed = 1.0;

        const targetPosition = new THREE.Vector3();
        const easing = 0.03;

        // Update camera position based on mouse movement
        function updateCameraPosition(event) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = (event.clientX - rect.left) / rect.width * 2 - 1;
            const mouseY = -(event.clientY - rect.top) / rect.height * 2 + 1;

            const distance = 1;
            const angleX = -mouseX * Math.PI;
            const angleY = -mouseY * Math.PI;

            targetPosition.set(
                distance * Math.cos(angleY) * Math.sin(angleX),
                distance * Math.sin(angleY),
                distance * Math.cos(angleY) * Math.cos(angleX)
            );
        }

        canvas.addEventListener('mousemove', updateCameraPosition);

        function animate() {
            requestAnimationFrame(animate);
            camera.position.lerp(targetPosition, easing);
            camera.lookAt(0, 0, 0);
            controls.update();
            renderer.render(scene, camera);
        }

        animate();

        window.addEventListener("resize", setSize);

        scenes[index] = scene;
        cameras[index] = camera;
        renderers[index] = renderer;
    }

    // Function to create a text sprite
    function createTextSprite(text, color) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const fontSize = 1;
            const scaleFactor = 64;

            const fontFamily = currentMode === 'english' ? 'Inter' : 'Noto Sans JP';
            context.font = `${fontSize}px "${fontFamily}"`;

            const textWidth = context.measureText(text).width;
            const textHeight = fontSize;

            canvas.width = textWidth * scaleFactor;
            canvas.height = textHeight * scaleFactor;

            context.font = `400 ${fontSize * scaleFactor}px "${fontFamily}"`;
            context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            context.fillText(text, canvas.width / 2, canvas.height / 2);

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;

            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);

            sprite.scale.set(textWidth / 12, textHeight / 12, 1);
            resolve(sprite);
        });
    }

    // Function to update text sprites based on the current mode
    function updateTextSprites(mode) {
        textSprites.forEach((sprites, index) => {
            sprites.forEach(sprite => {
                scenes[index].remove(sprite);
            });
            textSprites[index] = [];
        });

        const data = modes[mode];

        data.forEach((item, index) => {
            item[0].forEach((text, textIndex) => {
                createTextSprite(text, colors.light).then(sprite => {
                    sprite.position.set(...item[1][textIndex]);
                    sprite.rotation.set(item[2][textIndex][0], item[2][textIndex][1], 0);
                    scenes[index].add(sprite);
                    textSprites[index].push(sprite);
                });
            });
        });
    }

    // Function to update the theme
    function updateTheme(theme) {
        colors = themes[theme];
        document.documentElement.setAttribute('data-theme', theme);

        scenes.forEach((scene) => {
            scene.background.setHex(colors.dark);
            scene.children.forEach((child) => {
                if (child.isGroup) {
                    child.children.forEach((edge) => {
                        edge.material.color.setHex(colors.light);
                    });
                } else if (child.isMesh) {
                    child.material.color.setHex(colors.dark);
                }
            });
        });

        meshes.forEach((mesh) => {
            mesh.material.color.setHex(colors.dark);
        });

        updateTextSprites(currentMode);
    }

    // Initialize canvases and update text sprites
    setupCanvas('canvas1', './Objects/Boolean.obj', 0);
    setupCanvas('canvas2', './Objects/Cube.obj', 1);
    setupCanvas('canvas3', './Objects/Plane.obj', 2);

    updateTextSprites(currentMode);

    const modeOrder = ['hiragana', 'kanji', 'english'];
    const buttonRight = document.querySelector('.button-right');
    const welcomeText = document.getElementById('welcome-text');

    function updateWelcomeText(mode) {
        switch (mode) {
            case 'hiragana':
                welcomeText.textContent = 'ようこそ';
                break;
            case 'kanji':
                welcomeText.textContent = '迎';
                break;
            case 'english':
                welcomeText.textContent = 'Welcome';
                break;
        }
        welcomeText.className = mode;
    }

    // Handle button clicks for changing modes
    buttonRight.addEventListener('click', () => {
        const currentIndex = modeOrder.indexOf(currentMode);
        currentMode = modeOrder[(currentIndex + 1) % modeOrder.length];

        buttonRight.textContent = currentMode === 'hiragana' ? 'あ' : currentMode === 'kanji' ? '漢' : 'A';
        buttonRight.classList.toggle('english-text', currentMode === 'english');

        updateTextSprites(currentMode);
        updateWelcomeText(currentMode);
    });

    // Handle button clicks for changing themes
    document.querySelector('.button-theme').addEventListener('click', () => {
        const themeOrder = ['default', 'pastel', 'peach', 'forest'];
        const currentIndex = themeOrder.indexOf(currentTheme);
        currentTheme = themeOrder[(currentIndex + 1) % themeOrder.length];

        updateTheme(currentTheme);
    });

    // Reset transform on touch end for mobile devices
    function resetTransformOnTouchEnd(button, delay = 300) {
        button.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.transform = '';
            }, delay);
        });
    }

    const buttonLeft = document.querySelector('.button-left');

    resetTransformOnTouchEnd(buttonRight);
    resetTransformOnTouchEnd(buttonLeft);

    const menuContainer = document.querySelector('.menu-container');

    // Toggle menu container visibility on button click
    buttonLeft.addEventListener('click', () => {
        menuContainer.style.display = menuContainer.style.display === 'flex' ? 'none' : 'flex';
    });

    const sections = document.querySelectorAll('.page-section');
    const links = document.querySelectorAll('.menu a');

    // Show a section based on its ID
    function showSection(sectionId) {
        sections.forEach(section => {
            section.style.display = section.id === sectionId ? 'block' : 'none';
        });
    }

    // Handle menu links for section navigation
    links.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetSection = event.target.id.replace('-link', '-section');
            const section = document.getElementById(targetSection);
    
            // Temporarily hide the section to reset the fade-in animation
            section.style.display = 'none';
            
            // Use a short timeout to allow the browser to register the display change
            setTimeout(() => {
                showSection(targetSection);
    
                if (targetSection === 'geometry-section') {
                    setupCanvas('canvas1', './Objects/Boolean.obj', 0);
                    setupCanvas('canvas2', './Objects/Cube.obj', 1);
                    setupCanvas('canvas3', './Objects/Plane.obj', 2);
                    updateTextSprites(currentMode);
                }
    
                menuContainer.style.display = 'none';
            }, 50); // Adjust this delay if necessary
        });
    });

    // Show the welcome section by default
    showSection('welcome-section');
    menuContainer.style.display = 'none';
    updateWelcomeText(currentMode); // Set initial text in the welcome section
});
