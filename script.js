document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       SCROLL-REVEAL & MARQUEE ANIMATIONS
       ========================================= */
       
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: "0px 0px -60px 0px"
    });

    const hiddenElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
    hiddenElements.forEach((el) => observer.observe(el));

    let lastScrollY = window.scrollY;
    let currentVelocity = 0;
    let targetVelocity = 0;
    const marquee = document.querySelector('.marquee-content');

    function tickScrollEffects() {
        const scrollY = window.scrollY;
        const rawVelocity = scrollY - lastScrollY;
        lastScrollY = scrollY;

        targetVelocity = Math.abs(rawVelocity);
        currentVelocity += (targetVelocity - currentVelocity) * 0.1;

        document.documentElement.style.setProperty('--scroll-y', scrollY);
        document.documentElement.style.setProperty('--scroll-velocity', currentVelocity);

        if (marquee) {
            if (typeof marquee.getAnimations === 'function') {
                const animation = marquee.getAnimations()[0];
                if (animation) {
                    const targetPlaybackRate = 1 + currentVelocity * 0.04;
                    animation.playbackRate = Math.min(5, targetPlaybackRate);
                }
            } else {
                const duration = Math.max(3, 20 - currentVelocity * 0.15);
                marquee.style.animationDuration = `${duration}s`;
            }
        }

        requestAnimationFrame(tickScrollEffects);
    }
    requestAnimationFrame(tickScrollEffects);


    /* =========================================
       WEB AUDIO SYNTHESIZER (Mechanical Clicks)
       ========================================= */

    let audioCtx = null;

    function playClickSound() {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const now = audioCtx.currentTime;

            // 1. High frequency tactile bump noise
            const bufferSize = audioCtx.sampleRate * 0.012;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const channelData = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                channelData[i] = Math.random() * 2 - 1;
            }

            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = buffer;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1400, now);

            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.22, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.012);

            noiseSource.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(audioCtx.destination);
            noiseSource.start(now);

            // 2. Mid-frequency switch clack
            const osc = audioCtx.createOscillator();
            const oscGain = audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(750, now);
            osc.frequency.exponentialRampToValueAtTime(290, now + 0.035);

            oscGain.gain.setValueAtTime(0.18, now);
            oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

            osc.connect(oscGain);
            oscGain.connect(audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.04);
        } catch (e) {
            console.warn('Audio Context failed to initialize', e);
        }
    }


    /* =========================================
       THREE.JS INTERACTIVE PORTFOLIO SCENE
       ========================================= */

    const canvas = document.getElementById('hero-3d-canvas');
    if (!canvas) return;

    if (typeof THREE === 'undefined') {
        console.warn('Three.js library is not loaded. Displaying fallback message.');
        const canvasWrapper = canvas.parentElement;
        if (canvasWrapper) {
            canvasWrapper.innerHTML = `
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; border:2px dashed var(--color-dark); padding:2rem; text-align:center; background:var(--color-cream);">
                    <span style="font-size:3rem; margin-bottom:1rem;">⌨️</span>
                    <h3 style="font-size:1.35rem; font-weight:800; color:var(--color-dark); margin-bottom:0.5rem;">Interactive 3D Keyboard</h3>
                    <p style="font-size:0.95rem; color:var(--color-dark); opacity:0.8; max-width:260px; line-height:1.5; margin:0 auto;">Connect to the internet or enable WebGL in your browser settings to press the 3D keycaps.</p>
                </div>
            `;
        }
        return;
    }

    let width = canvas.parentElement.clientWidth;
    let height = canvas.parentElement.clientHeight;
    if (width === 0) width = 600;
    if (height === 0) height = 480;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.8);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(4, 9, 5);
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x6ca0fa, 2.4, 12);
    blueLight.position.set(-4, 3, 3);
    scene.add(blueLight);

    const limeLight = new THREE.PointLight(0xd8f22a, 2.0, 10);
    limeLight.position.set(4, -3, 3);
    scene.add(limeLight);


    // --- 2D ROUNDED RECTANGLE PATH FOR CHUBBY KEYCAPS ---
    
    function createRoundedRectShape(w, h, r) {
        const shape = new THREE.Shape();
        shape.moveTo(-w/2 + r, -h/2);
        shape.lineTo(w/2 - r, -h/2);
        shape.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r);
        shape.lineTo(w/2, h/2 - r);
        shape.quadraticCurveTo(w/2, h/2, w/2 - r, h/2);
        shape.lineTo(-w/2 + r, h/2);
        shape.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r);
        shape.lineTo(-w/2, -h/2 + r);
        shape.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2);
        return shape;
    }

    // --- CANVAS TEXTURE FOR KEYS ---
    
    function createKeycapTopTexture(letter, bgColor) {
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = 256;
        textureCanvas.height = 256;
        const ctx = textureCanvas.getContext('2d');

        // Base color
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 256, 256);

        // Recessed dish outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.lineWidth = 14;
        ctx.strokeRect(30, 30, 196, 196);

        // Highlight sheen
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(33, 33);
        ctx.lineTo(223, 33);
        ctx.moveTo(33, 33);
        ctx.lineTo(33, 223);
        ctx.stroke();

        // Bold letter text matching the reference image typography
        ctx.fillStyle = '#070A13';
        ctx.font = 'bold 125px "Outfit", "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, 128, 128);

        return new THREE.CanvasTexture(textureCanvas);
    }

    const keysList = [];

    // --- KEYCAP MESH BUILDER (WITH 3D OFFSET SHADOW BASE) ---
    
    function makeKeycap(letter, color, pos, rot) {
        const keyGroup = new THREE.Group();
        const movingPartsGroup = new THREE.Group();

        // 1. Create rounded shape and extrude for chubby look
        const shape = createRoundedRectShape(0.78, 0.78, 0.16);
        const extrudeSettings = {
            depth: 0.32,
            bevelEnabled: true,
            bevelSegments: 4,
            steps: 1,
            bevelSize: 0.08,
            bevelThickness: 0.08
        };
        const capGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        capGeom.center();

        // 2. Base Keycap Mesh (solid color matte plastic)
        const capMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.45, metalness: 0.15 });
        const capMesh = new THREE.Mesh(capGeom, capMat);
        movingPartsGroup.add(capMesh);

        // 3. Top Plate Overlay containing the letter texture (for guaranteed visibility)
        const topPlateGeom = new THREE.PlaneGeometry(0.74, 0.74);
        const topTex = createKeycapTopTexture(letter, color);
        topTex.needsUpdate = true;
        const topMat = new THREE.MeshStandardMaterial({ 
            map: topTex, 
            roughness: 0.35, 
            metalness: 0.15,
            side: THREE.DoubleSide
        });
        const topPlateMesh = new THREE.Mesh(topPlateGeom, topMat);
        topPlateMesh.position.z = 0.245; // sits exactly on top of extruded face (max Z is 0.24)
        movingPartsGroup.add(topPlateMesh);

        keyGroup.add(movingPartsGroup);

        // 4. 3D Offset Shadow base mesh directly underneath
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0x070A13 });
        const shadowMesh = new THREE.Mesh(capGeom, shadowMat);
        shadowMesh.position.set(0.04, -0.06, -0.15);
        keyGroup.add(shadowMesh);

        // 5. Align & Orient Group
        keyGroup.position.copy(pos);
        keyGroup.rotation.copy(rot);
        scene.add(keyGroup);

        keysList.push({
            group: keyGroup,
            movingParts: movingPartsGroup,
            mesh: capMesh,
            letter: letter,
            originalPosition: pos.clone(),
            originalRotation: rot.clone(),
            pressedAmount: 0.0,
            pressVelocity: 0.0,
            hoverScale: 1.0,
            floatPhase: Math.random() * Math.PI * 2
        });
    }

    // --- CHUBBY SPACEBAR GENERATOR ---
    
    function makeSpacebar(color, pos, rot) {
        const spaceGroup = new THREE.Group();

        const shape = createRoundedRectShape(1.88, 0.65, 0.15);
        const extrudeSettings = {
            depth: 0.28,
            bevelEnabled: true,
            bevelSegments: 4,
            steps: 1,
            bevelSize: 0.08,
            bevelThickness: 0.08
        };
        const capGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        capGeom.center();

        const spaceMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.45, metalness: 0.15 });
        const spaceMesh = new THREE.Mesh(capGeom, spaceMat);
        spaceGroup.add(spaceMesh);

        // Shadow base
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0x070A13 });
        const shadowMesh = new THREE.Mesh(capGeom, shadowMat);
        shadowMesh.position.set(0.04, -0.06, -0.12);
        spaceGroup.add(shadowMesh);

        spaceGroup.position.copy(pos);
        spaceGroup.rotation.copy(rot);
        scene.add(spaceGroup);

        keysList.push({
            group: spaceGroup,
            mesh: spaceMesh,
            letter: 'Spacebar',
            originalPosition: pos.clone(),
            originalRotation: rot.clone(),
            pressedAmount: 0.0,
            pressVelocity: 0.0,
            hoverScale: 1.0,
            floatPhase: Math.random() * Math.PI * 2
        });
    }

    // --- CHUBBY CHAT BUBBLE GENERATOR ---
    
    function makeChatBubble(color, pos, rot) {
        const bubbleGroup = new THREE.Group();

        const bubbleShape = new THREE.Shape();
        bubbleShape.moveTo(0, 0.32);
        bubbleShape.quadraticCurveTo(0.42, 0.32, 0.42, 0);
        bubbleShape.quadraticCurveTo(0.42, -0.32, 0, -0.32);
        bubbleShape.lineTo(-0.18, -0.48);
        bubbleShape.lineTo(-0.18, -0.32);
        bubbleShape.quadraticCurveTo(-0.42, -0.32, -0.42, 0);
        bubbleShape.quadraticCurveTo(-0.42, 0.32, 0, 0.32);

        const extrudeSettings = {
            depth: 0.12,
            bevelEnabled: true,
            bevelSegments: 4,
            steps: 1,
            bevelSize: 0.04,
            bevelThickness: 0.04
        };
        const bubbleGeom = new THREE.ExtrudeGeometry(bubbleShape, extrudeSettings);
        bubbleGeom.center();

        const bubbleMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.42, metalness: 0.1 });
        const bubbleMesh = new THREE.Mesh(bubbleGeom, bubbleMat);
        bubbleGroup.add(bubbleMesh);

        // Shadow base
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0x070A13 });
        const shadowMesh = new THREE.Mesh(bubbleGeom, shadowMat);
        shadowMesh.position.set(0.04, -0.06, -0.1);
        bubbleGroup.add(shadowMesh);

        bubbleGroup.position.copy(pos);
        bubbleGroup.rotation.copy(rot);
        scene.add(bubbleGroup);

        keysList.push({
            group: bubbleGroup,
            mesh: bubbleMesh,
            letter: 'ChatBubble',
            originalPosition: pos.clone(),
            originalRotation: rot.clone(),
            pressedAmount: 0.0,
            pressVelocity: 0.0,
            hoverScale: 1.0,
            floatPhase: Math.random() * Math.PI * 2
        });
    }


    // --- GENERATE KEYS MATCHING THE EXACT SCATTER & TILT OF THE REFERENCE ---

    // A: Orange, leftmost center-row key
    makeKeycap("A", "#FF5A19", 
        new THREE.Vector3(-1.35, 0.45, 0.25), 
        new THREE.Euler(0.32, -0.28, -0.1)
    );

    // M: Purple, second left center-row key
    makeKeycap("M", "#8B5CF6", 
        new THREE.Vector3(-0.48, 0.55, 0.22), 
        new THREE.Euler(0.28, -0.15, 0.08)
    );

    // A: Green, third center-row key
    makeKeycap("A", "#10B981", 
        new THREE.Vector3(0.40, 0.48, 0.18), 
        new THREE.Euler(0.24, 0.1, -0.05)
    );

    // L: Yellow, rightmost center-row key
    makeKeycap("L", "#FBBF24", 
        new THREE.Vector3(1.28, 0.52, 0.2), 
        new THREE.Euler(0.18, 0.2, -0.08)
    );

    // </>[Pushed Aside]: White code key, top-left margin
    makeKeycap("</>", "#FFFFFF", 
        new THREE.Vector3(-1.0, 1.35, -0.25), 
        new THREE.Euler(0.32, -0.22, 0.06)
    );

    // ✦[Pushed Aside]: Cyan star key, top-right margin
    makeKeycap("✦", "#6CA0FA", 
        new THREE.Vector3(0.9, 1.32, -0.25), 
        new THREE.Euler(0.2, 0.25, -0.06)
    );

    // Ctrl[Pushed Aside]: Orange Keycap, far bottom-right margin
    makeKeycap("Ctrl", "#FF5A19", 
        new THREE.Vector3(1.5, -0.42, 0.22), 
        new THREE.Euler(0.15, 0.2, -0.08)
    );

    // Chat Bubble[Pushed Aside]: Purple, far bottom-left margin
    makeChatBubble("#8B5CF6", 
        new THREE.Vector3(-1.3, -1.02, 0.15), 
        new THREE.Euler(0.14, -0.12, 0.15)
    );

    // Spacebar[Pushed Aside]: White, bottom-center margin
    makeSpacebar("#FFFFFF", 
        new THREE.Vector3(0.45, -1.2, 0.0), 
        new THREE.Euler(0.1, 0.18, -0.15)
    );


    // --- INTERACTIONS & RAYCASTING ---

    let mouseX = 0;
    let mouseY = 0;

    window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    const raycaster = new THREE.Raycaster();
    const cursorCoords = new THREE.Vector2();

    // Trigger keypress along local switch axis Z on click
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        cursorCoords.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        cursorCoords.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(cursorCoords, camera);

        for (const key of keysList) {
            const intersects = raycaster.intersectObject(key.mesh, true);
            if (intersects.length > 0) {
                // Key bottom out
                key.pressedAmount = 0.18;
                key.pressVelocity = -0.012;
                playClickSound();
                break;
            }
        }
    });

    // Wire play button to trigger cascaded switch press
    const playTriggerBtn = document.querySelector('.btn-dual-block');
    if (playTriggerBtn) {
        playTriggerBtn.addEventListener('click', (e) => {
            playClickSound();
            keysList.forEach((key, index) => {
                setTimeout(() => {
                    key.pressedAmount = 0.16;
                    key.pressVelocity = -0.012;
                }, index * 85);
            });
        });
    }

    // Handles layout width updates for responsive scaling
    function resizeCanvas() {
        if (!canvas.parentElement) return;
        let newWidth = canvas.parentElement.clientWidth;
        let newHeight = canvas.parentElement.clientHeight;

        if (newWidth === 0) newWidth = 600;
        if (newHeight === 480) newHeight = 480;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(newWidth, newHeight, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
    
    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(canvas.parentElement);


    // --- TICK ANIMATION LOOP ---

    const clock = new THREE.Clock();

    function animate() {
        const elapsedTime = clock.getElapsedTime();

        cursorCoords.set(mouseX, mouseY);
        raycaster.setFromCamera(cursorCoords, camera);

        let activeHoverFound = false;

        keysList.forEach((key) => {
            // Check hover states
            const intersects = raycaster.intersectObject(key.mesh, true);
            if (intersects.length > 0) {
                key.hoverScale += (1.10 - key.hoverScale) * 0.12;
                activeHoverFound = true;
            } else {
                key.hoverScale += (1.0 - key.hoverScale) * 0.12;
            }

            // Spring Physics simulation for key switch bottom out (damped harmonic oscillator)
            const springK = 0.18;
            const damping = 0.8;
            
            const force = -springK * key.pressedAmount;
            key.pressVelocity += force;
            key.pressVelocity *= damping;
            key.pressedAmount += key.pressVelocity;

            if (key.pressedAmount < 0) {
                key.pressedAmount = 0;
                key.pressVelocity = 0;
            }

            // Wave float
            const floatOffset = Math.sin(elapsedTime * 1.5 + key.floatPhase) * 0.055;
            
            // Adjust position: float + keypress offset
            // We depress the key along its local Z axis (into its shadow base)
            if (key.movingParts) {
                key.movingParts.position.z = -key.pressedAmount;
            } else {
                key.mesh.position.z = -key.pressedAmount;
            }

            // Apply global positioning
            key.group.position.y = key.originalPosition.y + floatOffset;
            
            // Apply scale
            key.group.scale.set(key.hoverScale, key.hoverScale, key.hoverScale);

            // Subtle mouse parallax rotation
            key.group.rotation.x = key.originalRotation.x + mouseY * 0.1;
            key.group.rotation.y = key.originalRotation.y + mouseX * 0.1;
        });

        canvas.style.cursor = activeHoverFound ? 'pointer' : 'grab';

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    animate();

});