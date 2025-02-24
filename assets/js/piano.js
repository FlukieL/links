// Piano notes samples URLs
const PIANO_NOTES = {
    'C4': 'https://cdn.freesound.org/previews/39/39186_35187-lq.mp3',
    'C#4': 'https://cdn.freesound.org/previews/39/39187_35187-lq.mp3',
    'D4': 'https://cdn.freesound.org/previews/39/39188_35187-lq.mp3',
    'D#4': 'https://cdn.freesound.org/previews/39/39189_35187-lq.mp3',
    'E4': 'https://cdn.freesound.org/previews/39/39190_35187-lq.mp3',
    'F4': 'https://cdn.freesound.org/previews/39/39191_35187-lq.mp3',
    'F#4': 'https://cdn.freesound.org/previews/39/39192_35187-lq.mp3',
    'G4': 'https://cdn.freesound.org/previews/39/39193_35187-lq.mp3',
    'G#4': 'https://cdn.freesound.org/previews/39/39194_35187-lq.mp3',
    'A4': 'https://cdn.freesound.org/previews/39/39195_35187-lq.mp3',
    'A#4': 'https://cdn.freesound.org/previews/39/39196_35187-lq.mp3',
    'B4': 'https://cdn.freesound.org/previews/39/39197_35187-lq.mp3',
    'C5': 'https://cdn.freesound.org/previews/39/39198_35187-lq.mp3'
};

// Synth notes (using Web Audio API)
let audioContext = null;

// Cache for loaded audio samples
const audioCache = {};

// Track active notes for sustain
const activeNotes = [];

// Preload piano samples
function preloadPianoSamples() {
    Object.entries(PIANO_NOTES).forEach(([note, url]) => {
        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto';
        audioCache[note] = audio;
    });
}

// Create or get audio context
function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Play a note with the current instrument
function playPianoNote(note, volume = 0.7) {
    // Get the current instrument from the global variable
    const currentInstrument = window.currentInstrument || 0;
    
    // Make profile picture wobble
    wobbleProfilePicture();
    
    // Adjust volume based on instrument type
    let adjustedVolume = volume;
    if (currentInstrument > 0) {
        // Reduce volume for non-piano instruments
        adjustedVolume = volume * 0.4;
    }
    
    // Play different sounds based on the instrument
    switch(currentInstrument) {
        case 0: // Piano
            return playPianoSample(note, volume);
        case 1: // Synth
            return playSynthSound(note, 'square', adjustedVolume);
        case 2: // Music Box
            return playSynthSound(note, 'triangle', adjustedVolume);
        case 3: // Electric Guitar
            return playSynthSound(note, 'sawtooth', adjustedVolume);
        default:
            return playPianoSample(note, volume);
    }
}

// Play a piano sample
function playPianoSample(note, volume = 0.7) {
    if (!audioCache[note]) {
        // If not preloaded, create audio element on demand
        const audio = new Audio(PIANO_NOTES[note]);
        audioCache[note] = audio;
    }
    
    // Clone the audio to allow overlapping sounds
    const sound = audioCache[note].cloneNode();
    sound.volume = volume;
    
    // Play the note
    sound.play().catch(err => console.error('Error playing piano note:', err));
    
    return sound;
}

