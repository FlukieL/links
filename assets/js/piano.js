// Piano functionality with MIDI-style synthesized piano sound
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let currentInstrument = 0;
const instruments = ['Piano', 'Synth', 'Music Box', 'Electric Guitar'];
let sustainEnabled = false;
let activeNotes = new Map();
let touchStartX = 0;
let touchStartTime = 0;

// Create a compressor to prevent distortion when playing multiple notes
const compressor = audioContext.createDynamicsCompressor();
compressor.threshold.setValueAtTime(-20, audioContext.currentTime);
compressor.knee.setValueAtTime(15, audioContext.currentTime);
compressor.ratio.setValueAtTime(8, audioContext.currentTime);
compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
compressor.release.setValueAtTime(0.05, audioContext.currentTime);
compressor.connect(audioContext.destination);

// Master gain for overall volume control
const masterGain = audioContext.createGain();
masterGain.gain.setValueAtTime(0.4, audioContext.currentTime);
masterGain.connect(compressor);

// Note frequencies for accurate tuning
const noteFrequencies = {
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
    'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
    'A#4': 466.16, 'B4': 493.88, 'C5': 523.25
};

// Create realistic MIDI-style piano sound with proper envelope and harmonics
function playNote(frequency, duration = 0.5) {
    const now = audioContext.currentTime;
    
    // Create multiple oscillators for rich harmonic content (like a real piano)
    const oscillators = [];
    const gains = [];
    
    // Fundamental frequency
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, now);
    
    // Second harmonic (octave)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, now);
    
    // Third harmonic
    const osc3 = audioContext.createOscillator();
    const gain3 = audioContext.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(frequency * 3, now);
    
    // Fifth harmonic (adds brightness)
    const osc4 = audioContext.createOscillator();
    const gain4 = audioContext.createGain();
    osc4.type = 'sine';
    osc4.frequency.setValueAtTime(frequency * 5, now);
    
    oscillators.push(osc1, osc2, osc3, osc4);
    gains.push(gain1, gain2, gain3, gain4);
    
    // Apply harmonic balance (volume for each harmonic) - reduced for cleaner sound
    gain1.gain.setValueAtTime(0.5, now);   // Fundamental
    gain2.gain.setValueAtTime(0.2, now);   // Octave
    gain3.gain.setValueAtTime(0.1, now);   // Third
    gain4.gain.setValueAtTime(0.05, now);  // Fifth - subtle brightness
    
    // Note-specific gain for polyphony control
    const noteGain = audioContext.createGain();
    
    // Connect oscillators through individual gains to note gain
    oscillators.forEach((osc, i) => {
        osc.connect(gains[i]);
        gains[i].connect(noteGain);
    });
    
    // Add a subtle filter for warmth
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.Q.setValueAtTime(0.5, now);
    
    noteGain.connect(filter);
    filter.connect(masterGain);
    
    // Piano envelope: fast attack, slow decay, medium sustain, slow release
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.6, now + 0.005);  // Very fast attack
    noteGain.gain.exponentialRampToValueAtTime(0.4, now + 0.1); // Quick decay
    noteGain.gain.exponentialRampToValueAtTime(0.3, now + duration); // Sustain
    
    // Check if sustain pedal is active
    if (!sustainEnabled) {
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.5); // Release
    }
    
    // Start all oscillators
    oscillators.forEach(osc => {
        osc.start(now);
        if (!sustainEnabled) {
            osc.stop(now + duration + 0.6);
        }
    });
    
    // Store for sustain management
    if (sustainEnabled) {
        activeNotes.set(frequency, {
            oscillators,
            gains,
            noteGain,
            startTime: now
        });
    }
    
    return oscillators[0];
}

