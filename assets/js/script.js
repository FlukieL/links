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
        text.textContent = `Achievement Unlocked: ${name}`;
        popup.classList.add('show');
        setTimeout(() => {
            popup.classList.remove('show');
        }, 3000);
    }

    function checkAllAchievements() {
        const achievements = JSON.parse(localStorage.getItem('achievements') || '{}');
        const allAchievements = ['Face Off', 'Check My Name', 'Night and Day'];
        const completed = allAchievements.every(achievement => achievements[achievement]);
        
        const winner = document.getElementById('winner');
        if (completed && winner) {
            winner.style.display = 'block';
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
});