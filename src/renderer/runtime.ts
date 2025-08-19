// Runtime JavaScript
// Provides navigation, counter updates, and fullscreen support for presentations

/**
 * Task 4: Embed runtime JavaScript
 * Provides navigation, counter updates, and fullscreen support
 */
export function getRuntimeJS(): string {
  return `
(function() {
  'use strict';
  
  // Navigation state and methods
  const navigation = {
    current: 0,
    total: 0,
    
    init() {
      this.total = document.querySelectorAll('.curtains-slide').length;
      this.updateCounter();
      this.setupEventListeners();
      console.log(\`Curtains initialized: \${this.total} slides\`);
    },
    
    goToSlide(index) {
      // Implement wrap-around navigation
      let newIndex = index;
      if (newIndex >= this.total) {
        newIndex = 0; // Wrap to first slide
      } else if (newIndex < 0) {
        newIndex = this.total - 1; // Wrap to last slide
      }
      
      if (newIndex === this.current) return;
      
      this.current = newIndex;
      const stage = document.querySelector('.curtains-stage');
      if (stage) {
        stage.style.transform = \`translateX(-\${this.current * 100}%)\`;
      }
      this.updateCounter();
      
      // Announce slide change for screen readers
      this.announceSlideChange();
    },
    
    nextSlide() {
      this.goToSlide(this.current + 1);
    },
    
    prevSlide() {
      this.goToSlide(this.current - 1);
    },
    
    firstSlide() {
      this.goToSlide(0);
    },
    
    lastSlide() {
      this.goToSlide(this.total - 1);
    },
    
    updateCounter() {
      const counter = document.querySelector('.curtains-counter');
      if (counter) {
        counter.textContent = \`\${this.current + 1}/\${this.total}\`;
      }
      
      // Update document title
      document.title = \`Slide \${this.current + 1} of \${this.total} - Presentation\`;
    },
    
    announceSlideChange() {
      // Create or update live region for screen reader announcements
      let announcer = document.getElementById('slide-announcer');
      if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'slide-announcer';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.position = 'absolute';
        announcer.style.left = '-10000px';
        announcer.style.width = '1px';
        announcer.style.height = '1px';
        announcer.style.overflow = 'hidden';
        document.body.appendChild(announcer);
      }
      
      announcer.textContent = \`Slide \${this.current + 1} of \${this.total}\`;
    },
    
    setupEventListeners() {
      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        // Prevent default for navigation keys
        const navKeys = ['ArrowRight', 'ArrowLeft', 'Space', 'Home', 'End', 'f', 'F'];
        if (navKeys.includes(e.key)) {
          e.preventDefault();
        }
        
        switch(e.key) {
          case 'ArrowRight':
          case ' ': // Spacebar
            this.nextSlide();
            break;
          case 'ArrowLeft':
            this.prevSlide();
            break;
          case 'Home':
            this.firstSlide();
            break;
          case 'End':
            this.lastSlide();
            break;
          case 'f':
          case 'F':
            this.toggleFullscreen();
            break;
        }
      });
      
      // Click navigation (right side = next, left side = previous)
      document.addEventListener('click', (e) => {
        // Don't interfere with clickable elements
        if (e.target.closest('a, button, input, textarea, select')) {
          return;
        }
        
        const stageWrapper = e.target.closest('.curtains-stage-wrapper');
        if (!stageWrapper) return;
        
        const rect = stageWrapper.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const centerX = rect.width / 2;
        
        if (clickX > centerX) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
      });
      
      // Touch/swipe navigation
      let touchStartX = null;
      let touchStartY = null;
      
      document.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }, { passive: true });
      
      document.addEventListener('touchend', (e) => {
        if (!touchStartX || !touchStartY) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        // Only handle horizontal swipes (avoid interfering with scrolling)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          if (deltaX > 0) {
            this.prevSlide();
          } else {
            this.nextSlide();
          }
        }
        
        touchStartX = null;
        touchStartY = null;
      }, { passive: true });
      
      // Handle window resize
      window.addEventListener('resize', () => {
        // Force repositioning to current slide after resize
        setTimeout(() => {
          const stage = document.querySelector('.curtains-stage');
          if (stage) {
            stage.style.transform = \`translateX(-\${this.current * 100}%)\`;
          }
        }, 100);
      });
    },
    
    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn('Failed to enter fullscreen:', err);
        });
      } else {
        document.exitFullscreen().catch(err => {
          console.warn('Failed to exit fullscreen:', err);
        });
      }
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => navigation.init());
  } else {
    navigation.init();
  }
  
  // Export navigation for debugging/testing
  window.curtainsNavigation = navigation;
})();
  `.trim()
}