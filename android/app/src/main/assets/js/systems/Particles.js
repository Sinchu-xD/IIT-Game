// Particle system - floating income text, effects
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.cashParticlePool = [];
    this.textureCache = {};
    this.maxParticles = 45;

    // Shared geometry & material for build dust effect to avoid GC
    this.dustGeo = new THREE.SphereGeometry(0.08, 4, 4);
    this.dustMat = new THREE.MeshBasicMaterial({ color: 0xCCAA66, transparent: true, opacity: 0.8 });
  }

  getTextTexture(text, color = '#FFD700') {
    const key = `${text}_${color}`;
    if (this.textureCache[key]) {
      return this.textureCache[key];
    }
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.textureCache[key] = texture;
    return texture;
  }

  spawnCashParticle(amount, position) {
    if (this.particles.length >= this.maxParticles) {
      // Drop oldest if at max capacity
      const oldest = this.particles.shift();
      if (oldest) {
        this.scene.remove(oldest.mesh);
        if (oldest.pooled && this.cashParticlePool.length < 25) {
          this.cashParticlePool.push(oldest);
        }
      }
    }

    const text = (typeof amount === 'string') ? amount : `+₹${amount}`;
    const texture = this.getTextTexture(text, '#4CAF50');
    let p;

    if (this.cashParticlePool.length > 0) {
      p = this.cashParticlePool.pop();
      p.age = 0;
      p.life = 1.4;
      if (p.mesh.material) {
        p.mesh.material.map = texture;
        p.mesh.material.opacity = 1.0;
        if (p.mesh.material.map.needsUpdate !== undefined) p.mesh.material.map.needsUpdate = true;
      }
      p.mesh.position.set(position.x, (position.y || 0) + 1.8, position.z);
      p.velocity.set((Math.random() - 0.5) * 0.3, 1.4 + Math.random() * 0.5, (Math.random() - 0.5) * 0.3);
      if (p.mesh.scale) p.mesh.scale.set(1.8, 0.45, 1);
    } else {
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(position.x, (position.y || 0) + 1.8, position.z);
      if (sprite.scale) sprite.scale.set(1.8, 0.45, 1);

      p = {
        mesh: sprite,
        life: 1.4,
        age: 0,
        pooled: true,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          1.4 + Math.random() * 0.5,
          (Math.random() - 0.5) * 0.3
        )
      };
    }

    this.scene.add(p.mesh);
    this.particles.push(p);
    return p;
  }

  spawnFloatingText(text, position, color = '#FFFFFF') {
    if (this.particles.length >= this.maxParticles) {
      const oldest = this.particles.shift();
      if (oldest) {
        this.scene.remove(oldest.mesh);
        if (oldest.pooled && this.cashParticlePool.length < 25) {
          this.cashParticlePool.push(oldest);
        }
      }
    }

    const hexColor = (typeof color === 'number') ? `#${color.toString(16).padStart(6, '0')}` : color;
    const texture = this.getTextTexture(text, hexColor);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(position.x, (position.y || 0) + 2.0, position.z);
    if (sprite.scale) sprite.scale.set(2.2, 0.55, 1);

    const particle = {
      mesh: sprite,
      life: 1.5,
      age: 0,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        1.5 + Math.random() * 0.5,
        (Math.random() - 0.5) * 0.4
      )
    };

    this.scene.add(sprite);
    this.particles.push(particle);
    return particle;
  }

  spawnBuildEffect(position) {
    // Dust particles using pre-allocated geometry and material to eliminate allocations
    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(this.dustGeo, this.dustMat);
      mesh.position.set(position.x, (position.y || 0) + 0.5, position.z);
      const particle = {
        mesh,
        life: 1.0,
        age: 0,
        isDust: true,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 3,
          (Math.random() - 0.5) * 2
        )
      };
      this.scene.add(mesh);
      this.particles.push(particle);
    }
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += deltaTime;
      if (p.age >= p.life) {
        this.scene.remove(p.mesh);
        if (p.pooled) {
          this.particles.splice(i, 1);
          if (this.cashParticlePool.length < 25) {
            this.cashParticlePool.push(p);
          }
          continue;
        }
        if (p.isDust) {
          // Dust uses shared geometry/material, do NOT dispose shared resources
          this.particles.splice(i, 1);
          continue;
        }
        if (p.mesh.material && p.mesh.material.map && !this.textureCache[p.mesh.material.map]) {
          // Texture cache retains references; do not dispose cached canvas textures
        }
        if (p.mesh.material && p.mesh.material.dispose) p.mesh.material.dispose();
        if (p.mesh.geometry && p.mesh.geometry.dispose) p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      const t = p.age / p.life;

      // Zero-allocation position update (in-place arithmetic avoids Vector3.clone())
      p.mesh.position.x += p.velocity.x * deltaTime;
      p.mesh.position.y += p.velocity.y * deltaTime;
      p.mesh.position.z += p.velocity.z * deltaTime;
      p.velocity.y -= 2 * deltaTime;

      if (p.mesh.material && p.mesh.material.opacity !== undefined) {
        p.mesh.material.opacity = 1 - t;
      }
      if (p.mesh.scale) {
        const s = 1 - t * 0.5;
        p.mesh.scale.set(s, s, s);
      }
    }
  }
}
