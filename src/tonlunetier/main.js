const puppeteer = require('puppeteer');
const fs = require('fs');
const opn = require('opn');

async function get_page(domain,path, send_notif = true) {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.goto(domain+path);
    const html = await page.content();

    const articles = await page.$$('li.grid__item');
    const articles_form = {};

    for (const article of articles) {
        const nameElement = await article.$('a.full-unstyled-link');
        const name = await (nameElement ? nameElement.evaluate(node => node.textContent.trim()) : "Nom non disponible");
      
        const priceElement = await article.$('span.price-item.price-item--regular');
        const price = await (priceElement ? priceElement.evaluate(node => node.textContent.trim()) : "Prix non disponible");
      
        const imageElement = await article.$('img.motion-reduce');
        const imageSrc = "https:"+ await (imageElement ? imageElement.evaluate(node => node.getAttribute('src')) : "//url");
         //imageSrc = imageSrc.replace(/^\/\//, "");
        //imageSrc = "https:"+imageSrc;
        const urlElement = await article.$('a.full-unstyled-link');
        const url = domain+ await (urlElement ? urlElement.evaluate(node => node.getAttribute('href')) : "url not found");
        articles_form[name] = {
          price,
          imageSrc,
          url
        };
    }
      
    if (send_notif) {
        // Code pour envoyer la notification
    }

    await browser.close();

    return articles_form;
}

function generateReport(reportData) {
    const currentDate = new Date().toLocaleString();
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="en" data-bs-theme="dark">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
  
          <title>Rapport de scraping</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">

      </head>
      <body>
          <div class="container-sm mt-2 ">
              <h1 class="text-center">Rapport de scraping</h1>
              <p class="text-center">Généré le ${currentDate}</p>
            <ul class="row mb-2">
    `;
  
    for (const [name, { price, imageSrc,url }] of Object.entries(reportData)) {
      htmlContent += `
                <li class="col-md-4 mt-2">
                
                    <a href="${url}" class="list-group-item">
                        <div class="card h-100">
                            <img src="${imageSrc}" class="card-img-top img-fluid img-thumbnail" alt="Image de l'article" style="width=80%">
                            <div class="card-body">
                                <h5 class="card-title">${name}</h5>
                                <p class="card-text">${price}</p>
                                <a href="${url}" class="btn btn-primary">View</a>
                            </div>
                        </div>
                    </a>
                    
                    </li>
      `;
    }
  
    htmlContent += `
            </ul>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz" crossorigin="anonymous"></script>

    </body>
    </html>

    `;
  
    return htmlContent;
  }
  

const domain = 'https://tg.tonlunetier.com';
const path = '/collections/all';
get_page(domain,path).then(articles_form => {
  const reportContent = generateReport(articles_form);

  // Enregistrement du rapport dans un fichier HTML
  fs.writeFile('report.html', reportContent, (err) => {
    if (err) {
      console.error('Erreur lors de l\'enregistrement du rapport :', err);
    } else {
      console.log('Le rapport a été généré et enregistré avec succès.');
      //opn('rapport.html');
      //open('https://sindresorhus.com');


    }
  });
});
