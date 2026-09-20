// Day/Night cycle - lightweight 4-phase system
class DayNightCycle {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 0.25; // 0-1, starts at morning
    this.cycleDuration = 300; // 5 minutes for full cycle
    this.phases = [
      { name: 'Morning', start: 0.0, end: 0.25, sky: 0x87CEEB, ambient: 0.6, fog: 0x87CEEB },
      { name: 'Afternoon', start: 0.25, end: 0.5, sky: 0x4A90D9, ambient: 1.0, fog: 0x87CEEB },
      { name: 'Evening', start: 0.5, end: 0.75, sky: 0xFF8C42, ambient: 0.5, fog: 0xFFB088 },
      { name: 'Night', start: 0.75, end: 1.0, sky: 0x0A0A2E, ambient: 0.2, fog: 0x111133 }
    ];
    this.currentPhase = 0;
    this.sunLight = null;
    this.ambientLight = null;
    this.fog = null;
    this.streetLights = [];
    this.buildingLights = [];
  }

  setLights(sunLight, ambientLight, fog) {
    this.sunLight = sunLight;
    this.ambientLight = ambientLight;
    this.fog = fog;
  }

  addStreetLight(mesh) { this.streetLights.push(mesh); }
  addBuildingLight(mesh) { this.buildingLights.push(mesh); }

  update(deltaTime) {
    this.timeOfDay += deltaTime / this.cycleDuration;
    if (this.timeOfDay >= 1.0) this.timeOfDay -= 1.0;

    let phaseIdx = 0;
    for (let i = 0; i < this.phases.length; i++) {
      if (this.timeOfDay >= this.phases[i].start && this.timeOfDay < this.phases[i].end) {
        phaseIdx = i;
        break;
      }
    }
    this.currentPhase = phaseIdx;
    const phase = this.phases[phaseIdx];
    const t = (this.timeOfDay - phase.start) / (phase.end - phase.start);

    if (this.fog) this.fog.color.setHex(phase.fog);
    if (this.ambientLight) this.ambientLight.intensity = phase.ambient;

    if (this.sunLight) {
      if (phaseIdx === 3) {
        this.sunLight.intensity = 0.05;
        this.sunLight.color.setHex(0x4444FF);
      } else {
        this.sunLight.intensity = 0.3 + 0.7 * Math.sin(t * Math.PI);
        this.sunLight.color.setHex(0xFFFFEE);
        const angle = t * Math.PI - Math.PI / 2;
        this.sunLight.position.set(Math.cos(angle) * 20, Math.sin(angle) * 15 + 5, -10);
      }
    }

    const isNight = phaseIdx === 3;
    const isEvening = phaseIdx === 2;
    const lightOn = isNight || (isEvening && t > 0.5);

    this.streetLights.forEach(light => {
      if (light.material && light.material.emissive) {
        light.material.emissive.setHex(lightOn ? 0xFFD700 : 0x000000);
        light.material.emissiveIntensity = lightOn ? 0.5 : 0;
      }
    });

    this.buildingLights.forEach(light => {
      if (light.material && light.material.emissive) {
        light.material.emissive.setHex(isNight ? 0xFFAA44 : 0x000000);
        light.material.emissiveIntensity = isNight ? 0.3 : 0;
      }
    });

    return phase.name;
  }

  getPhaseName() { return this.phases[this.currentPhase].name; }
}
