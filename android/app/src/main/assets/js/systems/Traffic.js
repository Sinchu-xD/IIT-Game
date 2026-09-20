// Traffic system - procedural animated Indian traffic (Auto-rickshaws and Scooters)
export class TrafficSystem {
  constructor(scene) {
    this.scene = scene;
    this.vehicles = [];
    this.lanes = [
      // Westbound lane (along Z = 8.2, moves towards -X)
      {
        id: 'north_westbound',
        z: 8.2,
        startX: 16,
        endX: -16,
        direction: -1,
        rotationY: -Math.PI / 2
      },
      // Eastbound lane (along Z = -8.2, moves towards +X)
      {
        id: 'south_eastbound',
        z: -8.2,
        startX: -16,
        endX: 16,
        direction: 1,
        rotationY: Math.PI / 2
      }
    ];

    this.geometries = {};
    this.materials = {};
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    // Shared low-poly geometries (< 40 tris each)
    this.geometries.autoBody = new THREE.BoxGeometry(0.9, 0.6, 1.4);
    this.geometries.autoRoof = new THREE.BoxGeometry(0.82, 0.22, 1.25);
    this.geometries.autoCabin = new THREE.BoxGeometry(0.7, 0.5, 0.7);
    this.geometries.autoWheel = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10);
    this.geometries.windshield = new THREE.BoxGeometry(0.76, 0.4, 0.04);
    this.geometries.stripe = new THREE.BoxGeometry(0.92, 0.08, 0.12);

