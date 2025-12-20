
// animator.js

// --- Globals ---
let scene, camera, renderer, controls;
let stickman, followerRod, camDisk;
let isPlaying = false;
let playSpeed = 1; // degrees per frame
let animationId;

// State
const state = {
    angle: 0,       // 0-360 degrees
    height: 0,      // 0-100 units
    keyframes: []   // Array of { angle: number, height: number }
};

// DOM Elements
const elCanvas = document.getElementById('canvas-container');
const elAngleSlider = document.getElementById('cam-angle');
const elAngleVal = document.getElementById('cam-angle-val');
const elHeightSlider = document.getElementById('follower-height');
const elHeightVal = document.getElementById('follower-height-val');
const elTimeline = document.getElementById('timeline-viz');
const elCurrentMarker = document.getElementById('current-time-marker');

// --- Initialization ---
function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    scene.fog = new THREE.Fog(0x222222, 200, 500);

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(45, elCanvas.clientWidth / elCanvas.clientHeight, 1, 1000);
    camera.position.set(200, 150, 200);
    camera.lookAt(0, 50, 0);

    // 3. Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(elCanvas.clientWidth, elCanvas.clientHeight);
    renderer.shadowMap.enabled = true;
    elCanvas.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 200, 100);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 5. Objects
    createGround();
    createMechanism();
    createStickman();

    // 6. Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 50;
    controls.maxDistance = 800;
    controls.maxPolarAngle = Math.PI / 2; // Don't allow going below ground

    // 7. Listeners-
    window.addEventListener('resize', onWindowResize, false);
    setupUI();

    // 8. Initial Render
    animate();
}

