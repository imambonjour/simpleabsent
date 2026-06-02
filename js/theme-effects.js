document.addEventListener('DOMContentLoaded', () => {
  // Create leaf container
  const container = document.createElement('div');
  container.className = 'leaf-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '0';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  // CSS for leaf falling
  const style = document.createElement('style');
  style.textContent = `
    .leaf {
      position: absolute;
      top: -20px;
      border-radius: 0 50% 0 50%;
      opacity: 0.8;
      pointer-events: none;
      animation: fall linear infinite;
    }
    @keyframes fall {
      0% {
        transform: translateY(-20px) rotate(0deg) translateX(0);
        opacity: 0;
      }
      10% {
        opacity: 0.8;
      }
      90% {
        opacity: 0.8;
      }
      100% {
        transform: translateY(105vh) rotate(360deg) translateX(80px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  const colors = [
    '#A3C9A8', // Sage green soft
    '#70A9A1', // Watercolor teal
    '#FFCAD4', // Pink petal soft
    '#F4A261', // Soft orange
  ];

  function spawnLeaf() {
    if (document.hidden) return; // Don't run when tab is inactive
    if (container.childElementCount > 25) return; // Limit total elements for performance

    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    
    // Random sizes, speeds and positions
    const size = Math.random() * 12 + 8; // 8px to 20px
    const duration = Math.random() * 8 + 6; // 6s to 14s
    const left = Math.random() * 100; // 0% to 100%
    const delay = Math.random() * 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    leaf.style.width = `${size}px`;
    leaf.style.height = `${size * 1.5}px`;
    leaf.style.backgroundColor = color;
    leaf.style.left = `${left}vw`;
    leaf.style.animationDuration = `${duration}s`;
    leaf.style.animationDelay = `-${delay}s`; // Negative delay so they start immediately distributed
    
    // Soft hand-drawn shape variation
    if (Math.random() > 0.5) {
      leaf.style.borderRadius = '50% 0 50% 0';
    }

    container.appendChild(leaf);

    // Remove when animation finishes
    setTimeout(() => {
      leaf.remove();
    }, duration * 1000);
  }

  // Initial batch
  for (let i = 0; i < 15; i++) {
    spawnLeaf();
  }

  // Continuous spawning
  setInterval(spawnLeaf, 800);
});
