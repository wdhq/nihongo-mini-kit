document.addEventListener('DOMContentLoaded', () => {
    document.fonts.ready.then(() => {

        // ------------------
        // Constants and Data
        // ------------------

        // Theme Definitions
        const themes = {
            default: { light: 0xD9D9D9, dark: 0x000000, button: '#F6D0E3' },
            pastel: { light: 0x464B9A, dark: 0xF6D0E3, button: '#DA624F' },
            peach: { light: 0xEFEFEF, dark: 0xDA624F, button: '#2A5744' },
            forest: { light: 0xFBECAF, dark: 0x2A5744, button: '#D9D9D9' }
        };

        // Mode Definitions
        const modes = {
            hiragana: [
                [["なか", "そと"], [[0, 0, 0], [0, 0.57, 0]], [[0, 0], [0, 0]]],
                [["まえ", "うしろ", "みぎ", "ひだり", "うえ", "した"],
                 [[0, 0, 0.61], [0, 0, -0.67], [0.62, 0, 0], [-0.67, 0, 0], [0, 0.57, 0], [0, -0.56, 0]],
                 [[0, 0], [Math.PI, 0], [Math.PI / 2, 0], [-Math.PI / 2, 0], [0, Math.PI / 2], [0, -Math.PI / 2]]],
                [["あいだ", "まわり"], [[0, 0, 0], [0.67, 0, 0]], [[0, 0], [0, 0]]],
            ],
            kanji: [
                [["中", "外"], [[0, 0, 0], [0, 0.58, 0]], [[0, 0], [0, 0]]],
                [["前", "後ろ", "右", "左", "上", "下"],
                 [[0, 0, 0.58], [0, 0, -0.62], [0.58, 0, 0], [-0.58, 0, 0], [0, 0.58, 0], [0, -0.57, 0]],
                 [[0, 0], [Math.PI, 0], [Math.PI / 2, 0], [-Math.PI / 2, 0], [0, Math.PI / 2], [0, -Math.PI / 2]]],
                [["間", "周り"], [[0, 0, 0], [0.63, 0, 0]], [[0, 0], [0, 0]]],
            ],
            english: [
                [["Inside", "Outside"], [[0, 0, 0], [0, 0.57, 0]], [[0, 0], [0, 0]]],
                [["Front", "Back", "Right", "Left", "Top", "Bottom"],
                 [[0, 0, 0.65], [0, 0, -0.64], [0.64, 0, 0], [-0.61, 0, 0], [0, 0.58, 0], [0, -0.57, 0]],
                 [[0, 0], [Math.PI, 0], [Math.PI / 2, 0], [-Math.PI / 2, 0], [0, Math.PI / 2], [0, -Math.PI / 2]]],
                [["Between", "Around"], [[0, 0, 0], [0.7, 0, 0]], [[0, 0], [0, 0]]],
            ]
        };

        // Theme and Mode Orders
        const themeOrder = ['default', 'pastel', 'peach', 'forest'];
        const modeOrder = ['hiragana', 'kanji', 'english'];

        // Initial State Variables
        let currentTheme = 'default';
        let colors = themes[currentTheme];
        let currentMode = 'hiragana';

        // DOM Elements
        const circles = [
            document.querySelector('.circle:nth-child(1)'),
            document.querySelector('.circle:nth-child(2)'),
            document.querySelector('.circle:nth-child(3)')
        ];
        const [firstCircle, secondCircle, thirdCircle] = circles;

        const circleTexts = [
            firstCircle.querySelector('.circle-text'),
            secondCircle.querySelector('.circle-text'),
            thirdCircle.querySelector('.circle-text')
        ];
        const circleValues = [
            firstCircle.querySelector('.circle-value'),
            secondCircle.querySelector('.circle-value'),
            thirdCircle.querySelector('.circle-value')
        ];

        const buttonRight = document.querySelector('.button-right');
        const buttonLeft = document.querySelector('.button-left');
        const themeButton = document.querySelector('.button-theme');
        const menuContainer = document.querySelector('.menu-container');
        const sections = document.querySelectorAll('.page-section');
        const links = document.querySelectorAll('.menu a');
        const welcomeText = document.getElementById('welcome-text');
        const welcomeLink = document.getElementById('welcome-link');
        const geometryLink = document.getElementById('geometry-link');
        const physicsLink = document.getElementById('physics-link');

        // Three.js Variables
        const textSprites = [[], [], []];
        const edgeGroups = [[], [], []];
        const scenes = [null, null, null];
        const cameras = [];
        const renderers = [];
        const meshes = [];

        // Circle Data Templates
        const circleDataTemplates = {
            hiragana: {
                first: { text: 'おもい', value: '50キロ', hoverText: 'かるい', hoverValue: '1キロ' },
                second: { text: 'おそい', value: '2キロメートル', hoverText: 'はやい', hoverValue: '60キロメートル' },
                third: { text: 'おっきい', value: '200センチ', hoverText: 'ちいさい', hoverValue: '10センチ' }
            },
            kanji: {
                first: { text: '重い', value: '50キロ', hoverText: '軽い', hoverValue: '1キロ' },
                second: { text: '遅い', value: '2キロメートル', hoverText: '速い', hoverValue: '60キロメートル' },
                third: { text: '大きい', value: '200センチ', hoverText: '小さい', hoverValue: '10センチ' }
            },
            english: {
                first: { text: 'Heavy', value: '50 Kilograms', hoverText: 'Light', hoverValue: '1 Kilograms' },
                second: { text: 'Slow', value: '2 Km/h', hoverText: 'Fast', hoverValue: '60 Km/h' },
                third: { text: 'Big', value: '200 Centimeters', hoverText: 'Small', hoverValue: '10 Centimeters' }
            }
        };

        // Welcome Texts
        const welcomeTexts = {
            hiragana: { text: 'こんにちは', font: 'Noto Sans JP' },
            kanji: { text: '今日は', font: 'Noto Sans JP' },
            english: { text: 'Hello', font: 'Inter' }
        };

        // Menu Items
        const menuItems = {
            hiragana: { welcome: 'こんにちは 👋', geometry: 'きかがく 📐', physics: 'ぶつりがく 🧪' },
            kanji: { welcome: '今日は 👋', geometry: '幾何学 📐', physics: '物理学 🧪' },
            english: { welcome: 'Hello 👋', geometry: 'Geometry 📐', physics: 'Physics 🧪' }
        };

        // ---------
        // Functions
        // ---------

        // Setup Three.js Canvas
        function setupCanvas(canvasId, objPath, index) {
            const canvas = document.getElementById(canvasId);
            const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
            const scene = new THREE.Scene();

            const frustumSize = 1.8; // Adjust this value to zoom in or out
            const aspectRatio = canvas.clientWidth / canvas.clientHeight;

            const camera = new THREE.OrthographicCamera(
                (frustumSize * aspectRatio) / -2,
                (frustumSize * aspectRatio) / 2,
                frustumSize / 2,
                frustumSize / -2,
                -1,
                3
            );

            scenes[index] = scene;
            scene.background = new THREE.Color(colors.dark);
            camera.position.set(1, 0.7, 1);
            camera.lookAt(0, 0, 0);

            // Adjust renderer and camera on resize
            function setSize() {
                const width = canvas.clientWidth;
                const height = canvas.clientHeight;
                const pixelRatio = window.devicePixelRatio;

                renderer.setSize(width * pixelRatio, height * pixelRatio, false);
                renderer.setPixelRatio(pixelRatio);

                const aspectRatio = width / height;

                camera.left = (-frustumSize * aspectRatio) / 2;
                camera.right = (frustumSize * aspectRatio) / 2;
                camera.top = frustumSize / 2;
                camera.bottom = -frustumSize / 2;

                camera.updateProjectionMatrix();
            }

            // Call setSize initially
            setSize();

            // Add event listener for window resize
            window.addEventListener('resize', setSize, false);

            // Initialize Three.js variables for edge thickness adjustment
            let edgeThickness = window.innerWidth <= 768 ? 0.006 : 0.003;

            // Create thick edges based on edgeThickness
            function createThickEdges(object) {
                const edgesGeometry = new THREE.EdgesGeometry(object.geometry);
                const thickEdgesGroup = new THREE.Group();

                for (let i = 0; i < edgesGeometry.attributes.position.count; i += 2) {
                    const start = new THREE.Vector3().fromBufferAttribute(edgesGeometry.attributes.position, i);
                    const end = new THREE.Vector3().fromBufferAttribute(edgesGeometry.attributes.position, i + 1);
                    const edgeLength = new THREE.Vector3().subVectors(end, start).length();

                    const cylinder = new THREE.Mesh(
                        new THREE.CylinderGeometry(edgeThickness, edgeThickness, edgeLength, 8),
                        new THREE.MeshBasicMaterial({ color: colors.light })
                    );
                    cylinder.position.copy(start).add(end).multiplyScalar(0.5);
                    cylinder.lookAt(end);
                    cylinder.rotateX(Math.PI / 2);
                    thickEdgesGroup.add(cylinder);
                }
                return thickEdgesGroup;
            }

            // Function to update edge thickness only if screen size changes
            function updateEdgeThickness() {
                const newThickness = window.innerWidth <= 768 ? 0.006 : 0.003;
                if (newThickness === edgeThickness) return; // No need to update if thickness is the same

                edgeThickness = newThickness;

                // Update the edges for each mesh
                edgeGroups.forEach((group, index) => {
                    scenes[index].remove(group);  // Remove existing edges
                    const newEdges = createThickEdges(meshes[index]);
                    scenes[index].add(newEdges);  // Add new edges with updated thickness
                    edgeGroups[index] = newEdges;
                });
            }

            // Listen to window resize to adjust edge thickness dynamically
            window.addEventListener('resize', updateEdgeThickness);

            // Call the update function on load to set initial edge thickness
            updateEdgeThickness();

            // Load 3D Object
            const objLoader = new THREE.OBJLoader();
            objLoader.load(objPath, (object) => {
                object.traverse(child => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshBasicMaterial({
                            color: colors.dark,
                            side: THREE.DoubleSide
                        });
                        meshes.push(child);

                        const edges = createThickEdges(child);
                        scene.add(edges);
                        edgeGroups[index] = edges; // Store edges for future updates
                    }
                });
                scene.add(object);
            });

            // Orbit Controls
            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableZoom = false;
            controls.enablePan = false;
            controls.rotateSpeed = 1.0;

            // Camera Movement Based on Mouse
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

            // Animation Loop
            function animate() {
                requestAnimationFrame(animate);
                camera.position.lerp(targetPosition, easing);
                camera.lookAt(0, 0, 0);
                controls.update();
                renderer.render(scene, camera);
            }

            animate();

            cameras[index] = camera;
            renderers[index] = renderer;
        }

        // Create Text Sprite
        async function createTextSprite(text, color) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const fontSize = 1.4;
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

            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
            sprite.scale.set(textWidth / 12, textHeight / 12, 1);
            return sprite;
        }

        // Update Text Sprites Based on Mode
        function updateTextSprites(mode) {
            // Remove existing sprites
            textSprites.forEach((sprites, index) => {
                sprites.forEach(sprite => scenes[index]?.remove(sprite));
                textSprites[index] = [];
            });

            modes[mode].forEach((group, index) => {
                const [texts, positions, rotations] = group;
                texts.forEach((text, textIndex) => {
                    createTextSprite(text, colors.light).then(sprite => {
                        sprite.position.set(...positions[textIndex]);
                        sprite.rotation.set(rotations[textIndex][0], rotations[textIndex][1], 0);
                        scenes[index]?.add(sprite);
                        textSprites[index].push(sprite);
                    });
                });
            });
        }

        // Update Theme Colors and Materials
        function updateTheme(theme) {
            colors = themes[theme];
            document.documentElement.setAttribute('data-theme', theme);

            scenes.forEach(scene => {
                if (scene) {
                    scene.background.setHex(colors.dark);
                    scene.children.forEach(child => {
                        if (child.isGroup) {
                            child.children.forEach(edge => edge.material.color.setHex(colors.light));
                        } else if (child.isMesh) {
                            child.material.color.setHex(colors.dark);
                        }
                    });
                }
            });

            meshes.forEach(mesh => mesh.material.color.setHex(colors.dark));
            updateTextSprites(currentMode);
        }

        // Update Circle Texts and Values
        function updateCircleTexts() {
            const data = circleDataTemplates[currentMode];

            // Update texts and values
            circleTexts[0].textContent = data.first.text;
            circleValues[0].textContent = data.first.value;

            circleTexts[1].textContent = data.second.text;
            circleValues[1].textContent = data.second.value;

            const thirdData = data.third;
            circleTexts[2].textContent = thirdData.text;
            circleValues[2].textContent = thirdData.value;

            // Handle hover and touch events for circles
            circles.forEach((circle, index) => {
                let key;
                if (index === 0) key = 'first';
                else if (index === 1) key = 'second';
                else key = 'third';

                // Handle mouse hover
                circle.onmouseenter = () => {
                    circleTexts[index].textContent = data[key].hoverText;
                    animateValueChange(
                        circleValues[index],
                        parseFloat(data[key].value),
                        parseFloat(data[key].hoverValue),
                        data[key].hoverValue.replace(/\d/g, ''),
                        200
                    );
                };
                circle.onmouseleave = () => {
                    circleTexts[index].textContent = data[key].text;
                    animateValueChange(
                        circleValues[index],
                        parseFloat(data[key].hoverValue),
                        parseFloat(data[key].value),
                        data[key].value.replace(/\d/g, ''),
                        200
                    );
                };

                // Handle touch events
                circle.addEventListener('touchstart', () => {
                    circleTexts[index].textContent = data[key].hoverText;
                    animateValueChange(
                        circleValues[index],
                        parseFloat(data[key].value),
                        parseFloat(data[key].hoverValue),
                        data[key].hoverValue.replace(/\d/g, ''),
                        200
                    );
                });

                circle.addEventListener('touchend', () => {
                    circleTexts[index].textContent = data[key].text;
                    animateValueChange(
                        circleValues[index],
                        parseFloat(data[key].hoverValue),
                        parseFloat(data[key].value),
                        data[key].value.replace(/\d/g, ''),
                        200
                    );
                });
            });
        }

        // Update Welcome Text Based on Mode
        function updateWelcomeText(mode) {
            const textData = welcomeTexts[mode];
            welcomeText.textContent = textData.text;
            welcomeText.style.fontFamily = textData.font;
        }

        // Update Menu Text Based on Mode
        function updateMenuText(mode) {
            const items = menuItems[mode];
            welcomeLink.textContent = items.welcome;
            geometryLink.textContent = items.geometry;
            physicsLink.textContent = items.physics;
        }

        // Animate Value Change for Circle Values
        function animateValueChange(element, start, end, unit, duration) {
            const frameRate = 20;
            const totalFrames = duration / frameRate;
            const increment = (end - start) / totalFrames;
            let current = start;
            let frame = 0;

            const interval = setInterval(() => {
                current += increment;
                frame++;
                element.textContent = `${Math.round(current)}${unit}`;

                if (frame >= totalFrames) clearInterval(interval);
            }, frameRate);
        }

        // Reset Transform on Touch End for Buttons
        function resetTransformOnTouchEnd(button, delay = 300) {
            button.addEventListener('touchend', () => {
                setTimeout(() => { button.style.transform = ''; }, delay);
            });
        }

        // Show Specific Section
        function showSection(sectionId) {
            sections.forEach(section => {
                section.style.display = section.id === sectionId ? 'block' : 'none';
            });
        }

        // ---------------------------------
        // Event Handlers and Initialization
        // ---------------------------------

        // Handle Mode Change
        buttonRight.addEventListener('click', () => {
            const currentIndex = modeOrder.indexOf(currentMode);
            currentMode = modeOrder[(currentIndex + 1) % modeOrder.length];

            // Update button appearance
            buttonRight.textContent = currentMode === 'hiragana' ? 'あ' : currentMode === 'kanji' ? '漢' : 'A';
            buttonRight.classList.toggle('english-text', currentMode === 'english');

            // Refresh UI elements
            updateTextSprites(currentMode);
            updateWelcomeText(currentMode);
            updateMenuText(currentMode);
            updateCircleTexts();
        });

        // Handle Theme Change
        themeButton.addEventListener('click', () => {
            const currentIndex = themeOrder.indexOf(currentTheme);
            currentTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
            updateTheme(currentTheme);
        });

        // Reset Transform on Touch End for Buttons
        [buttonRight, buttonLeft].forEach(button => resetTransformOnTouchEnd(button));

        // Toggle Menu Visibility
        buttonLeft.addEventListener('click', () => {
            menuContainer.style.display = menuContainer.style.display === 'flex' ? 'none' : 'flex';
        });

        // Handle Menu Navigation
        links.forEach(link => {
            link.addEventListener('click', event => {
                event.preventDefault();
                const targetSection = event.target.id.replace('-link', '-section');
                const section = document.getElementById(targetSection);

                section.style.display = 'none';
                setTimeout(() => {
                    showSection(targetSection);

                    if (targetSection === 'geometry-section') {
                        setupCanvas('canvas1', './Objects/Boolean.obj', 0);
                        setupCanvas('canvas2', './Objects/Cube.obj', 1);
                        setupCanvas('canvas3', './Objects/Plane.obj', 2);
                        updateTextSprites(currentMode);
                    }

                    menuContainer.style.display = 'none';
                }, 50);
            });
        });

        // Initialize Default State
        showSection('welcome-section');
        menuContainer.style.display = 'none';
        updateWelcomeText(currentMode);
        updateMenuText(currentMode);
        updateCircleTexts();

        // Setup touch events for letter-spacing transition on the welcome section heading
        const welcomeHeading = document.querySelector("#welcome-section h1");

        // Handle touch start
        welcomeHeading.addEventListener("touchstart", function() {
            welcomeHeading.style.letterSpacing = "0.15rem";
        });

        // Handle touch end
        welcomeHeading.addEventListener("touchend", function() {
            setTimeout(function() {
                welcomeHeading.style.letterSpacing = "0";
            }, 300); // Match the CSS transition duration
        });
    });
});
