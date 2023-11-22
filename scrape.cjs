const puppeteer = require('puppeteer');
const fs = require('fs');

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

    for(let i = 0 ; i < /*pagesLinks.length*/1 ; i ++){
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
                const webData = await page.evaluate((link) =>{

                    function funInnerText(element){
                        if(element != null){
                            return element.innerText;
                        }
                    
                        return '';
                    }

                    let reviewText = funInnerText(document.getElementById('recipe-review-bar_1-0'));
                    reviewText = reviewText.split(/[\n]+/);
    
                    const reviewRecipe = reviewText[0] + reviewText[1];
                    const descriptionRecipe = funInnerText(document.getElementById("article-subheading_1-0"));
                    const authorRecipe = funInnerText(Array.from(document.getElementsByClassName("mntl-attribution__item-name"))[0]);
                    const publishUpdateRecipe = funInnerText(Array.from(document.getElementsByClassName("mntl-attribution__item-date"))[0]);
                    const recipeImage = Array.from(document.getElementsByClassName("img-placeholder"))[0].querySelector('img').src;
                    
                    let timersRecipeArray = Array.from(document.getElementsByClassName("mntl-recipe-details__item"));
                    let timers = {};
                    timersRecipeArray = timersRecipeArray.map((el) => {
                        el = funInnerText(el)

                        const timerName = el.split('\n')[0];
                        const timerValue = el.split('\n')[1];

                        timers[timerName] = timerValue;
                    });
    
                    let ingredientsRecipeArray = Array.from(document.getElementsByClassName("mntl-structured-ingredients__list-item"))
    
                    const ingredientsRecipe = ingredientsRecipeArray.map((elements) => funInnerText(elements));

                    let directions = {};
                    let directionsText = funInnerText(document.getElementById("recipe__steps_1-0")).split('\n\n');
                    directionsText.shift();

                    let i = -2;

                    directionsText = directionsText.map((el,index) =>{
                        if(el == 'Cook’s Note'){
                            i = index;
                            directions[el] = directionsText[index + 1];
                        }
                        else if(i != index - 1){
                            directions[`Step ${index + 1}`] = el;
                        }
                    })

                    let nutritionalValues = {};

                    let nutritional = Array.from(document.getElementById("recipe__nutrition-facts_1-0").querySelectorAll('tr'));
                    nutritional = nutritional.map((el) => {
                        el = funInnerText(el);
                        el = el.split('\n');
                        if(el[1] != undefined){
                            nutritionalValues[el[1]] = el[0];
                        }
                    });

                    return{
                        Link : link,
                        Review : reviewRecipe,
                        Description : descriptionRecipe,
                        Author : authorRecipe,
                        Publish_Update_Date : publishUpdateRecipe,
                        Image : recipeImage,
                        Details : timers,
                        Ingredients : ingredientsRecipe,
                        Directions : directions,
                        Nutritional_Values_Per_Serving : nutritionalValues
                    }
                },mainRecipeLinks[k])

                data[k] = webData;
            }

        }
    }


    await browser.close();

    fs.writeFile('recipes.json', JSON.stringify(data,null,2), 'utf-8', () => {
        console.log("Done.");
  });

    return data;


})().then(console.log)
