const DOM = {
  loader: document.getElementById('loader'),
  music: document.getElementById('bg-music'),
  images: document.images,
  hero: document.querySelector('.hero'),
  scrollIndicator: document.querySelector('.scroll-indicator'),
  parallaxSections: document.querySelectorAll('.parallax'),
  quiz: document.querySelector('.quiz'),
  result: document.querySelector('.result'),
  questionEl: document.getElementById('question'),
  progressEl: document.getElementById('progress'),
  yesBtn: document.getElementById('yesBtn'),
  noBtn: document.getElementById('noBtn'),
  resultText: document.getElementById('result-text')
};

const QUIZ_DATA = [
  { q: "Do I love you more?", yesText: "Yes", noText: "No" },
  { q: "Do I annoy you sometimes?", yesText: "Yes", noText: "No" },
  { q: "Do you love me?", yesText: "Yes", noText: "Yes, obviously" },
  { q: "Will you be my valentine?", yesText: "Yes", noText: "Yes, and let's join Bajrang Dal" }
];

let quizIndex = 0;
let noClickCount = 0;
let autoScrollDone = false;

class LoadingManager {
  constructor() {
    this.loaded = 0;
    this.totalAssets = DOM.images.length + 1;
    this.init();
  }

  init() {
    document.body.style.overflow = 'hidden';
    DOM.result.style.display = 'none';
    
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    window.addEventListener('load', () => {
      window.scrollTo(0, 0);
    });

    this.trackAssets();
    
    setTimeout(() => {
      if (this.loaded < this.totalAssets) {
        // console.log('Force hiding loader after timeout');
        this.hideLoader();
      }
    }, 5000);
  }

  trackAssets() {
    Array.from(DOM.images).forEach(img => {
      if (img.complete) {
        this.assetLoaded();
      } else {
        img.onload = () => this.assetLoaded();
        img.onerror = () => this.assetLoaded();
      }
    });

    let musicLoaded = false;
    
    const musicLoadHandler = () => {
      if (!musicLoaded) {
        musicLoaded = true;
        this.assetLoaded();
      }
    };
    
    DOM.music.oncanplaythrough = musicLoadHandler;
    DOM.music.onerror = musicLoadHandler;
    
    setTimeout(() => {
      if (!musicLoaded) {
        // console.log('Music timeout - proceeding without music');
        musicLoadHandler();
      }
    }, 3000);
  }

  assetLoaded() {
    this.loaded++;
    if (this.loaded >= this.totalAssets) {
      this.hideLoader();
    }
  }

  hideLoader() {
    DOM.loader.style.opacity = '0';
    setTimeout(() => {
      DOM.loader.style.display = 'none';
      document.body.style.overflow = 'auto';
    }, 500);
  }
}

class MusicController {
  constructor() {
    this.isPlaying = false;
    this.init();
  }

  init() {
    document.body.addEventListener('click', () => this.toggle());
  }

  toggle() {
    if (DOM.music.paused) {
      DOM.music.play()
        .then(() => this.isPlaying = true)
        .catch(err => console.log('Music play failed:', err));
    } else {
      DOM.music.pause();
      this.isPlaying = false;
    }
  }
}

class ParallaxEffect {
  constructor() {
    this.init();
  }

  init() {
    window.addEventListener('scroll', () => this.update(), { passive: true });
  }

  update() {
    const scrollY = window.scrollY;
    
    document.querySelectorAll('.parallax-img').forEach(img => {
      const speed = parseFloat(img.dataset.speed) || 0.3;
      const section = img.closest('.parallax');
      
      if (!section) return;


      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      if (scrollY + viewportHeight > sectionTop && scrollY < sectionTop + sectionHeight) {
        const offset = (scrollY - sectionTop) * speed;
        img.style.transform = img.style.transform.replace(/translateY\([^)]*\)/, '') + ` translateY(${offset}px)`;
      }
    });
  }
}

class ScrollManager {
  constructor() {
    this.autoScrollDone = false;
    this.init();
  }

  init() {
    window.addEventListener('wheel', () => this.handleFirstScroll(), { passive: true });
    window.addEventListener('touchmove', () => this.handleFirstScroll(), { passive: true });
  }

  handleFirstScroll() {
    if (this.autoScrollDone) return;
    
    this.autoScrollDone = true;
    
    const firstParallax = document.querySelector('.parallax');
    if (firstParallax) {
      firstParallax.scrollIntoView({ behavior: 'smooth' });
    }


    window.removeEventListener('wheel', this.handleFirstScroll);
    window.removeEventListener('touchmove', this.handleFirstScroll);
  }
}

class QuizManager {
  constructor() {
    this.index = 0;
    this.noClickCount = 0;
    this.init();
  }

