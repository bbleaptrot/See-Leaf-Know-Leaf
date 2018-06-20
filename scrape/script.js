var url = 'http://leafsnap.com/species/';
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

request(url, (err, response, data)=> {
    var $ = cheerio.load(data);
    var rows = $('.speciesTr').each((e, elem)=> {
        if (elem.children) {
           // if (e == 0) {
                mapData(elem);
            //}
        }
    });
});



function mapData(element) {
    var keys = ['leaf_image', 'flower', 'fruit', 'common_name', 'scientific_name'];
    var image_keys = ['leaf_image', 'flower', 'fruit'];
    var text_keys = ['common_name', 'scientific_name'];
    var index = 0;
    var species = {};

    element.children.filter((e)=>e.name === 'td').forEach((column)=> {
        let mappingKey = keys[index];
        if (image_keys.includes(mappingKey)) {
            species[mappingKey] = column.children.filter((e)=>e.name === 'img')[0].attribs.src;
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
    console.log(species);
    extractDetails(species);
}

function extractDetails(leaf) {
    let detailsUrl = `http://leafsnap.com/species/${leaf.scientific_name}/`;
    return new Promise((resolve, reject)=> {
        request(detailsUrl, (err, response, data)=> {
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
        })
    }).then((data)=>{
         fs.writeFileSync('leaves/' + data.scientific_name  + '.json', JSON.stringify(data, null, 2));
    })
}