// Release sustained notes when sustain is turned off
function releaseSustainedNotes() {
    const now = audioContext.currentTime;
    
    activeNotes.forEach((note, frequency) => {
        const { oscillators, noteGain } = note;
        
        // Apply release envelope
        noteGain.gain.cancelScheduledValues(now);
        noteGain.gain.setValueAtTime(noteGain.gain.value, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        // Stop oscillators
        oscillators.forEach(osc => {
            try {
                osc.stop(now + 0.6);
            } catch (e) {
                // Oscillator might already be stopped
            }
        });
    });
    
    activeNotes.clear();
}

// Play a piano note
function playPianoNote(note, volume = 0.7) {
    const frequency = noteFrequencies[note];
    if (!frequency) return;
    
    // Make profile picture wobble
    wobbleProfilePicture();
    
    // Trigger vibration on mobile
    triggerVibration([20]);
    
    // Play the note with MIDI-style synthesis
    playNote(frequency);
    
    return frequency;
}

// Vibration feedback for mobile
function triggerVibration(pattern = [30]) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// Make profile picture wobble
function wobbleProfilePicture() {
    const userPhoto = document.getElementById('userPhoto');
    if (!userPhoto) return;
    
    userPhoto.classList.remove('wobble-animation');
    void userPhoto.offsetWidth;
    userPhoto.classList.add('wobble-animation');
}

// Function to handle sustain toggle
function updateSustain(isEnabled) {
    sustainEnabled = isEnabled;
    
    // If sustain is turned off, release all sustained notes
    if (!isEnabled) {
        releaseSustainedNotes();
    }
}

// Multi-touch chord detection
const activeTouch = new Map();

function handleTouchStart(event, note) {
    event.preventDefault();
    
    for (let touch of event.touches) {
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.dataset.note) {
            activeTouch.set(touch.identifier, target.dataset.note);
            playPianoNote(target.dataset.note);
            target.classList.add('touched');
            triggerVibration([20]);
        }
    }
}

function handleTouchEnd(event) {
    event.preventDefault();
    
    for (let touch of event.changedTouches) {
        activeTouch.delete(touch.identifier);
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.classList.contains('touched')) {
            target.classList.remove('touched');
        }
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    
    for (let touch of event.touches) {
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.dataset.note) {
            const previousNote = activeTouch.get(touch.identifier);
            if (previousNote !== target.dataset.note) {
                const previousElement = document.querySelector(`[data-note="${previousNote}"].touched`);
                if (previousElement) {
                    previousElement.classList.remove('touched');
                }
                
                activeTouch.set(touch.identifier, target.dataset.note);
                playPianoNote(target.dataset.note);
                target.classList.add('touched');
                triggerVibration([15]);
            }
        }
    }
}

// Gesture-based instrument switching (swipe left/right on piano)
let touchStartY = 0;
let isSwiping = false;

function handleSwipeStart(event) {
    if (!document.body.classList.contains('piano-mode')) return;
    if (event.touches.length !== 1) return;
    
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    isSwiping = false;
}

function handleSwipeMove(event) {
    if (!document.body.classList.contains('piano-mode')) return;
    if (event.touches.length !== 1) return;
    
    const touchEndX = event.touches[0].clientX;
    const touchEndY = event.touches[0].clientY;
    
    const deltaX = Math.abs(touchEndX - touchStartX);
    const deltaY = Math.abs(touchEndY - touchStartY);
    
    if (deltaX > 50 && deltaX > deltaY * 2) {
        isSwiping = true;
    }
}

function handleSwipeEnd(event) {
    if (!document.body.classList.contains('piano-mode')) return;
    if (!isSwiping) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;
    
    if (deltaX > 100) {
        cycleInstrument(1);
        triggerVibration([30, 50, 30]);
    } else if (deltaX < -100) {
        cycleInstrument(-1);
        triggerVibration([30, 50, 30]);
    }
    
    isSwiping = false;
}

function cycleInstrument(direction) {
    currentInstrument = currentInstrument + direction;
    if (currentInstrument < 0) currentInstrument = instruments.length - 1;
    if (currentInstrument >= instruments.length) currentInstrument = 0;
    
    const pianoToggle = document.querySelector('.piano-mode-toggle');
    if (pianoToggle) {
        pianoToggle.className = `piano-mode-toggle instrument-${currentInstrument}`;
    }
    
    showInstrumentNotification(instruments[currentInstrument]);
}

function showInstrumentNotification(instrumentName) {
    let notification = document.querySelector('.instrument-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'instrument-notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = instrumentName;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 1500);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const links = document.getElementById('links');
    if (links) {
        links.addEventListener('touchstart', (e) => {
            if (document.body.classList.contains('piano-mode')) {
                const target = e.target.closest('.link');
                if (target && target.dataset.note) {
                    handleTouchStart(e, target.dataset.note);
                }
            }
        }, { passive: false });
        
        links.addEventListener('touchend', handleTouchEnd, { passive: false });
        links.addEventListener('touchmove', handleTouchMove, { passive: false });
        
        links.addEventListener('touchstart', handleSwipeStart, { passive: true });
        links.addEventListener('touchmove', handleSwipeMove, { passive: true });
        links.addEventListener('touchend', handleSwipeEnd, { passive: true });
    }
    
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.link');
        if (link && link.dataset.note && document.body.classList.contains('piano-mode')) {
            triggerVibration([20]);
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (!document.body.classList.contains('piano-mode')) return;
        
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            cycleInstrument(1);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            cycleInstrument(-1);
        }
    });
});
