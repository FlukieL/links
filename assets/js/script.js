document.addEventListener('DOMContentLoaded', function() {
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
    
    userPhoto.onclick = function() {
        clickCount++;
        if (clickCount === 10) {
            checkAchievement('Face Off');
            userPhoto.classList.add('spin-grow');
            setTimeout(() => {
                window.location.href = "https://onlyfans.lukeharper.co.uk";
            }, 5000);
            clickCount = 0;
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