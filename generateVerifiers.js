const fs = require('fs')
const recordList = require('./data/_records.json')
const levelList = require('./data/_list.json')


levelList.forEach(level => {
    try { 
        // in case of blank level info
        if(!recordList[level]) recordList[level] = {}
        if(!recordList[level].records) recordList[level].records = []

        if(!recordList[level]) {
                levelInfo = require('./data/' + level + ".json")
                recordList[level] = {
                    percentToQualify: levelInfo.percentToQualify,
                    verifier: {
                        verifier: levelInfo.verifier,
                        verification: levelInfo.verification 
                    }
                }

        } else if (!recordList[level].verifier) {
            levelInfo = require('./data/' + level + ".json")

            recordList[level].verifier = {
                    verifier: levelInfo.verifier,
                    verification: levelInfo.verification 
                }

        }

        if(!recordList[level].percentToQualify) {
            levelInfo = require('./data/' + level + ".json")
            recordList[level].percentToQualify = levelInfo.percentToQualify
        }
    } catch(e) {
        console.log("failed to find level " + level)
    }
});
fs.writeFileSync('./data/_records.json', JSON.stringify(recordList, null, 2));