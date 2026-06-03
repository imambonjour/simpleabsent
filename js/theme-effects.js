document.addEventListener('DOMContentLoaded', () => {
  // Pixel particle container - retro digital effect
  const container = document.createElement('div');
  container.className = 'pixel-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '0';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  // CSS for pixel particles
  const style = document.createElement('style');
  style.textContent = `
    .pixel {
      position: absolute;
      width: 4px;
      height: 4px;
      image-rendering: pixelated;
      shape-rendering: crispEdges;
      opacity: 0.6;
      pointer-events: none;
      animation: float-pixel linear infinite;
    }
    @keyframes float-pixel {
      0% {
        transform: translateY(100vh) scale(1);
        opacity: 0;
      }
      10% {
        opacity: 0.6;
      }
      90% {
        opacity: 0.6;
      }
      100% {
        transform: translateY(-20px) scale(1);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  const colors = [
    '#5FA762', // Pixel green
    '#4A90C8', // Pixel blue
    '#E8953C', // Pixel orange
    '#D14949', // Pixel red
  ];

  function spawnPixel() {
    if (document.hidden) return;
    if (container.childElementCount > 30) return;

    const pixel = document.createElement('div');
    pixel.className = 'pixel';
    
    const size = Math.random() > 0.7 ? 8 : 4; // Some bigger pixels
    const duration = Math.random() * 10 + 8;
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    pixel.style.width = `${size}px`;
    pixel.style.height = `${size}px`;
    pixel.style.backgroundColor = color;
    pixel.style.left = `${left}vw`;
    pixel.style.bottom = '-10px';
    pixel.style.animationDuration = `${duration}s`;
    pixel.style.animationDelay = `-${delay}s`;
    
    container.appendChild(pixel);

    setTimeout(() => {
      pixel.remove();
    }, duration * 1000);
  }

  for (let i = 0; i < 20; i++) {
    spawnPixel();
  }

  setInterval(spawnPixel, 600);
});
