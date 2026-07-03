import * as THREE from 'three';

export class Watch3D {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.watch = null;
    this.hourHand = null;
    this.minuteHand = null;
    this.secondHand = null;
    this.mouse = { x: 0, y: 0 };
    this.targetRotation = { x: 0, y: 0 };
    this.currentRotation = { x: 0, y: 0 };
    this.animationId = null;

    this.init();
    this.createWatch();
    this.setupLights();
    this.setupControls();
    this.animate();
  }

  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 2.5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
  }

  createWatch() {
    this.watch = new THREE.Group();

    // Watch case
    const caseGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 64);
    const caseMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.3,
      metalness: 0.8,
    });
    const watchCase = new THREE.Mesh(caseGeometry, caseMaterial);
    watchCase.castShadow = true;
    watchCase.receiveShadow = true;
    this.watch.add(watchCase);

    // Watch dial (face)
    const dialGeometry = new THREE.CylinderGeometry(0.95, 0.95, 0.05, 64);
    const dialMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2b4a,
      roughness: 0.4,
      metalness: 0.2,
    });
    const dial = new THREE.Mesh(dialGeometry, dialMaterial);
    dial.position.z = 0.15;
    dial.castShadow = true;
    dial.receiveShadow = true;
    this.watch.add(dial);

    // Hour markers (12 dots)
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * Math.PI / 180;
      const x = 0.75 * Math.cos(angle - Math.PI / 2);
      const y = 0.75 * Math.sin(angle - Math.PI / 2);

      const markerGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 32);
      const markerMaterial = new THREE.MeshStandardMaterial({
        color: 0xC4956A,
        roughness: 0.2,
        metalness: 0.6,
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x, y, 0.2);
      marker.castShadow = true;
      this.watch.add(marker);
    }

    // Hour hand
    const hourHandGeometry = new THREE.BoxGeometry(0.08, 0.35, 0.05);
    const handMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.7,
    });
    this.hourHand = new THREE.Mesh(hourHandGeometry, handMaterial);
    this.hourHand.position.set(0, 0.15, 0.25);
    this.hourHand.castShadow = true;
    this.watch.add(this.hourHand);

    // Minute hand
    const minuteHandGeometry = new THREE.BoxGeometry(0.06, 0.45, 0.05);
    this.minuteHand = new THREE.Mesh(minuteHandGeometry, handMaterial);
    this.minuteHand.position.set(0, 0.2, 0.26);
    this.minuteHand.castShadow = true;
    this.watch.add(this.minuteHand);

    // Second hand
    const secondHandGeometry = new THREE.BoxGeometry(0.03, 0.5, 0.04);
    const secondMaterial = new THREE.MeshStandardMaterial({
      color: 0xE8D4C0,
      roughness: 0.2,
      metalness: 0.6,
    });
    this.secondHand = new THREE.Mesh(secondHandGeometry, secondMaterial);
    this.secondHand.position.set(0, 0.23, 0.27);
    this.secondHand.castShadow = true;
    this.watch.add(this.secondHand);

    // Center cap
    const capGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 32);
    const capMaterial = new THREE.MeshStandardMaterial({
      color: 0xC4956A,
      roughness: 0.2,
      metalness: 0.8,
    });
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.z = 0.28;
    cap.castShadow = true;
    this.watch.add(cap);

    this.scene.add(this.watch);
  }

  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Key light (right side)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(5, 3, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.far = 50;
    this.scene.add(keyLight);

    // Fill light (left side)
    const fillLight = new THREE.DirectionalLight(0x7f8fa3, 0.4);
    fillLight.position.set(-5, 2, 3);
    this.scene.add(fillLight);

    // Accent light (accent color)
    const accentLight = new THREE.PointLight(0xC4956A, 0.3);
    accentLight.position.set(-2, 1, 3);
    this.scene.add(accentLight);
  }

  setupControls() {
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.targetRotation.y = this.mouse.x * 0.3;
      this.targetRotation.x = this.mouse.y * 0.2;
    });
  }

  onMouseMove(e) {
    // Additional mouse handling if needed
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  updateHandRotations() {
    const now = new Date();
    const ms = now.getMilliseconds();
    const s = now.getSeconds() + ms / 1000;
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;

    this.secondHand.rotation.z = -(s * 6 * Math.PI / 180);
    this.minuteHand.rotation.z = -(m * 6 * Math.PI / 180);
    this.hourHand.rotation.z = -(h * 30 * Math.PI / 180);
  }

  animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    // Update hand rotations
    this.updateHandRotations();

    // Smooth parallax rotation
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;

    this.watch.rotation.x = this.currentRotation.x;
    this.watch.rotation.y = this.currentRotation.y;

    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
