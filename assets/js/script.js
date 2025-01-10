document.addEventListener('DOMContentLoaded', function() {
    const userName = document.getElementById('userName');
    let mouseOverTimeout;

    if (userName) {
        userName.addEventListener('mouseover', function() {
            userName.textContent = 'Alive?';
            mouseOverTimeout = setTimeout(() => {
                window.location.href = "https://alive.lukeharper.co.uk";
            }, 5000); // Redirect after 5 seconds
        });

        userName.addEventListener('mouseout', function() {
            userName.textContent = 'Luke Harper';
            clearTimeout(mouseOverTimeout); // Clear the timeout if mouse leaves
        });
    }
});

function mostrar(e) {
    if (e.classList.contains("fa-moon")) { // if it has moon icon
        e.classList.remove("fa-moon"); // remove moon icon class
        e.classList.add("fa-sun"); // add sun icon class
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

    } else { // else
        e.classList.remove("fa-sun"); // remove sun icon class
        e.classList.add("fa-moon"); // add moon icon class
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
}