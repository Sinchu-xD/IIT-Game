// Camera system - touch and mouse pan/zoom with synchronized lookAt boundaries
export class CameraController {
  constructor(camera, domElement, bounds) {
    this.camera = camera;
    this.domElement = domElement;
    this.bounds = bounds;
    this.target = new THREE.Vector3(0, 0, 0);
    this.targetLookAt = new THREE.Vector3(0, 0, 0);
    this.isDragging = false;
    this.isMouseDown = false;
    this.lastTouch = { x: 0, y: 0 };
    this.lastMouse = { x: 0, y: 0 };
    this.pinchDist = 0;
    this.zoomLevel = 1.0;
    this.minZoom = 0.5;
    this.maxZoom = 2.5;
    this.smoothSpeed = 0.1;
    this.baseDistance = 15;
    this.baseHeight = 10;
    this.hasDragged = false;
    this.dragStartPos = { x: 0, y: 0 };

    this.setupEvents();
  }

  setupEvents() {
    const el = this.domElement;
    if (!el || !el.addEventListener) return;

    // ─── Touch Events ───
    el.addEventListener('touchstart', (e) => {
      this.hasDragged = false;
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.dragStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        this.pinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this.lastTouch.x;
        const dy = e.touches[0].clientY - this.lastTouch.y;
        const totalDist = Math.hypot(
          e.touches[0].clientX - this.dragStartPos.x,
          e.touches[0].clientY - this.dragStartPos.y
        );
        if (totalDist > 5) this.hasDragged = true;

        const panSpeed = 0.05 * this.baseDistance / this.zoomLevel;
        this.target.x -= dx * panSpeed * 0.02;
        this.target.z -= dy * panSpeed * 0.02;
        this.clampTarget();
        this.lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.updateCameraPosition();
      } else if (e.touches.length === 2) {
        this.hasDragged = true;
        const newDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = this.pinchDist - newDist;
        this.zoomLevel += delta * 0.005;
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel));
        this.pinchDist = newDist;
        this.updateCameraPosition();
      }
    }, { passive: false });

    el.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // ─── Mouse Desktop Events ───
    el.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this.isMouseDown = true;
      this.hasDragged = false;
      this.lastMouse = { x: e.clientX, y: e.clientY };
      this.dragStartPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;
      const dx = e.clientX - this.lastMouse.x;
      const dy = e.clientY - this.lastMouse.y;
      const totalDist = Math.hypot(
        e.clientX - this.dragStartPos.x,
        e.clientY - this.dragStartPos.y
      );
      if (totalDist > 5) this.hasDragged = true;

      const panSpeed = 0.05 * this.baseDistance / this.zoomLevel;
      this.target.x -= dx * panSpeed * 0.02;
      this.target.z -= dy * panSpeed * 0.02;
      this.clampTarget();
      this.lastMouse = { x: e.clientX, y: e.clientY };
      this.updateCameraPosition();
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
      this.updateCameraPosition();
    }, { passive: false });
  }

  clampTarget() {
    if (this.bounds) {
      this.target.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.target.x));
      this.target.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, this.target.z));
    }
  }

  updateCameraPosition() {
    const dist = this.baseDistance / this.zoomLevel;
    const height = this.baseHeight / this.zoomLevel;
    this.camera.position.set(
      this.target.x,
      height,
      this.target.z + dist
    );
    this.targetLookAt.set(this.target.x, 0, this.target.z);
    this.camera.lookAt(this.targetLookAt);
  }

  update() {
    this.updateCameraPosition();
  }

  focusOn(pos) {
    this.target.x = pos.x;
    this.target.z = pos.z;
    this.clampTarget();
    this.updateCameraPosition();
  }
}