  init() {
    this.loadQuestion();
    
    DOM.yesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.answerYes();
    });

    DOM.noBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.answerNo();
    });
  }

  loadQuestion() {
    // console.log('loadQuestion called, index:', this.index);
    if (this.index >= QUIZ_DATA.length) {
      this.showResult();
      return;
    }

    const currentQuestion = QUIZ_DATA[this.index];
    // console.log('Loading question:', currentQuestion.q);
    DOM.questionEl.textContent = currentQuestion.q;
    DOM.progressEl.textContent = `Question ${this.index + 1} of ${QUIZ_DATA.length}`;


    DOM.yesBtn.textContent = currentQuestion.yesText;
    DOM.noBtn.textContent = currentQuestion.noText;

    this.resetButtons();
  }

  resetButtons() {
    // console.log('resetButtons called, index:', this.index);
    // Clean up question 2 event listeners if they exist
    if (this.yesBtnListeners) {
      // console.log('Cleaning up question 2 listeners');
      document.removeEventListener('mousemove', this.yesBtnListeners.handleMouseMove);
      document.removeEventListener('touchmove', this.yesBtnListeners.handleTouchMove);
      this.yesBtnListeners = null;
    }
    

    DOM.yesBtn.style.cssText = '';
    DOM.noBtn.style.cssText = '';
    

    this.noClickCount = 0;
    
    if (this.index === 1) {
      DOM.yesBtn.disabled = true;
      this.setupQuestion2Behavior();
    } else {
      DOM.yesBtn.disabled = false;
    }
  }

  answerYes() {
    // console.log('answerYes called, current index:', this.index);
    this.index++;
    // console.log('after increment, index is now:', this.index);
    this.loadQuestion();
  }

  setupQuestion2Behavior() {
    // console.log('setupQuestion2Behavior called');
    DOM.yesBtn.style.position = 'fixed';
    DOM.yesBtn.style.transition = 'all 0.3s ease';
    DOM.yesBtn.style.zIndex = '1000';
    
    let isRunning = false;
    
    const runAway = (clientX, clientY) => {
      if (isRunning) return;
      isRunning = true;
      
      const btnRect = DOM.yesBtn.getBoundingClientRect();
      const btnCenterX = btnRect.left + btnRect.width / 2;
      const btnCenterY = btnRect.top + btnRect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(clientX - btnCenterX, 2) + 
        Math.pow(clientY - btnCenterY, 2)
      );
      
      if (distance < 150) {
        // console.log('Button running away! Distance:', distance);

        const angle = Math.atan2(btnCenterY - clientY, btnCenterX - clientX);
        const moveDistance = 150;
        
        let newX = btnCenterX + Math.cos(angle) * moveDistance;
        let newY = btnCenterY + Math.sin(angle) * moveDistance;

        const margin = 60;
        newX = Math.max(margin, Math.min(window.innerWidth - margin, newX));
        newY = Math.max(margin, Math.min(window.innerHeight - margin, newY));
        
        DOM.yesBtn.style.left = `${newX}px`;
        DOM.yesBtn.style.top = `${newY}px`;
        DOM.yesBtn.style.transform = 'translate(-50%, -50%)';
      }
      
      setTimeout(() => {
        isRunning = false;
      }, 300);
    };
    
    const handleMouseMove = (e) => {
      runAway(e.clientX, e.clientY);
    };
    
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        runAway(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    

    DOM.yesBtn.style.left = '50%';
    DOM.yesBtn.style.top = '50%';
    DOM.yesBtn.style.transform = 'translate(-50%, -50%)';
    
    // console.log('Question 2 behavior setup complete');
    

    this.yesBtnListeners = { handleMouseMove, handleTouchMove };
  }

  answerNo() {
    // console.log('answerNo called, current index:', this.index, 'noClickCount:', this.noClickCount);
    if (this.index === 0) {
      this.noClickCount++;
      console.log('Question 0, noClickCount now:', this.noClickCount);

      const messages = [
        "Try Again",
        "No, Try harder", 
        "Nuh-uh",
        "Okay now I won't cheat promise"
      ];

      if (this.noClickCount <= messages.length) {
        DOM.questionEl.textContent = messages[this.noClickCount - 1];
      }


      const scale = Math.max(0, 1 - this.noClickCount * 0.25);
      DOM.noBtn.style.transform = `scale(${scale})`;
      DOM.noBtn.style.transition = 'transform 0.3s ease';

      if (this.noClickCount >= 3) {
        DOM.noBtn.style.opacity = '0';
        DOM.noBtn.style.pointerEvents = 'none';

        setTimeout(() => {
          DOM.questionEl.textContent = "Okay now I won't cheat promise";
        }, 300);
      }
      return;
    }

    if (this.index === 1) {
      this.answerYes();
      return;
    }


    if (this.index === 2) {
      this.answerYes();
      return;
    }

    if (this.index === 3) {
      this.answerYes();
      return;
    }
  }

  showResult() {
    DOM.quiz.style.display = 'none';
    DOM.hero.style.display = 'none';
    DOM.scrollIndicator.style.display = 'none';
    DOM.parallaxSections.forEach(section => {
      section.style.display = 'none';
    });


    DOM.result.style.display = 'flex';
    DOM.resultText.textContent = "Yay, all correct answers!";


    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LoadingManager();
  new MusicController();
  new ParallaxEffect();
  new ScrollManager();
  new QuizManager();
});