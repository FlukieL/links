const PIANO_SCRIPT_URL = 'assets/js/piano.js';
let pianoScriptPromise = null;

function loadExternalScript(url) {
    return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[data-src="${url}"]`);
        if (existingScript) {
            if (existingScript.dataset.loaded === 'true') {
                resolve();
                return;
            }
            existingScript.addEventListener('load', resolve, { once: true });
            existingScript.addEventListener('error', reject, { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.dataset.src = url;
        script.addEventListener('load', () => {
            script.dataset.loaded = 'true';
            resolve();
        }, { once: true });
        script.addEventListener('error', reject, { once: true });
        document.head.appendChild(script);
    });
}

function ensurePianoReady() {
    if (typeof window.playPianoNote === 'function') {
        return Promise.resolve();
    }
    if (!pianoScriptPromise) {
        pianoScriptPromise = loadExternalScript(PIANO_SCRIPT_URL).catch((error) => {
            console.error('Failed to load piano script:', error);
            pianoScriptPromise = null;
            throw error;
        });
    }
    return pianoScriptPromise;
}

function safePlayPianoNote(note, volume) {
    if (typeof window.playPianoNote === 'function') {
        return window.playPianoNote(note, volume);
    }
    return ensurePianoReady().then(() => {
        if (typeof window.playPianoNote === 'function') {
            return window.playPianoNote(note, volume);
        }
        return null;
    }).catch(() => null);
}

function safeUpdateSustain(isEnabled) {
    if (typeof window.updateSustain === 'function') {
        window.updateSustain(isEnabled);
        return;
    }
    ensurePianoReady().then(() => {
        if (typeof window.updateSustain === 'function') {
            window.updateSustain(isEnabled);
        }
    }).catch(() => {});
}

function scheduleIdle(task) {
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(task, { timeout: 250 });
    } else {
        window.setTimeout(task, 0);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Ensure body is visible immediately
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
    
    const links = document.querySelectorAll('.link');
    // Preload and prepare UI sounds (place WAV files at assets/sounds/)
    const sounds = {
        nav: new Audio('assets/sounds/f7navigation.wav'),
        achieve: new Audio('assets/sounds/f7achieve.wav'),
        confirm: new Audio('assets/sounds/f7confirm.wav'),
        snip: new Audio('assets/sounds/f7snip.wav')
    };
    // sensible default volumes
    Object.values(sounds).forEach(s => { if (s) { s.preload = 'auto'; s.volume = 0.7; }});

    // Helper to play UI sounds unless piano mode is active
    function playUISound(sound) {
        try {
            if (!sound) return;
            if (document.body.classList.contains('piano-mode')) return;
            sound.currentTime = 0;
            sound.play();
        } catch (e) {}
    }

    requestAnimationFrame(() => {
        links.forEach((link, index) => {
            link.style.animationDelay = `${index * 0.1}s`;
            link.classList.add('intro-animation');
        });

        const headerButtons = document.querySelectorAll('.links-header button');
        headerButtons.forEach((button, index) => {
            button.style.opacity = '0';
            button.style.animation = `buttonEntrance 0.5s ease-out ${index * 150 + 300}ms forwards`;
        });

        // Attach sound handlers to header buttons (snip)
        headerButtons.forEach((button) => {
            button.addEventListener('click', () => {
                // don't play snip for the piano-mode toggle or night-mode button
                if (button.classList.contains('piano-mode-toggle') || button.classList.contains('js-night-mode')) return;
                playUISound(sounds.snip);
            });
        });
    });

    const userName = document.getElementById('userName');
    let mouseOverTimeout;
    const achievementsToggle = document.querySelector('.js-achievements-toggle');
    if (achievementsToggle) {
        achievementsToggle.addEventListener('click', () => toggleAchievements(achievementsToggle));
    }
    const resetAchievementsButton = document.querySelector('.js-reset-achievements');
    if (resetAchievementsButton) {
        resetAchievementsButton.addEventListener('click', window.resetAchievements);
    }

    // Add confirm sound to footer links
    const footerLinks = document.querySelectorAll('.footer-link');
    footerLinks.forEach((link) => {
        link.addEventListener('click', () => {
            playUISound(sounds.confirm);
        });
    });

    // Add touch hint handling for achievements on mobile
    const achievementElements = document.querySelectorAll('.achievement');
    achievementElements.forEach((achievement) => {
        achievement.addEventListener('touchstart', () => {
            achievement.classList.add('show-hint');
        });
        achievement.addEventListener('touchend', () => {
            setTimeout(() => {
                achievement.classList.remove('show-hint');
            }, 2000);
        });
    });
    
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
        playUISound(sounds.achieve);
        
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

    // Play navigation/confirm sounds for links
    // Setup finger pointer and link sounds
    (function setupFinger() {
        const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        let lastNavTime = 0;
        const navThrottle = 120;

        // Create fixed-size finger pointer (44px)
        const finger = document.createElement('div');
        finger.id = 'nav-finger';
        finger.style.position = 'fixed';
        finger.style.width = '44px';
        finger.style.height = '44px';
        finger.style.opacity = '0';
        finger.style.zIndex = '9999';
        finger.style.transition = 'top 100ms ease, left 100ms ease, opacity 100ms ease';
        finger.style.pointerEvents = 'none';

        const img = document.createElement('img');
        img.src = 'assets/images/F7Finger.png';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        finger.appendChild(img);
        document.body.appendChild(finger);

        // Track which link the finger is currently positioned on
        let activeLinkForFinger = null;

        function showFingerAt(linkEl) {
            try {
                const rect = linkEl.getBoundingClientRect();
                // Position overlay on the left side of the link, centered vertically
                const top = rect.top + (rect.height / 2) - 22; // 22 = half of 44px
                const left = rect.left + 4; // 4px inside the link from left edge

                finger.style.top = `${Math.max(0, top)}px`;
                finger.style.left = `${Math.max(-44, left)}px`;
                finger.style.opacity = '1';
                activeLinkForFinger = linkEl;
            } catch (e) {}
        }

        function hideFinger() {
            finger.style.opacity = '0';
            activeLinkForFinger = null;
        }

        // Update finger position on scroll to keep it locked to the active link
        window.addEventListener('scroll', () => {
            if (activeLinkForFinger) {
                showFingerAt(activeLinkForFinger);
            }
        });

        // Track armed state for two-tap on touch devices
        const armedLinks = new WeakMap();

        links.forEach((link) => {
            armedLinks.set(link, false);

            // Desktop: hover shows finger and plays nav sound
            link.addEventListener('mouseenter', () => {
                const now = Date.now();
                if (now - lastNavTime > navThrottle) {
                    playUISound(sounds.nav);
                    lastNavTime = now;
                }
                showFingerAt(link);
            });

            link.addEventListener('mouseleave', () => {
                hideFinger();
            });

            // Desktop click: play confirm
            if (!isTouchDevice) {
                link.addEventListener('click', () => {
                    playUISound(sounds.confirm);
                });
            }

            // Touch: two-tap behavior using touchend event
            if (isTouchDevice) {
                link.addEventListener('touchend', (ev) => {
                    const isArmed = armedLinks.get(link);

                    if (isArmed) {
                        // Second tap: play confirm and navigate in new tab
                        ev.preventDefault();
                        ev.stopPropagation();
                        playUISound(sounds.confirm);
                        armedLinks.set(link, false);
                        // open in new tab like target="_blank"
                        const href = link.getAttribute('href');
                        if (href) {
                            window.open(href, '_blank');
                        }
                        return;
                    }

                    // First tap: prevent navigation, show finger, play nav sound
                    ev.preventDefault();
                    ev.stopPropagation();
                    playUISound(sounds.nav);
                    showFingerAt(link);
                    armedLinks.set(link, true);

                    // Clear armed state after timeout
                    setTimeout(() => {
                        armedLinks.set(link, false);
                    }, 1500);
                });
            }
        });
    })();

    // Night mode melody function
    function playNightModeMelody() {
        if (!document.body.classList.contains('piano-mode')) return;
        
        const melody = [
            { note: 'C4', duration: 0.2 },  // eighth note
            { note: 'E4', duration: 0.4 },  // dotted quarter note
            { note: null, duration: 0.1 },  // rest
            { note: 'C4', duration: 0.2 },  // eighth note
            { note: 'E4', duration: 0.4 },  // dotted quarter note
            { note: null, duration: 0.1 },  // rest
            { note: 'E4', duration: 0.2 },  // ascending run
            { note: 'F4', duration: 0.2 },
            { note: 'G4', duration: 0.2 },
            { note: 'A4', duration: 0.2 },
            { note: 'B4', duration: 0.4 },  // half note
            { note: 'C5', duration: 0.8 }   // whole note
        ];

        let timeOffset = 0;
        melody.forEach((note) => {
            if (note.note !== null) {  // Skip rests
                setTimeout(() => {
                    safePlayPianoNote(note.note);
                }, timeOffset * 1000);
            }
            timeOffset += note.duration;
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

            // Play the night mode melody if piano mode is active
            playNightModeMelody();

            let links = document.querySelectorAll('.link');
            for (let i = 0; i < links.length; i++) {
                // Clear inline filter so CSS `body.dark-mode` rules take effect
                links[i].style.filter = '';
            }

            let circulos = document.querySelectorAll('.circulo');
            for (let i = 0; i < circulos.length; i++) {
                circulos[i].style.filter = '';
            }

            // play confirm click sound
            playUISound(sounds.confirm);
        } else {
            e.classList.remove("fa-sun");
            e.classList.add("fa-moon");
            e.style.color = "#585858";
            document.body.style.background = 'rgb(243, 242, 242)';
            document.body.classList.remove('dark-mode');
            document.querySelector('#userName').style.color = 'rgb(99, 99, 99)';

            let links = document.querySelectorAll('.link');
            for (let i = 0; i < links.length; i++) {
                // Ensure any inline filter is cleared when leaving dark mode
                links[i].style.filter = '';
            }

            let circulos = document.querySelectorAll('.circulo');
            for (let i = 0; i < circulos.length; i++) {
                circulos[i].style.filter = '';
            }
            // play confirm click sound
            playUISound(sounds.confirm);
        }

        currentGreyscale = Math.min(currentGreyscale + 5, 100);
        userPhoto.style.filter = `grayscale(${currentGreyscale}%)`;

        if (currentGreyscale >= 100) {
            checkAchievement('Night and Day');
        }
    }

    // Check system dark mode preference and set initial state
    const darkModeButton = document.querySelector('.js-night-mode');
    if (darkModeButton) {
        darkModeButton.addEventListener('click', (event) => {
            mostrar(event.currentTarget);
        });
        
        // Safely apply dark mode if system preference matches
        try {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                mostrar(darkModeButton);
            }
        } catch (error) {
            console.warn('Error checking dark mode preference:', error);
        }
    }

    // Add listener for system dark mode changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (e.matches !== document.body.classList.contains('dark-mode')) {
            mostrar(darkModeButton);
        }
    });

    const userPhoto = document.getElementById('userPhoto');
    let clickCount = 0;
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
            window.currentInstrument = currentInstrument; // Update global variable
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
            safePlayPianoNote('A4', 0.7);
            
            // Update the visual indicator on the music icon
            updateInstrumentIndicator();
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
    scheduleIdle(() => {
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

        const pageShareButton = document.querySelector('.page-share');
        if (pageShareButton) {
            pageShareButton.addEventListener('click', async () => {
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
        }
    });

    // Piano Mode Constants and Setup
    const NOTES = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5'];
    const NOTE_FREQUENCIES = {
        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
        'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
        'A#4': 466.16, 'B4': 493.88, 'C5': 523.25
    };
    const NOTE_PATTERN = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5'];

    let pianoHandlersBound = false;

    function assignNotesToLinks() {
        links.forEach((link, index) => {
            const note = NOTE_PATTERN[index % NOTE_PATTERN.length];
            link.setAttribute('data-note', note);
        });
    }

    function handlePianoLinkClick(event) {
        if (!document.body.classList.contains('piano-mode')) {
            return;
        }
        event.preventDefault();
        const link = event.currentTarget;
        const note = link.getAttribute('data-note');
        if (note) {
            safePlayPianoNote(note);
        }
        setTimeout(() => {
            window.location.href = link.href;
        }, 200);
    }

    function bindPianoLinkHandlers() {
        if (pianoHandlersBound) {
            return;
        }
        links.forEach((link) => {
            link.addEventListener('click', handlePianoLinkClick);
        });
        pianoHandlersBound = true;
    }

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
    
    // Make currentInstrument accessible globally
    window.currentInstrument = currentInstrument;

    // Function to update sustain state
    function updateSustainState(isEnabled) {
        // Update local variable
        isSustainEnabled = isEnabled;
        
        // Update global sustain state for piano.js
        window.sustainEnabled = isEnabled;
        
        // Update the sustain toggle button appearance
        const sustainToggle = document.querySelector('.sustain-toggle');
        if (sustainToggle) {
            if (isEnabled) {
                sustainToggle.classList.add('active');
                if (window.sustainToastEnabled) {
                    showToast('Sustain on');
                }
            } else {
                sustainToggle.classList.remove('active');
                if (window.sustainToastEnabled) {
                    showToast('Sustain off');
                }
            }
        }
        
        // Call the piano.js function to handle sustain changes
        safeUpdateSustain(isEnabled);
    }

    // Get the existing sustain toggle button
    const sustainToggle = document.querySelector('.sustain-toggle');
    if (sustainToggle) {
        // Replace click handler with mousedown/touchstart handlers
        sustainToggle.removeEventListener('click', function(){});
        
        // Use mousedown/touchstart to activate sustain when pressed
        sustainToggle.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Prevent text selection
            window.sustainToastEnabled = true;
            updateSustainState(true);
        });
        
        sustainToggle.addEventListener('touchstart', function(e) {
            e.preventDefault(); // Prevent text selection
            window.sustainToastEnabled = true;
            updateSustainState(true);
        });
        
        // Use mouseup/touchend to deactivate sustain when released
        document.addEventListener('mouseup', function() {
            if (isSustainEnabled) {
                window.sustainToastEnabled = true;
                updateSustainState(false);
            }
        });
        
        document.addEventListener('touchend', function() {
            if (isSustainEnabled) {
                window.sustainToastEnabled = true;
                updateSustainState(false);
            }
        });
        
        // Also handle mouse leaving the window
        document.addEventListener('mouseleave', function() {
            if (isSustainEnabled) {
                window.sustainToastEnabled = false; // Don't show toast when mouse leaves
                updateSustainState(false);
            }
        });
        
        // Initially hide the sustain button
        sustainToggle.style.opacity = '0';
        sustainToggle.style.visibility = 'hidden';
        sustainToggle.style.pointerEvents = 'none';
    }

    function createAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    // Function to update instrument indicator
    function updateInstrumentIndicator() {
        const pianoModeToggle = document.querySelector('.piano-mode-toggle');
        if (!pianoModeToggle) return;
        
        // Remove all instrument classes
        for (let i = 0; i < instruments.length; i++) {
            pianoModeToggle.classList.remove(`instrument-${i}`);
        }
        
        // Add current instrument class
        pianoModeToggle.classList.add(`instrument-${currentInstrument}`);
        
        // Show/hide sustain toggle based on instrument type
        const sustainToggle = document.querySelector('.sustain-toggle');
        if (sustainToggle) {
            // Only show sustain if in piano mode AND using non-piano instruments
            if (document.body.classList.contains('piano-mode') && currentInstrument > 0) {
                // Only show sustain for WebAudio instruments (not piano)
                sustainToggle.style.opacity = '1';
                sustainToggle.style.visibility = 'visible';
                sustainToggle.style.pointerEvents = 'auto';
                sustainToggle.style.width = 'auto';
                sustainToggle.style.position = 'static';
                sustainToggle.style.margin = '';
            } else {
                // Hide for piano samples or when not in piano mode
                sustainToggle.style.opacity = '0';
                sustainToggle.style.visibility = 'hidden';
                sustainToggle.style.pointerEvents = 'none';
                sustainToggle.style.width = '0';
                sustainToggle.style.margin = '0';
                sustainToggle.style.position = 'absolute';
                // Also disable sustain when switching to piano
                updateSustainState(false);
            }
        }
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
        
        // Update the visual indicator on the music icon
        updateInstrumentIndicator();
        
        setTimeout(() => indicator.classList.remove('show'), 2000);
    }

    function playNote(frequency, duration = 0.4) {
        try {
            // If we're in piano mode, use the piano samples instead of oscillator
            if (document.body.classList.contains('piano-mode')) {
                // Convert frequency to note name
                const noteEntries = Object.entries(NOTE_FREQUENCIES);
                const closestNote = noteEntries.reduce((prev, curr) => {
                    return Math.abs(curr[1] - frequency) < Math.abs(prev[1] - frequency) ? curr : prev;
                });
                
                // Play the piano note
                return safePlayPianoNote(closestNote[0]);
            }
            
            // Original oscillator code for non-piano mode
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
                // Disable toast notifications for this sustain change
                window.sustainToastEnabled = false;
                // Reset sustain when exiting piano mode
                updateSustainState(false);
                // Reset instrument indicator
                pianoModeToggle.classList.remove(`instrument-${currentInstrument}`);
                
                // Ensure sustain toggle is completely hidden when exiting piano mode
                const sustainToggle = document.querySelector('.sustain-toggle');
                if (sustainToggle) {
                    sustainToggle.style.opacity = '0';
                    sustainToggle.style.visibility = 'hidden';
                    sustainToggle.style.pointerEvents = 'none';
                    sustainToggle.style.width = '0';
                    sustainToggle.style.margin = '0';
                    sustainToggle.style.position = 'absolute';
                }
                return;
            }
            
            ensurePianoReady();
            assignNotesToLinks();
            bindPianoLinkHandlers();
            
            // Reset to first instrument when entering piano mode
            currentInstrument = 0;
            window.currentInstrument = 0; // Update global variable
            
            // Show initial instrument
            showInstrumentIndicator();
            
            // Update instrument indicator to hide sustain for piano
            updateInstrumentIndicator();

            // Piano mode activation melody: C-E-G-C
            const activationMelody = [
                { note: 'C4', duration: 0.2 },
                { note: 'E4', duration: 0.2 },
                { note: 'G4', duration: 0.2 },
                { note: 'C5', duration: 0.4 }
            ];
            
            // Play the activation melody
            let timeOffset = 0;
            activationMelody.forEach((note) => {
                setTimeout(() => {
                    safePlayPianoNote(note.note);
                }, timeOffset);
                timeOffset += note.duration * 1000; // Convert duration to milliseconds
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
        
        // Use the note assigned to the link
        const note = link.getAttribute('data-note');
        if (note) {
            safePlayPianoNote(note, 0.5);
            
            // Visual feedback
            link.style.transform = 'scale(1.05)';
            link.style.opacity = '0.8';
            
            setTimeout(() => {
                link.style.transform = '';
                link.style.opacity = '';
            }, 200);
        }
    }

    // Add touch event handlers to links
    document.querySelectorAll('.link').forEach((link, index) => {
        // Keep existing mouseenter event for desktop
        link.addEventListener('mouseenter', () => {
            if (document.body.classList.contains('piano-mode')) {
                // Use the note assigned to the link
                const note = link.getAttribute('data-note');
                if (note) {
                    safePlayPianoNote(note, 0.5);
                    
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
            safePlayPianoNote(noteName);
            
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

    // Register service worker after page is fully loaded to avoid blocking render
    if ('serviceWorker' in navigator) {
        // Use requestIdleCallback or setTimeout to ensure it doesn't block initial render
        const registerSW = () => {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.warn('ServiceWorker registration failed:', err);
            });
        };
        
        if (window.requestIdleCallback) {
            window.requestIdleCallback(registerSW, { timeout: 2000 });
        } else {
            setTimeout(registerSW, 1000);
        }
    }
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

function toggleAchievements(header) {
    if (!header) return;
    const content = header.nextElementSibling;
    if (!content) return;
    header.classList.toggle('expanded');
    content.classList.toggle('expanded');
}

// Function to show toast notification
function showToast(message, duration = 2000) {
    // Check if toast element exists, create if not
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.classList.add('show');
    
    // Hide toast after duration
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}