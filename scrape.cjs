const puppeteer = require('puppeteer');

(async () =>{
    const browser = await puppeteer.launch({headless : false});
    const page = await browser.newPage();

    await page.goto('https://www.allrecipes.com/');

    // variable that stores an array
    // with the links that have an a-z (meaning they have all the information we need)

    const pagesLinks = await page.evaluate(() =>{
        const queryRecipeArray = Array.from(document.getElementsByClassName("fullscreen-nav__sublist-item type--squirrel-bold"));

        const linkArray = [];

        queryRecipeArray.forEach((linkUnqueried) =>{
            const linkString = linkUnqueried.querySelector('a').href;

            if(linkString.includes('a-z')){
                linkArray.push(linkString);
            }
        })

        return linkArray;
    })

    const delay = async (ms) => new Promise(r => setTimeout(r, ms));

    let data = [];

    // iterate through the links 
    // to get the individual links of the
    // subcategories that we are looking for

    for(let i = 0 ; i < pagesLinks.length ; i ++){
        await page.goto(pagesLinks[i]);

        // scroll to get everything to load up
        // await page.evaluate(() => window.scrollBy(50,10000));
        await delay(2000);

        // getting the links into an array
        const recipesLinksElements = await page.evaluate(() =>{
            const el = Array.from(document.getElementsByClassName("comp link-list__item"));

            return el.map(links => links.querySelector('a').href);
        })

        // and looping through the links of the
        // subcategories again to get the 
        // important information(e.g. cook time, prep time, ingredients etc.)

        for(let j = 0 ; j < recipesLinksElements.length ; j ++){
            await page.goto(recipesLinksElements[j]);

            // scroll to get everything to load up
            // await page.evaluate(() => window.scrollBy(50,10000));
            await delay(2000);

            const mainRecipeLinks = await page.evaluate(() =>{
                const elements = Array.from(document.getElementsByClassName("comp mntl-card-list-items mntl-document-card mntl-card card card--no-image"));

                // initialising separate array
                const arr = [];

                // because we are ignoring some elements that have 
                // the class above
                // to get only the necessary stuff
                // (only for some links) !!!!

                elements.forEach((el) =>{
                    const temp = el.href;

                    if(!(temp.includes('gallery') || temp.includes('article'))){
                        arr.push(temp);
                    }
                })

            
                return arr;
            })

            for(let k = 0 ; k < mainRecipeLinks.length ; k ++){
                await page.goto(mainRecipeLinks[k]);

                // scroll to get everything to load up
                // await page.evaluate(() => window.scrollBy(50,10000));
                await delay(2000);
                const webData = await page.evaluate(() =>{
                    let reviewText = document.getElementById('recipe-review-bar_1-0').innerText;
                    reviewText = reviewText.split(/[\n]+/);
    
                    const reviewRecipe = reviewText[0] + reviewText[1];
                    const descriptionRecipe = document.getElementById("article-subheading_1-0").innerText;
                    const authorRecipe = Array.from(document.getElementsByClassName("mntl-attribution__item-name"))[0].innerText;
                    const publishUpdateRecipe = Array.from(document.getElementsByClassName("mntl-attribution__item-date"))[0].innerText;
                    const recipeImage = document.querySelector('#figure-article_1-0 > div > div > img').src;
                    
                    let timersRecipeArray = Array.from(document.getElementsByClassName("mntl-recipe-details__item"));
    
                    const timersRecipe = [{
                        prep_Time : timersRecipeArray[0].innerText.split('\n')[1],
                        cook_Time : timersRecipeArray[1].innerText.split('\n')[1],
                        total_Time : timersRecipeArray[2].innerText.split('\n')[1],
                        servings : timersRecipeArray[3].innerText.split('\n')[1]
                    }];
    
                    let ingredientsRecipeArray = Array.from(document.getElementsByClassName("mntl-structured-ingredients__list-item"))
    
                    const ingredientsRecipe = ingredientsRecipeArray.map((elements) => elements.innerText);
                })





            }

        }
    }


    await browser.close();

    return pagesLinks;


})().then(console.log)