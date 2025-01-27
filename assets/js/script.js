document.addEventListener('DOMContentLoaded', function() {
    // Add staggered animation to links
    const links = document.querySelectorAll('.link');
    links.forEach((link, index) => {
        link.style.animationDelay = `${index * 0.1}s`;
    });

    const userName = document.getElementById('userName');
    let mouseOverTimeout;
    
    function checkAchievement(name) {
        let achievements = JSON.parse(localStorage.getItem('achievements') || '{}');
        if (!achievements[name]) {
            achievements[name] = true;
            localStorage.setItem('achievements', JSON.stringify(achievements));
            showAchievementPopup(name);
            checkAllAchievements();
        }
        return achievements[name];
    }

    function showAchievementPopup(name) {
        const popup = document.getElementById('achievementPopup');
        const text = document.getElementById('achievementText');
        
        // Clear existing content
        text.innerHTML = name;
        
        // Add trophy icon
        const icon = document.createElement('i');
        icon.className = 'fas fa-trophy';
        
        // Remove existing icon if any
        const existingIcon = popup.querySelector('i');
        if (existingIcon) {
            popup.removeChild(existingIcon);
        }
        
        // Add new icon at the start
        popup.insertBefore(icon, popup.firstChild);
        
        popup.classList.add('show');
        
        // Remove the popup after animation
        setTimeout(() => {
            popup.classList.remove('show');
        }, 5000);
    }

    function checkAllAchievements() {
        const achievements = JSON.parse(localStorage.getItem('achievements') || '{}');
        const allAchievements = ['Face Off', 'Check My Name', 'Night and Day'];
        const completed = allAchievements.every(achievement => achievements[achievement]);
        
        const winner = document.getElementById('winner');
        const resetButton = document.querySelector('.reset-achievements');
        
        if (completed) {
            winner.style.display = 'block';
            resetButton.style.display = 'inline-block';
        } else {
            winner.style.display = 'none';
            resetButton.style.display = 'none';
        }
    }

    if (userName) {
        let hoverStartTime;
        let achievementGranted = false;

        userName.addEventListener('mouseover', function() {
            userName.textContent = 'Alive?';
            hoverStartTime = Date.now();
            
            mouseOverTimeout = setTimeout(() => {
                if (!achievementGranted && Date.now() - hoverStartTime >= 4000) {
                    checkAchievement('Check My Name');
                    achievementGranted = true;
                }
                window.location.href = "https://alive.lukeharper.co.uk";
            }, 5000);
        });

        userName.addEventListener('mouseout', function() {
            userName.textContent = 'Luke Harper';
            clearTimeout(mouseOverTimeout);
            achievementGranted = false;
        });
    }

    window.mostrar = function(e) {
        const userPhoto = document.getElementById('userPhoto');
        let currentGreyscale = parseFloat(userPhoto.style.filter.match(/grayscale\((\d+)%\)/)?.[1] || 0);

        if (e.classList.contains("fa-moon")) {
            e.classList.remove("fa-moon");
            e.classList.add("fa-sun");
            e.style.color = "rgb(225, 225, 0)";
            document.body.style.background = 'rgb(10, 10, 10)';
            document.body.classList.add('dark-mode');
            document.querySelector('#userName').style.color = '#fff';

            let links = document.querySelectorAll('.link');
            for (let i = 0; i < links.length; i++) {
                links[i].style.filter = 'grayscale(100%)';
            }

            let circulos = document.querySelectorAll('.circulo');
            for (let i = 0; i < circulos.length; i++) {
                circulos[i].style.filter = 'grayscale(100%)';
            }

        } else {
            e.classList.remove("fa-sun");
            e.classList.add("fa-moon");
            e.style.color = "#585858";
            document.body.style.background = 'rgb(243, 242, 242)';
            document.body.classList.remove('dark-mode');
            document.querySelector('#userName').style.color = 'rgb(99, 99, 99)';

            let links = document.querySelectorAll('.link');
            for (let i = 0; i < links.length; i++) {
                links[i].style.filter = 'grayscale(0%)';
            }

            let circulos = document.querySelectorAll('.circulo');
            for (let i = 0; i < circulos.length; i++) {
                circulos[i].style.filter = 'grayscale(0%)';
            }
        }

        currentGreyscale = Math.min(currentGreyscale + 5, 100);
        userPhoto.style.filter = `grayscale(${currentGreyscale}%)`;

        if (currentGreyscale >= 100) {
            checkAchievement('Night and Day');
        }
    }

    // Check system dark mode preference and set initial state
    const darkModeButton = document.querySelector('.js-night-mode');
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        mostrar(darkModeButton);
    }

    // Add listener for system dark mode changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (e.matches !== document.body.classList.contains('dark-mode')) {
            mostrar(darkModeButton);
        }
    });

    const userPhoto = document.getElementById('userPhoto');
    let clickCount = 0;
    const PIANO_MODE_CLICKS = 99999;
    const NORMAL_MODE_CLICKS = 10;
    
    // Single consolidated click handler for userPhoto
    userPhoto.onclick = function(e) {
        // Always prevent default to handle our own logic
        e.preventDefault();
        e.stopPropagation();

        // Handle piano mode
        if (document.body.classList.contains('piano-mode')) {
            // Handle instrument switching
            currentInstrument = (currentInstrument + 1) % instruments.length;
            clickCount = 0; // Reset counter when instrument changes
            
            // Remove any previous instrument change animation
            this.classList.remove('instrument-change');
            void this.offsetWidth;
            this.classList.add('instrument-change');
            setTimeout(() => {
                if (document.body.classList.contains('piano-mode')) {
                    this.classList.remove('instrument-change');
                }
            }, 500);
            
            // Show instrument name and play demo note
            showInstrumentIndicator();
            playNote(440, 0.5);
        } else {
            // Handle normal mode clicks
            clickCount++;
            if (clickCount === NORMAL_MODE_CLICKS) {
                checkAchievement('Face Off');
                
                // Remove any existing animations
                this.className = '';
                void this.offsetWidth;
                this.classList.add('spin-grow');
                
                // Redirect to OnlyFans after animation
                setTimeout(() => {
                    window.location.href = "https://onlyfans.lukeharper.co.uk";
                }, 5000);
                
                clickCount = 0;
            }
        }
    };

    const achievements = JSON.parse(localStorage.getItem('achievements') || '{}');
    
    if (achievements['Face Off']) {
        document.getElementById('faceOff').classList.add('unlocked');
    }
    if (achievements['Check My Name']) {
        document.getElementById('checkName').classList.add('unlocked');
    }
    if (achievements['Night and Day']) {
        document.getElementById('nightDay').classList.add('unlocked');
    }
    
    checkAllAchievements();

    // View Toggle
    const viewToggle = document.querySelector('.view-toggle');
    const linksContainer = document.querySelector('#links');
    
    if (viewToggle) {
        viewToggle.addEventListener('click', () => {
            linksContainer.classList.toggle('links-grid');
            if (linksContainer.classList.contains('links-grid')) {
                linksContainer.classList.remove('list-view');
                viewToggle.querySelector('i').classList.remove('fa-list');
                viewToggle.querySelector('i').classList.add('fa-grip-horizontal');
            } else {
                linksContainer.classList.add('list-view');
                viewToggle.querySelector('i').classList.remove('fa-grip-horizontal');
                viewToggle.querySelector('i').classList.add('fa-list');
            }
        });
    }

    // Share Functionality
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const link = btn.closest('.link');
            const url = link.href;
            const title = link.querySelector('span').textContent;

            try {
                if (navigator.share) {
                    await navigator.share({
                        title: 'Check out this link!',
                        text: `Check out ${title} on Luke Harper's links page`,
                        url: url
                    });
                } else {
                    await navigator.clipboard.writeText(url);
                    showToast('Link copied to clipboard!');
                }
            } catch (err) {
                console.error('Error sharing:', err);
            }
        });
    });

    // Page Share Button
    document.querySelector('.page-share').addEventListener('click', async () => {
        const shareData = {
            title: 'Luke Harper - Links',
            text: 'Check out Luke Harper\'s social links!',
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback for browsers that don't support Web Share API
                await navigator.clipboard.writeText(window.location.href);
                showToast('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    });

    // Toast notification function
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Trigger reflow to enable transition
        toast.offsetHeight;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Piano Mode Constants and Setup
    const NOTES = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5'];
    const NOTE_FREQUENCIES = {
        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
        'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
        'A#4': 466.16, 'B4': 493.88, 'C5': 523.25
    };
    
    // Keyboard mapping for number keys to notes
    const KEY_TO_NOTE = {
        '1': 'C4',
        '2': 'D4',
        '3': 'E4',
        '4': 'F4',
        '5': 'G4',
        '6': 'A4',
        '7': 'B4',
        '8': 'C5',
        // Sharp/flat notes
        'Shift+1': 'C#4',
        'Shift+2': 'D#4',
        'Shift+4': 'F#4',
        'Shift+5': 'G#4',
        'Shift+6': 'A#4'
    };

    let audioContext = null;
    let currentInstrument = 0;
    let isSustainEnabled = false;
    const instruments = [
        { type: 'sine', name: 'Piano' },
        { type: 'square', name: 'Synth' },
        { type: 'triangle', name: 'Music Box' },
        { type: 'sawtooth', name: 'Electric Guitar' }
    ];

    // Function to update sustain state and UI
    function updateSustainState(enabled) {
        isSustainEnabled = enabled;
        const sustainToggle = document.querySelector('.sustain-toggle');
        if (sustainToggle) {
            if (enabled) {
                sustainToggle.classList.add('active');
            } else {
                sustainToggle.classList.remove('active');
            }
        }
    }

    // Add sustain toggle handler
    const sustainToggle = document.querySelector('.sustain-toggle');
    if (sustainToggle) {
        sustainToggle.addEventListener('click', () => {
            updateSustainState(!isSustainEnabled);
            showToast(`Sustain ${isSustainEnabled ? 'enabled' : 'disabled'}`);
        });
    }

    function createAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    function showInstrumentIndicator() {
        let indicator = document.querySelector('.instrument-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'instrument-indicator';
            document.querySelector('#userPhoto').parentNode.appendChild(indicator);
        }
        indicator.textContent = instruments[currentInstrument].name;
        indicator.classList.add('show');
        setTimeout(() => indicator.classList.remove('show'), 2000);
    }

    function playNote(frequency, duration = 0.4) {
        try {
            const ctx = createAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.type = instruments[currentInstrument].type;
            oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
            
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

            // Adjust release based on sustain
            const releaseDuration = isSustainEnabled ? 2.0 : duration;
            const releaseStart = ctx.currentTime + (isSustainEnabled ? duration * 2 : duration);
            
            // Smoother attack
            gainNode.gain.setTargetAtTime(0.3, ctx.currentTime, 0.01);
            
            // Longer, smoother release when sustain is enabled
            gainNode.gain.setTargetAtTime(0.01, releaseStart, releaseDuration * 0.3);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration + releaseDuration);
        } catch (error) {
            console.error('Error playing note:', error);
        }
    }

    // Piano Mode Toggle
    const pianoModeToggle = document.querySelector('.piano-mode-toggle');
    if (pianoModeToggle) {
        pianoModeToggle.addEventListener('click', () => {
            clickCount = 0;  // Reset counter when switching modes
            document.body.classList.toggle('piano-mode');
            const userPhoto = document.getElementById('userPhoto');
            
            // Reset any existing transform and transition when toggling piano mode
            if (!document.body.classList.contains('piano-mode')) {
                userPhoto.style.transform = '';
                userPhoto.style.transition = '';
                // Reset sustain when exiting piano mode
                updateSustainState(false);
                return;
            }
            
            // Show initial instrument
            showInstrumentIndicator();
            
            // Assign notes to links if entering piano mode
            const links = document.querySelectorAll('.link');
            links.forEach((link, index) => {
                const note = NOTES[index % NOTES.length];
                link.setAttribute('data-note', note);
                
                // Add click handler for piano sounds
                link.addEventListener('click', (e) => {
                    if (document.body.classList.contains('piano-mode')) {
                        e.preventDefault();
                        const frequency = NOTE_FREQUENCIES[note];
                        playNote(frequency);
                        
                        // Add a small delay before following the link
                        setTimeout(() => {
                            window.location.href = link.href;
                        }, 200);
                    }
                });
            });
            
            // Play a random melody when toggling on
            const allNotes = Object.values(NOTE_FREQUENCIES);
            const melodyLength = 8;
            const randomMelody = Array.from({ length: melodyLength }, () => 
                allNotes[Math.floor(Math.random() * allNotes.length)]
            );

            randomMelody.forEach((note, index) => {
                setTimeout(() => {
                    playNote(note, 0.2);
                    // Rotate profile picture clockwise for even indices, counter-clockwise for odd
                    userPhoto.style.transition = 'transform 0.2s ease';
                    userPhoto.style.transform = `rotate(${index % 2 === 0 ? 15 : -15}deg)`;
                    setTimeout(() => {
                        userPhoto.style.transform = 'rotate(0deg)';
                    }, 150);
                }, index * 120);
            });
        });
    }

    // Add touch tracking variables
    let lastTouchedLink = null;
    let isGliding = false;

    // Function to get link element from touch position
    function getLinkFromTouch(touch) {
        const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
        return elements.find(el => el.classList.contains('link'));
    }

    // Function to handle link touch/glide
    function handleLinkTouch(link) {
        if (!link || link === lastTouchedLink) return;
        
        lastTouchedLink = link;
        const melodicNotes = [
            NOTE_FREQUENCIES['F4'],
            NOTE_FREQUENCIES['A4'],
            NOTE_FREQUENCIES['F4'],
            NOTE_FREQUENCIES['A4'],
            NOTE_FREQUENCIES['F4'],
            NOTE_FREQUENCIES['A4'],
            NOTE_FREQUENCIES['C5'],
            NOTE_FREQUENCIES['A4'],
            NOTE_FREQUENCIES['F4'],
            NOTE_FREQUENCIES['A4'],
            NOTE_FREQUENCIES['F4'],
            NOTE_FREQUENCIES['D4']
        ];
        
        const index = Array.from(document.querySelectorAll('.link')).indexOf(link);
        const note = melodicNotes[index % melodicNotes.length];
        playNote(note, 0.2);
        
        // Visual feedback
        link.style.transform = 'scale(1.05)';
        link.style.opacity = '0.8';
        
        setTimeout(() => {
            link.style.transform = '';
            link.style.opacity = '';
        }, 200);
    }

    // Add touch event handlers to links
    document.querySelectorAll('.link').forEach((link, index) => {
        // Keep existing mouseenter event for desktop
        link.addEventListener('mouseenter', () => {
            if (document.body.classList.contains('piano-mode')) {
                const melodicNotes = [
                    NOTE_FREQUENCIES['F4'],
                    NOTE_FREQUENCIES['A4'],
                    NOTE_FREQUENCIES['F4'],
                    NOTE_FREQUENCIES['A4'],
                    NOTE_FREQUENCIES['F4'],
                    NOTE_FREQUENCIES['A4'],
                    NOTE_FREQUENCIES['C5'],
                    NOTE_FREQUENCIES['A4'],
                    NOTE_FREQUENCIES['F4'],
                    NOTE_FREQUENCIES['A4'],
                    NOTE_FREQUENCIES['F4'],
                    NOTE_FREQUENCIES['D4']
                ];
                
                const note = melodicNotes[index % melodicNotes.length];
                playNote(note, 0.2);
                
                // Visual feedback
                link.style.transform = 'scale(1.05)';
                link.style.opacity = '0.8';
                
                setTimeout(() => {
                    if (document.body.classList.contains('piano-mode')) {
                        link.style.transform = '';
                        link.style.opacity = '';
                    }
                }, 200);
            }
        });

        // Touch event handlers
        link.addEventListener('touchstart', (e) => {
            if (document.body.classList.contains('piano-mode')) {
                e.preventDefault();
                e.stopPropagation();
                isGliding = true;
                handleLinkTouch(link);
            }
        });

        link.addEventListener('touchend', (e) => {
            if (document.body.classList.contains('piano-mode')) {
                e.preventDefault();
                e.stopPropagation();
                isGliding = false;
                lastTouchedLink = null;
            }
        });
    });

    // Add document-level touch move handler for gliding
    document.addEventListener('touchmove', (e) => {
        if (!document.body.classList.contains('piano-mode') || !isGliding) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const touch = e.touches[0];
        const link = getLinkFromTouch(touch);
        handleLinkTouch(link);
    }, { passive: false });

    // Add keyboard support for piano mode
    document.addEventListener('keydown', (e) => {
        if (!document.body.classList.contains('piano-mode')) return;
        
        // Check if it's a number key (1-8)
        const key = e.key;
        if (!/^[1-8]$/.test(key)) return;
        
        // Prevent default behavior (like page scrolling)
        e.preventDefault();
        
        // Determine which note to play based on if shift is held
        const noteKey = e.shiftKey ? `Shift+${key}` : key;
        const noteName = KEY_TO_NOTE[noteKey];
        
        if (noteName) {
            // Play the note
            const frequency = NOTE_FREQUENCIES[noteName];
            playNote(frequency);
            
            // Highlight the corresponding link if it exists
            const links = document.querySelectorAll('.link');
            links.forEach(link => {
                if (link.getAttribute('data-note') === noteName) {
                    link.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        link.style.transform = '';
                    }, 200);
                }
            });
            
            // Show a toast with the note name
            showToast(`Playing note: ${noteName}`);
        }
    });
});

window.resetAchievements = function() {
    if (confirm('Are you sure you want to reset all achievements?')) {
        localStorage.removeItem('achievements');
        document.querySelectorAll('.achievement').forEach(achievement => {
            achievement.classList.remove('unlocked');
        });
        document.getElementById('winner').style.display = 'none';
        document.querySelector('.reset-achievements').style.display = 'none';
    }
}