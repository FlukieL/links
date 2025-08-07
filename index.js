document.addEventListener('DOMContentLoaded', function() {
    // Night mode toggle
    const nightModeButton = document.querySelector('.js-night-mode');
    if (nightModeButton) {
        nightModeButton.addEventListener('click', function() {
            mostrar(this);
        });
    }

    // Photo hover effects
    const userPhoto = document.getElementById('userPhoto');
    if (userPhoto) {
        userPhoto.addEventListener('mouseover', function() {
            this.classList.add('hover');
        });
        userPhoto.addEventListener('mouseout', function() {
            this.classList.remove('hover');
        });

        // Easter egg click handler
        let clickCount = 0;
        userPhoto.addEventListener('click', function() {
            clickCount++;
            if (clickCount === 10) {
                this.classList.add('spin-grow');
                setTimeout(() => {
                    window.location.href = "https://onlyfans.lukeharper.co.uk";
                }, 5000);
                clickCount = 0;
            }
        });
    }

    // Achievements toggle
    const achievementsToggle = document.querySelector('.js-achievements-toggle');
    if (achievementsToggle) {
        achievementsToggle.addEventListener('click', function() {
            toggleAchievements(this);
        });
    }

    // Reset achievements button
    const resetButton = document.querySelector('.js-reset-achievements');
    if (resetButton) {
        resetButton.addEventListener('click', resetAchievements);
    }

    // Update achievement visuals
    updateAchievements();

    // Service worker is registered in index.html

    // Add sequential intro animations
    const links = document.querySelectorAll('.link');
    links.forEach((link, index) => {
        link.style.setProperty('--delay', `${index * 100}ms`);
        link.classList.add('intro-animation');
    });

    // Add this new code
    const headerButtons = document.querySelectorAll('.links-header button');
    headerButtons.forEach((button, index) => {
        button.style.animation = `buttonEntrance 0.5s ease-out ${index * 150 + 300}ms forwards`;
        button.style.opacity = '0';
    });
});

function toggleAchievements(header) {
    const content = document.getElementById('achievementsContent') || header.nextElementSibling;
    const isExpanded = header.getAttribute('aria-expanded') === 'true';
    const nextExpanded = !isExpanded;
    header.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
    if (content) {
        if (nextExpanded) {
            content.hidden = false;
            content.classList.add('expanded');
            header.classList.add('expanded');
        } else {
            content.classList.remove('expanded');
            header.classList.remove('expanded');
            content.hidden = true;
        }
    }
}

function updateAchievements() {
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
    
    // Check for winner status
    const allAchievements = ['Face Off', 'Check My Name', 'Night and Day'];
    const completed = allAchievements.every(achievement => achievements[achievement]);
    if (completed) {
        document.getElementById('winner').style.display = 'block';
    }
}

function resetAchievements() {
    localStorage.removeItem('achievements');
    document.querySelectorAll('.achievement').forEach(achievement => {
        achievement.classList.remove('unlocked');
    });
    document.getElementById('winner').style.display = 'none';
}

// ... existing code ...
