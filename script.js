document.fonts.ready.then(() => {
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
    const meshes = []; // Array to hold references to the mesh objects

    // Initialize the canvas, scene, camera, and renderer
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

        // Create thick edges around a 3D object
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

        // Load 3D object and add to the scene
        const objLoader = new THREE.OBJLoader();
        objLoader.load(objPath, (object) => {
            object.traverse((child) => {
                if (child.isMesh) {
                    // Set the cube color to dark
                    const material = new THREE.MeshBasicMaterial({
                        color: colors.dark,
                        side: THREE.DoubleSide
                    });
                    child.material = material;

                    // Store a reference to the mesh for later updates
                    meshes.push(child);

                    // Create and add thick edges with light color
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

    // Create a sprite with text
    function createTextSprite(text, color) {
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

        return document.fonts.load(`400 ${fontSize * scaleFactor}px "${fontFamily}"`).then(() => {
            context.font = `400 ${fontSize * scaleFactor}px "${fontFamily}"`;

            context.fillStyle = `#${colors.light.toString(16).padStart(6, '0')}`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';

            context.fillText(text, canvas.width / 2, canvas.height / 2);

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;

            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);

            sprite.scale.set(textWidth / 12, textHeight / 12, 1);
            return sprite;
        });
    }

    // Update text sprites based on current mode
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

    // Update theme and canvas colors
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

        updateTextSprites(currentMode); // Update text sprite colors when theme changes
    }

    // Initialize canvases and text sprites
    setupCanvas('canvas1', './Objects/Boolean.obj', 0);
    setupCanvas('canvas2', './Objects/Cube.obj', 1);
    setupCanvas('canvas3', './Objects/Plane.obj', 2);

    updateTextSprites(currentMode);

    // Button event listener for mode change
    document.querySelector('.button-right').addEventListener('click', () => {
        const modeOrder = ['hiragana', 'kanji', 'english'];
        const currentIndex = modeOrder.indexOf(currentMode);
        currentMode = modeOrder[(currentIndex + 1) % modeOrder.length];

        const button = document.querySelector('.button-right');
        button.textContent = currentMode === 'hiragana' ? 'あ' : currentMode === 'kanji' ? '漢' : 'A';
        button.classList.toggle('english-text', currentMode === 'english');

        updateTextSprites(currentMode);
    });

    // Button event listener for theme change
    document.querySelector('.button-theme').addEventListener('click', () => {
        const themeOrder = ['default', 'pastel', 'peach', 'forest'];
        const currentIndex = themeOrder.indexOf(currentTheme);
        currentTheme = themeOrder[(currentIndex + 1) % themeOrder.length];

        updateTheme(currentTheme);
    });

    function resetTransformOnTouchEnd(button, delay = 300) {
        button.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.transform = '';
            }, delay);
        });
    }
    
    const buttonRight = document.querySelector('.button-right');
    const buttonLeft = document.querySelector('.button-left');
    
    resetTransformOnTouchEnd(buttonRight);
    resetTransformOnTouchEnd(buttonLeft);    
});
