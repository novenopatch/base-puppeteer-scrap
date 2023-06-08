const puppeteer = require('puppeteer');
const fs = require('fs');
const opn = require('opn');

async function getRoms(page) {
  const canalElement = await page.$('.theater-select-nav.closed-theater-selection ul');
  const canalList = await canalElement.$$eval('li', (elements) => {
    return elements.map((li) => {
      const title = li.querySelector('a').textContent.trim();
      const link = li.querySelector('a').href;
  
      return { title, link };
    });
  });

  return canalList;
}

async function getInfo(page) {
  const infoElement = await page.$(".theater-top-container-cover-content");
  const nameElement = await infoElement.$('h1');
  const name = await (nameElement ? nameElement.evaluate(node => node.textContent.trim()) : "Nom non disponible");

  const addressElement = await infoElement.$('.adress');
  const address = await (addressElement ? addressElement.evaluate(node => node.textContent.trim()) : "Adresse non disponible");

  return { name, address };
}

async function getHours(page) {
  const hoursElement = await page.$('.info-section-hours ul');
  const hoursList = await hoursElement.$$eval('li', (elements) => {
    return elements.map((li) => {
      const title = li.querySelector('.title').textContent.trim();
      const hours = li.querySelector('.hours').textContent.trim();
      return { title, hours };
    });
  });

  return hoursList;
}

async function getTarifs(page) {
  const tarifsElement = await page.$('ul.prices-table');
  const tarifsList = await tarifsElement.$$eval('li', (elements) => {
    return elements.map((li) => {
      const name = li.querySelector('.price-name').textContent.trim();
      const value = li.querySelector('.price-value').textContent.trim();
      return { name, value };
    });
  });

  return tarifsList;
}

async function getMovies(page) {
  const movies_form = new Map();
  const moviesElement = await page.$('section.theater-data');
  const movies = await moviesElement.$$('ul.theater-movies');
  for (const movie of movies) {
    const date = await movie.evaluate(node => node.getAttribute('data-date'));
    const movieList = await movie.$$eval('li', (elements) => {
      return elements
        .filter(li => !li.classList.contains('is-empty'))
        .map((li) => {
          const link = li.querySelector('a').href;
          const title = li.querySelector('h2').textContent;
          const spanText = li.querySelector('span').textContent;
          const imglink = li.querySelector('img').src;
          return { link, title, spanText, imglink };
        });
    });

    movies_form.set(date, movieList);
  }

  return movies_form;
}

async function get_page(url, send_notif = true) {
  const browser = await puppeteer.launch({ headless: 'new'  });
  const page = await browser.newPage();

  await page.goto(url);

  const roms = await getRoms(page);
  const info = await getInfo(page);
  const hours = await getHours(page);
  const tarifs = await getTarifs(page);
  const movies = await getMovies(page);

  if (send_notif) {
    // Code pour envoyer la notification
  }

  await browser.close();

  return { roms, info, hours, tarifs, movies };
}

function generateReport(reportData) {
  const currentDate = new Date().toLocaleString();
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="fr" data-bs-theme="dark">
    <head>
        <title>Rapport de scraping</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
      <div class="container mt-2">
        <h1 class="text-center">${reportData.info.name} - ${reportData.info.address}</h1>
        <p class="text-center">Généré le ${currentDate}</p>

        <h2 class="text-center">Tarifs</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Valeur</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.tarifs.map(({ name, value }) => `
              <tr>
                <td>${name}</td>
                <td>${value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2 class="text-center">Films</h2>
        ${Array.from(reportData.movies).map(([date, movieList]) => `
          <h3 class="text-center">Projeter le ${date}</h3>
          <ul class="row mb-2">
            ${movieList.map(movie => `
              <li class="col-md-4 mt-2">
                <a href="${movie.link}" class="list-group-item">
                  <div class="card h-100">
                    <img src="${movie.imglink}" class="card-img-top img-fluid img-thumbnail" alt="Image du film">
                    <div class="card-body">
                      <h5 class="card-title">${movie.title}</h5>
                      <p class="card-text">${movie.spanText}</p>
                      <a href="${movie.link}" class="btn btn-primary">Voir</a>
                    </div>
                  </div>
                </a>
              </li>
            `).join('')}
          </ul>
        `).join('')}

        <h2 class="text-center">Horaires de la salle</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Jour</th>
              <th>Horaires</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.hours.map(({ title, hours }) => `
              <tr>
                <td>${title}</td>
                <td>${hours}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
  `;

  return htmlContent;
}

const url = 'https://www.canalolympia.com/theaters/godope/';

get_page(url).then((result) => {
  const reportContent = generateReport(result);

  // Enregistrement du rapport dans un fichier HTML
  fs.writeFile('report.html', reportContent, (err) => {
    if (err) {
      console.error('Erreur lors de l\'enregistrement du rapport :', err);
    } else {
      console.log('Le rapport a été généré et enregistré avec succès.');
      //opn('report.html');
    }
  });
});