// Play a synthesized sound using Web Audio API
function playSynthSound(note, waveType, volume = 0.7) {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filterNode = ctx.createBiquadFilter();
        
        // Connect nodes: oscillator -> filter -> gain -> output
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Set the oscillator type
        oscillator.type = waveType;
        
        // Apply filter to soften the sound
        filterNode.type = 'lowpass';
        
        // Convert note name to frequency
        const noteFrequencies = {
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
            'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
            'A#4': 466.16, 'B4': 493.88, 'C5': 523.25
        };
        
        const frequency = noteFrequencies[note];
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        
        // Customize filter and envelope based on instrument type
        if (waveType === 'square') {
            // Synth - softer square wave with more filtering
            filterNode.frequency.setValueAtTime(1200, ctx.currentTime);
            filterNode.Q.setValueAtTime(1, ctx.currentTime);
        } else if (waveType === 'triangle') {
            // Music Box - brighter sound with less filtering
            filterNode.frequency.setValueAtTime(2000, ctx.currentTime);
            filterNode.Q.setValueAtTime(0.5, ctx.currentTime);
        } else if (waveType === 'sawtooth') {
            // Electric Guitar - heavy filtering to tame harshness
            filterNode.frequency.setValueAtTime(900, ctx.currentTime);
            filterNode.Q.setValueAtTime(2, ctx.currentTime);
        }
        
        // Set volume with a gentle attack
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
        
        // Determine duration and release based on instrument
        let duration = 0.3;
        let releaseDuration = 0.3;
        
        if (waveType === 'triangle') { // Music Box - shorter, brighter sound
            duration = 0.2;
            releaseDuration = 0.5;
        } else if (waveType === 'sawtooth') { // Electric Guitar - longer sustain
            duration = 0.1;
            releaseDuration = 0.4;
        }
        
        // Check if sustain is enabled
        const isSustainEnabled = window.sustainEnabled || false;
        
        // Create a note object to track this sound
        const noteObj = {
            oscillator,
            gainNode,
            note,
            frequency,
            startTime: ctx.currentTime,
            duration,
            releaseDuration,
            waveType,
            volume
        };
        
        // Start the oscillator
        oscillator.start(ctx.currentTime);
        
        // If sustain is not enabled, apply normal release
        if (!isSustainEnabled) {
            // Add release - use exponentialRampToValueAtTime for smoother decay
            gainNode.gain.setValueAtTime(volume, ctx.currentTime + duration);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration + releaseDuration);
            
            // Schedule oscillator stop
            oscillator.stop(ctx.currentTime + duration + releaseDuration + 0.1);
        } else {
            // With sustain, keep the note at full volume after attack
            gainNode.gain.setValueAtTime(volume, ctx.currentTime + duration);
            
            // Add to active notes array for sustain tracking
            activeNotes.push(noteObj);
        }
        
        return oscillator;
    } catch (error) {
        console.error('Error playing synth sound:', error);
        return null;
    }
}

// Function to handle sustain toggle
function updateSustain(isEnabled) {
    window.sustainEnabled = isEnabled;
    
    // If sustain is turned off, release all sustained notes
    if (!isEnabled) {
        releaseSustainedNotes();
    }
}

// Release all sustained notes
function releaseSustainedNotes() {
    if (!activeNotes || activeNotes.length === 0) return;
    
    const ctx = getAudioContext();
    const currentTime = ctx.currentTime;
    
    // Process all active notes
    for (let i = activeNotes.length - 1; i >= 0; i--) {
        try {
            const noteObj = activeNotes[i];
            if (!noteObj) continue;
            
            // Apply release to each note
            const { oscillator, gainNode, volume, releaseDuration } = noteObj;
            
            // Cancel any scheduled values
            gainNode.gain.cancelScheduledValues(currentTime);
            
            // Get current gain value
            const currentGain = gainNode.gain.value || volume;
            
            // Set current gain and apply exponential release
            gainNode.gain.setValueAtTime(currentGain, currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + releaseDuration);
            
            // Schedule oscillator stop
            oscillator.stop(currentTime + releaseDuration + 0.1);
            
            // Remove from active notes
            activeNotes.splice(i, 1);
        } catch (error) {
            console.error('Error releasing sustained note:', error);
            // Remove problematic note from array
            activeNotes.splice(i, 1);
        }
    }
}

// Make profile picture wobble
function wobbleProfilePicture() {
    const userPhoto = document.getElementById('userPhoto');
    if (!userPhoto) return;
    
    // Remove any existing wobble animation
    userPhoto.classList.remove('wobble-animation');
    
    // Trigger reflow to restart animation
    void userPhoto.offsetWidth;
    
    // Add wobble animation
    userPhoto.classList.add('wobble-animation');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    preloadPianoSamples();
}); 