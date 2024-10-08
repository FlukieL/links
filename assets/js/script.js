function mostrar(e) {
    if (e.classList.contains("fa-moon-o")) { // if it has moon icon
        e.classList.remove("fa-moon-o"); // remove moon icon class
        e.classList.add("fa-sun-o"); // add sun icon class
        e.style.color = "rgb(225, 225, 0)";
        document.body.style.background = 'rgb(10, 10, 10)';
        document.querySelector('#userName').style.color = '#fff';

        let links = document.querySelectorAll('.link');
        // Get only the first from the array
        links[0].style.filter = 'grayscale(100%)';
        // get all
        for (let i = 0; i < links.length; i++) {
            links[i].style.filter = 'grayscale(100%)';
        }

        let circulos = document.querySelectorAll('.circulo');
        // Get only the first from the array
        circulos[0].style.filter = 'grayscale(100%)';
        // get all
        for (let i = 0; i < circulos.length; i++) {
            circulos[i].style.filter = 'grayscale(100%)';
        }

    } else { // else
        e.classList.remove("fa-sun-o"); // remove sun icon class
        e.classList.add("fa-moon-o"); // add moon icon class
        e.style.color = "#585858";
        document.body.style.background = 'rgb(243, 242, 242)';
        document.querySelector('#userName').style.color = 'rgb(99, 99, 99)';

        let links = document.querySelectorAll('.link');
        // Get only the first from the array
        links[0].style.filter = 'grayscale(0%)';
        // get all
        for (let i = 0; i < links.length; i++) {
            links[i].style.filter = 'grayscale(0%)';
        }

        let circulos = document.querySelectorAll('.circulo');
        // Get only the first from the array
        circulos[0].style.filter = 'grayscale(0%)';
        // get all
        for (let i = 0; i < circulos.length; i++) {
            circulos[i].style.filter = 'grayscale(0%)';
        }
    }

}