    this.geometries.scooterBody = new THREE.BoxGeometry(0.3, 0.22, 0.85);
    this.geometries.scooterSeat = new THREE.BoxGeometry(0.24, 0.08, 0.32);
    this.geometries.scooterHandle = new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6);
    this.geometries.scooterWheel = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 10);
    this.geometries.riderTorso = new THREE.BoxGeometry(0.2, 0.28, 0.14);
    this.geometries.riderHead = new THREE.BoxGeometry(0.14, 0.14, 0.14);

    // Shared materials
    this.materials.autoGreen = new THREE.MeshLambertMaterial({ color: 0x1B5E20 });
    this.materials.autoBlack = new THREE.MeshLambertMaterial({ color: 0x212121 }); // Kaali-Peeli Mumbai style
    this.materials.autoYellow = new THREE.MeshLambertMaterial({ color: 0xFDD835 });
    this.materials.cabin = new THREE.MeshLambertMaterial({ color: 0x263238 });
    this.materials.wheel = new THREE.MeshLambertMaterial({ color: 0x111111 });
    this.materials.windshield = new THREE.MeshLambertMaterial({ color: 0x81D4FA, transparent: true, opacity: 0.6 });
    this.materials.stripeYellow = new THREE.MeshBasicMaterial({ color: 0xFFEB3B });

    this.materials.scooterRed = new THREE.MeshLambertMaterial({ color: 0xD32F2F });
    this.materials.scooterBlue = new THREE.MeshLambertMaterial({ color: 0x1976D2 });
    this.materials.scooterGrey = new THREE.MeshLambertMaterial({ color: 0x37474F });
    this.materials.scooterYellow = new THREE.MeshLambertMaterial({ color: 0xFBC02D });
    this.materials.riderSkin = new THREE.MeshLambertMaterial({ color: 0xD79A6D });
    this.materials.riderHelmet = new THREE.MeshLambertMaterial({ color: 0xFF9800 });

    // Pre-create initial traffic fleet (4 vehicles: 2 Autos, 2 Scooters)
    this.spawnVehicle('auto', 0, 5, 2.8);
    this.spawnVehicle('scooter', 0, 14, 3.8);
    this.spawnVehicle('auto', 1, -5, 2.9);
    this.spawnVehicle('scooter', 1, -13, 3.6);

    this.isInitialized = true;
  }

  createAutoRickshawMesh(isKaaliPeeli = false) {
    const group = new THREE.Group();

    // Lower body: Green or Kaali (Black)
    const bodyMat = isKaaliPeeli ? this.materials.autoBlack : this.materials.autoGreen;
    const body = new THREE.Mesh(this.geometries.autoBody, bodyMat);
    body.position.y = 0.42;
    body.castShadow = true;
    group.add(body);

    // Yellow roof
    const roof = new THREE.Mesh(this.geometries.autoRoof, this.materials.autoYellow);
    roof.position.y = 0.85;
    group.add(roof);

    // Passenger cabin opening
    const cabin = new THREE.Mesh(this.geometries.autoCabin, this.materials.cabin);
    cabin.position.set(0, 0.55, 0.2);
    group.add(cabin);

    // Front windshield
    const wind = new THREE.Mesh(this.geometries.windshield, this.materials.windshield);
    wind.position.set(0, 0.62, -0.68);
    group.add(wind);

    // Iconic yellow hazard stripes on side
    const stripe = new THREE.Mesh(this.geometries.stripe, this.materials.stripeYellow);
    stripe.position.set(0, 0.68, 0);
    group.add(stripe);

    // Front single wheel
    const fw = new THREE.Mesh(this.geometries.autoWheel, this.materials.wheel);
    fw.rotation.z = Math.PI / 2;
    fw.position.set(0, 0.16, -0.48);
    group.add(fw);

    // Rear pair of wheels
    const rwL = new THREE.Mesh(this.geometries.autoWheel, this.materials.wheel);
    rwL.rotation.z = Math.PI / 2;
    rwL.position.set(-0.42, 0.16, 0.45);
    group.add(rwL);

    const rwR = new THREE.Mesh(this.geometries.autoWheel, this.materials.wheel);
    rwR.rotation.z = Math.PI / 2;
    rwR.position.set(0.42, 0.16, 0.45);
    group.add(rwR);

    group.userData = { isKaaliPeeli };
    return group;
  }

  createScooterMesh(colorMat) {
    const group = new THREE.Group();

    // Chassis / Body
    const body = new THREE.Mesh(this.geometries.scooterBody, colorMat || this.materials.scooterRed);
    body.position.y = 0.28;
    body.castShadow = true;
    group.add(body);

    // Seat
    const seat = new THREE.Mesh(this.geometries.scooterSeat, this.materials.cabin);
    seat.position.set(0, 0.44, -0.08);
    group.add(seat);

    // Handlebar
    const handle = new THREE.Mesh(this.geometries.scooterHandle, this.materials.wheel);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0.52, 0.28);
    group.add(handle);

    // Front wheel
    const fw = new THREE.Mesh(this.geometries.scooterWheel, this.materials.wheel);
    fw.rotation.z = Math.PI / 2;
    fw.position.set(0, 0.12, 0.32);
    group.add(fw);

    // Rear wheel
    const rw = new THREE.Mesh(this.geometries.scooterWheel, this.materials.wheel);
    rw.rotation.z = Math.PI / 2;
    rw.position.set(0, 0.12, -0.32);
    group.add(rw);

    // Stylized commuter rider
    const riderTorso = new THREE.Mesh(this.geometries.riderTorso, this.materials.scooterGrey);
    riderTorso.position.set(0, 0.62, -0.06);
    group.add(riderTorso);

    const riderHead = new THREE.Mesh(this.geometries.riderHead, this.materials.riderHelmet);
    riderHead.position.set(0, 0.85, -0.06);
    group.add(riderHead);

    return group;
  }

  spawnVehicle(type, laneIdx, initialX, speed) {
    const lane = this.lanes[laneIdx % this.lanes.length];
    let meshGroup;

    if (type === 'auto') {
      const isKaaliPeeli = (this.vehicles.length % 2 === 1);
      meshGroup = this.createAutoRickshawMesh(isKaaliPeeli);
    } else {
      const colorMats = [this.materials.scooterRed, this.materials.scooterBlue, this.materials.scooterYellow, this.materials.scooterGrey];
      const mat = colorMats[this.vehicles.length % colorMats.length];
      meshGroup = this.createScooterMesh(mat);
    }

    meshGroup.position.set(initialX, 0, lane.z);
    meshGroup.rotation.y = lane.rotationY;

    meshGroup.userData = {
      isVehicle: true,
      type,
      laneIdx,
      speed: speed || (2.5 + Math.random() * 1.5),
      baseSpeed: speed || (2.5 + Math.random() * 1.5),
      animTimer: Math.random() * 10
    };

    this.scene.add(meshGroup);
    this.vehicles.push(meshGroup);
    return meshGroup;
  }

  update(deltaTime) {
    for (let i = 0; i < this.vehicles.length; i++) {
      const vehicle = this.vehicles[i];
      const lane = this.lanes[vehicle.userData.laneIdx];
      const uData = vehicle.userData;

      // Advance along lane
      vehicle.position.x += lane.direction * uData.speed * deltaTime;

      // Subtle engine vibration
      uData.animTimer += deltaTime * 8;
      vehicle.position.y = Math.sin(uData.animTimer) * 0.012;

      // Bounds check and wrap around
      if (lane.direction < 0 && vehicle.position.x < lane.endX) {
        vehicle.position.x = lane.startX + (Math.random() * 3);
        uData.speed = uData.baseSpeed * (0.9 + Math.random() * 0.25);
      } else if (lane.direction > 0 && vehicle.position.x > lane.endX) {
        vehicle.position.x = lane.startX - (Math.random() * 3);
        uData.speed = uData.baseSpeed * (0.9 + Math.random() * 0.25);
      }
    }
  }

  dispose() {
    for (const v of this.vehicles) {
      this.scene.remove(v);
    }
    this.vehicles = [];
    for (const k in this.geometries) {
      if (this.geometries[k].dispose) this.geometries[k].dispose();
    }
    for (const k in this.materials) {
      if (this.materials[k].dispose) this.materials[k].dispose();
    }
    this.isInitialized = false;
  }
}
