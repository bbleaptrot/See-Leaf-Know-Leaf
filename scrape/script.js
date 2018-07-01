var url = 'http://leafsnap.com/species/';
var request = require('request');
var cheerio = require('cheerio');
var massive = require('massive');
let database = require('./database.js');
var fs = require('fs');

let names = [];
request(url, (err, response, data)=> {
    var $ = cheerio.load(data);
    var rows = $('.speciesTr').each((e, elem)=> {
        if (elem.children) {
            if (e == 0 || e >= 5) {
                mapData(elem).then(loadElement).then(loadImages);
            }
        }
    });
});


function loadImages(resolveData){
    let mappedImages = resolveData.images.map((image)=>{
        let mappedData = {
            petiole: 'stem',
            leaf: 'leaf',
            leaves: 'leaf',
            flower: 'flower',
            flowers: 'flower',
            fruit: 'fruit',
            needle: 'leaf',
            cone: 'fruit',
            bark: 'bark',
            seed: 'seed'
        };
        let keyCandidates = Object.keys(mappedData).filter((key)=>{
            return image.title.toLowerCase().indexOf(key) >= 0;
        });
        let type = null;
        if(keyCandidates.length){
            type = mappedData[keyCandidates[0]]
        }
        else{
            type = 'unknown'
        }
        return {
            url : image.href,
            title: image.title,
            image_type: type,
            image_origin: 'leafsnap',
            scientific_plant_name: resolveData.scientific_name
        }
    });
    database.then((db)=>{
        db.images.insert(mappedImages).then((success)=>{
            console.log(success);
        }, (err)=>{
            console.log(err);
        })

    }, (err)=>{

    })
}


function loadElement(resolveData){
    let images = resolveData.images;
    delete resolveData.images;
    return new Promise((resolve, reject)=>{
        database.then((db)=>{
            db.plants.insert(resolveData).then((success)=>{
                resolveData.images = images;
              resolve(resolveData)
            }, (err)=>{
                resolveData.images = images;
                resolve(resolveData);
            });
        }, (err)=>{

        })
    })
}


function mapData(element) {
    var keys = ['leaf_image', 'flower', 'fruit', 'common_name', 'scientific_name'];
    var image_keys = ['leaf_image', 'flower', 'fruit'];
    var text_keys = ['common_name', 'scientific_name'];
    var index = 0;
    var species = {};

    element.children.filter((e)=>e.name === 'td').forEach((column)=> {
        let mappingKey = keys[index];
        if (image_keys.includes(mappingKey)) {
            let transformedKey = mappingKey;
            if(transformedKey == 'flower' || transformedKey == 'fruit'){
                transformedKey = transformedKey + '_image'
            }
            species[transformedKey] = column.children.filter((e)=>e.name === 'img')[0].attribs.src;
        }
        if (text_keys.includes(mappingKey)) {
            let cheerioSelector = cheerio.load(column);
            species[mappingKey] = cheerioSelector.text().trim()
        }
        //if(index === 0){
        // console.log(column.attribs, column.children, index, keys[index]);

        //}
        index++
    });
  //  console.log(species);
   return extractDetails(species);
}


function extractDetails(leaf) {
    if(!names.includes(leaf.scientific_name)){
        names.push(leaf.scientific_name);
    }
    let detailsUrl = `http://leafsnap.com/species/${leaf.scientific_name}/`;
    leaf['source_urls'] = [detailsUrl];
    return new Promise((resolve, reject)=> {
        request(detailsUrl, (err, response, data)=> {
            if(data) {
                let $ = cheerio.load(data);
                $('.speciesinfo').each((e, elem)=> {
                    elem.children.filter((e)=>e.type != 'text').map((e)=> {
                        let cheerioSelect = cheerio.load(e);
                        cheerioSelect('div').each((index, divTag)=> {
                            if (divTag.children[0]) {
                                let keyOfInfo = divTag.children.filter((e)=>e.name == 'dt')[0].children[0].data
                                let valueOfInfo = divTag.children.filter((e)=>e.name == 'dd')[0].children[0].data
                                keyOfInfo = keyOfInfo.toLowerCase().replace(':', '').replace(/[^A-Za-z0-9]/g, '_');
                                if(keyOfInfo.includes('presence')){
                                    valueOfInfo = valueOfInfo.split(/[^A-Za-z0-9]/);
                                }
                                leaf[keyOfInfo] = valueOfInfo
                            }
                        })
                    });
                    resolve(leaf);
                });
                let leafImages = [];
                $('.imageItem').each((e, elem)=> {
                    leafImages.push(elem.children.filter((e)=>e.type != 'text')[0].attribs);
                });
                leaf.images = leafImages;
            }

        })
    })

}