function createGround() {
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        new THREE.MeshPhongMaterial({ color: 0x444444, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(500, 50, 0x000000, 0x555555);
    scene.add(grid);
}

function createMechanism() {
    // The "Cam" representation (just a disk rotating)
    const geometry = new THREE.CylinderGeometry(40, 40, 5, 32);
    const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    camDisk = new THREE.Mesh(geometry, material);

    // We want the disk to face the camera (Z). 
    // Cylinder geometry axis is Y.
    // Rotate X by 90 to align axis to Z.
    camDisk.rotation.x = Math.PI / 2;

    // IMPORTANT: Set rotation order to ensure Z-spin (Local Y) works after X-tilt.
    // Actually, simply rotating Y (Local Axis) works regardless of X orientation IF we interpret it intrinsically.
    // But Three.js Euler is extrinsic by default logic? No.
    // Let's just use a container group to be 100% robust.

    const camContainer = new THREE.Group();
    camContainer.add(camDisk);
    scene.add(camContainer);

    // We will rotate camDisk (the cylinder) around its Y axis (spin).
    // And we rotate the Container to orient the whole mechanism.
    // But camDisk IS the cam.
    // Let's just Keep it simple.
    // With rotation.x = 90, axis is Z.
    // Rotating Y (Local) spins it.
    // Three.js: object.rotateY(rad) applies intrinsic rotation.
    // object.rotation.y = rad sets Euler Y.
    // If Order is XYZ (default):
    // R = Rx(90) * Ry(angle) * Rz(0).
    // Rx(90): Y->Z.
    // Ry(angle): Rotate around Global Y? No.
    // In Euler XYZ: Y rotation is around the axis AFTER X rotation? No. It's usually global or intermediate.
    // Let's use a pivot group to avoid Euler Gimbal Lock/Order confusion.

    // Revert to: Mechanism = Group.
    // CamMesh = Cylinder(Y-up).
    // We rotate CamMesh around Y.
    // We rotate Mechanism Group X=90.

    camDisk.rotation.set(0, 0, 0); // Reset
    camDisk.geometry.rotateX(Math.PI / 2); // Bake the geometry rotation! Axis is now Z.
    // Now rotating Z spins it around Z axis.
    // This is much safer.

    camDisk.position.y = 30;
    camDisk.castShadow = true;

    // Add a visual marker to see rotation
    const marker = new THREE.Mesh(
        new THREE.BoxGeometry(5, 5, 10),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    // Cylinder is radius 40. Height 5.
    // Cylinder default axis is Y.
    // We want marker on the "Face" (near rim).
    // User wants "Start" at Top (12 o'clock).
    // In XY plane, Top is (0, Radius).
    // Radius is 40. Let's put it at 35.
    // Z is thickness (Face at ~2.5). Box depth 10.
    marker.position.set(0, 35, 5);
    camDisk.add(marker);

    scene.add(camDisk);

    // Follower Rod
    const rodGeo = new THREE.CylinderGeometry(2, 2, 100, 8);
    const rodMat = new THREE.MeshPhongMaterial({ color: 0x44aaff });
    followerRod = new THREE.Mesh(rodGeo, rodMat);
    followerRod.position.x = 0;
    followerRod.position.y = 80; // Initial pos
    followerRod.castShadow = true;
    scene.add(followerRod);
}

function createStickman() {
    stickman = new THREE.Group();

    // Materials
    const jointMat = new THREE.MeshPhongMaterial({ color: 0xffcc00 }); // Yellow joints
    const boneMat = new THREE.MeshPhongMaterial({ color: 0xffffff });  // White bones

    // 1. Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(10, 40, 5), boneMat);
    torso.position.y = 20; // local y, relative to hip
    stickman.add(torso);

    // 2. Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 16), jointMat);
    head.position.y = 45;
    torso.add(head);

    // 3. Arms (Static for now, could be animated later)
    const armL = new THREE.Mesh(new THREE.BoxGeometry(4, 30, 4), boneMat);
    armL.position.set(-8, 30, 0);
    armL.rotation.z = 0.5;
    stickman.add(armL);

    const armR = new THREE.Mesh(new THREE.BoxGeometry(4, 30, 4), boneMat);
    armR.position.set(8, 30, 0);
    armR.rotation.z = -0.5;
    stickman.add(armR);

    // 4. Legs
    // We will attach stickman to the rod, so the whole group moves up/down.
    // Let's add simple legs hanging down.
    const legL = new THREE.Mesh(new THREE.BoxGeometry(5, 40, 5), boneMat);
    legL.position.set(-6, -20, 0);
    stickman.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(5, 40, 5), boneMat);
    legR.position.set(6, -20, 0);
    stickman.add(legR);

    // Position entire stickman on top of the rod
    stickman.position.y = 50; // Half rod height roughly
    followerRod.add(stickman); // Attach to rod so it moves with it
}

// --- Logic ---

function updateScene() {
    // 1. Rotate Cam
    // Geometry was baked with rotateX(90), so axis is Z.
    // Rotate around Z.
    camDisk.rotation.z = THREE.MathUtils.degToRad(state.angle);

    // 2. Move Follower Rod
    // Base Y is 60 (just above cam). Plus height (0-100).
    const baseY = 60;
    followerRod.position.y = baseY + parseInt(state.height);

    // 3. Update UI values
    elAngleVal.innerText = Math.round(state.angle) + '°';
    elHeightVal.innerText = Math.round(state.height);

    // Update Slider UI if not being dragged (to sync with play)
    if (isPlaying) {
        elAngleSlider.value = state.angle;
        elHeightSlider.value = state.height;
    }

    // Update timeline marker
    const pct = state.angle / 360 * 100;
    elCurrentMarker.style.left = pct + '%';
}

function updateInterpolation() {
    // If we are playing or moving angle, and we have keyframes, interpolate height
    if (state.keyframes.length < 2) return;

    // Sort keyframes by angle
    state.keyframes.sort((a, b) => a.angle - b.angle);

    // Find current interval
    let cur = state.angle;
    // Handle wrap-around logic? 
    // Basic linear interpolation:
    // Find p1 <= cur < p2

    // Ensure we have a point at 0 and 360 for loop?
    // If user didn't set 0/360, we might wrap.
    // For now, let's just look for neighbors.

    let p1 = state.keyframes[0];
    let p2 = state.keyframes[state.keyframes.length - 1];

    for (let i = 0; i < state.keyframes.length - 1; i++) {
        if (state.angle >= state.keyframes[i].angle && state.angle <= state.keyframes[i + 1].angle) {
            p1 = state.keyframes[i];
            p2 = state.keyframes[i + 1];
            break;
        }
    }

    // Special case: if angle > last keyframe, interpolate to first (loop)?
    // Or just clamp to last? 
    // For a cyclic cam, 360 should equal 0.

    // Let's implement simple linear between p1 and p2
    // If p1 == p2, height is p1.height
    if (p1 === p2) {
        state.height = p1.height;
        return;
    }

    const t = (state.angle - p1.angle) / (p2.angle - p1.angle);
    state.height = p1.height + (p2.height - p1.height) * t;
}

function onWindowResize() {
    camera.aspect = elCanvas.clientWidth / elCanvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(elCanvas.clientWidth, elCanvas.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // required if controls.enableDamping or controls.autoRotate are set to true
    if (controls) controls.update();

    if (isPlaying) {
        state.angle += playSpeed;
        if (state.angle >= 360) state.angle = 0;
        updateInterpolation();
        updateScene();
    }

    renderer.render(scene, camera);
}

// --- UI Binding ---

function setupUI() {
    // Sliders
    elAngleSlider.addEventListener('input', (e) => {
        state.angle = parseFloat(e.target.value);
        isPlaying = false;
        // Optionally snap to existing keyframe?
        updateInterpolation(); // If we want to see the curve while scrubbing
        updateScene(); // Just update visual
    });

    elHeightSlider.addEventListener('input', (e) => {
        state.height = parseFloat(e.target.value);
        updateScene();
    });

    // Buttons
    document.getElementById('btn-add-keyframe').addEventListener('click', addKeyframe);
    document.getElementById('btn-play').addEventListener('click', togglePlay);
    document.getElementById('btn-clear').addEventListener('click', clearKeyframes);
    document.getElementById('btn-save-exit').addEventListener('click', exportAndExit);

    // Initial state
    // Add default keyframes at 0 and 360?
}

function addKeyframe() {
    // Check if keyframe exists at this angle
    const existingIdx = state.keyframes.findIndex(k => Math.abs(k.angle - state.angle) < 0.5);

    const newKey = { angle: state.angle, height: state.height };

    if (existingIdx >= 0) {
        // Update
        state.keyframes[existingIdx] = newKey;
    } else {
        // Add
        state.keyframes.push(newKey);
    }

    renderTimeline();

    // If user added 0, maybe auto-add 360 to close loop? Or vice versa.
}

function clearKeyframes() {
    state.keyframes = [];
    renderTimeline();
}

function togglePlay() {
    isPlaying = !isPlaying;
    document.getElementById('btn-play').innerText = isPlaying ? "Pause" : "Play Preview";
}

function renderTimeline() {
    // Clear existing markers
    const markers = elTimeline.querySelectorAll('.keyframe-marker');
    markers.forEach(m => m.remove());

    state.keyframes.forEach(k => {
        const div = document.createElement('div');
        div.className = 'keyframe-marker';
        div.style.left = (k.angle / 360 * 100) + '%';
        div.title = `Angle: ${k.angle}, Height: ${k.height}`;
        div.addEventListener('click', () => {
            state.angle = k.angle;
            state.height = k.height;
            updateScene();
        });
        elTimeline.appendChild(div);
    });
}

function exportAndExit() {
    // We need to generate a full 360 degree profile.
    // Resolution: 1 degree?
    const exportPoints = [];

    // Backup current state
    const savedAngle = state.angle;
    const savedHeight = state.height;

    // Sort keyframes for cleaner interpolation logic reference
    state.keyframes.sort((a, b) => a.angle - b.angle);

    // If no keyframes, warn?
    if (state.keyframes.length === 0) {
        alert("No keyframes created! Please add at least 2 keyframes.");
        return;
    }

    // Ensure we cover 0 to 360
    // If we only have partial data, we might need to extrapolate or loop.
    // Simple approach: Use existing interpolation logic.

    for (let i = 0; i < 360; i += 10) { // Step 5 degrees
        state.angle = i;
        updateInterpolation();
        // Convert to Cartesian X/Y for the Cam app.
        // Cam app expects radial displacement.
        // height 0-100 -> Radius delta?
        // Default Cam data structure: array of {x: angle, y: radius_offset}

        // existing app format (from declicam-simple.js / index.html):
        // segments: [ {x: 0, y: -23}, ... ] where x is angle, y is radius offset.

        exportPoints.push({
            x: i,
            y: state.height // Map 0-100 directly to radius change? Should be fine.
        });
    }

    // Restore state
    state.angle = savedAngle;
    state.height = savedHeight;

    const exportData = {
        name: "Stickman Animation",
        segments: exportPoints,
        rotSpeed: 1,
        stepsWidth: -1,
        rotationDir: 1,
        dataType: "rotating"
    };

    localStorage.setItem('camImport', JSON.stringify(exportData));
    window.location.href = 'index.html';
}

// Start
init();
