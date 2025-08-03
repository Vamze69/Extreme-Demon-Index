import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        // return await Promise.all(
        //     list.map(async (path, rank) => {
        //         const levelResult = await fetch(`${dir}/${path}.json`);
        //         try {
        //             const level = await levelResult.json();
        //             return [
        //                 {
        //                     ...level,
        //                     path,
        //                     records: level.records.sort(
        //                         (a, b) => b.percent - a.percent,
        //                     ),
        //                },
        //                 null,
        //             ];
        //         } catch {
        //             console.error(`Failed to load level #${rank + 1} ${path}.`);
        //             return [null, path];
        //         }
        //     }),
        // );
        return list;
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}
export async function fetchLevel(name)
{
    if(name.includes("/")) return;

    const levelResult = await fetch(`${dir}/${name}.json`);
    try {
        const level = await levelResult.json();
        return [
            {
                ...level,
                name,
                records: level.records.sort(
                    (a, b) => b.percent - a.percent,
                ),
            },
            null,
        ];
    } catch {
        console.error(`Failed to load level ${name}.`);
        return [null, name];
    }

}
export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}
export async function fetchRecords() {
    // const levelList = await fetchList();

    const recordRes = await fetch(`${dir}/_records.json`);
    try {
        const list =  await recordRes.json();

        // levelList.forEach((level) => {
        //     if(!list[level]) list[level] = []
        // })
        return list;
    } catch {
        console.error(`Failed to load records.`);
    }
}
export async function fetchLeaderboard() {
    const recordList = await fetchRecords();
    const list = await fetchList();

    const scoreMap = {};
    const errs = [];
    list.forEach((level, rank) => {
        if(!recordList[level]) recordList[level] = {
            verifier: {
                verifier: "!!MISSING LEVEL INFO!!"
            },
            records: []

        }
            // if (err) {
            //     errs.push(err);
            //     return;
            // }
            // Verification
            const verifier = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === recordList[level].verifier.verifier.toLowerCase(),
            ) || recordList[level].verifier.verifier;
            scoreMap[verifier] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };

            const { verified } = scoreMap[verifier];
            verified.push({
                rank: rank + 1,
                level: level,
                score: score(rank + 1, 100, recordList[level].percentToQualify),
                link: recordList[level].verifier.verification,
            });
            // Records
            recordList[level].records.forEach((record) => {
                if(record) {
                    const user = Object.keys(scoreMap).find(
                        (u) => u.toLowerCase() === record.user.toLowerCase(),
                    ) || record.user;
                    scoreMap[user] ??= {
                        verified: [],
                        completed: [],
                        progressed: [],
                    };
                    const { completed, progressed } = scoreMap[user];
                    if (record.percent === 100) {
                        completed.push({
                            rank: rank + 1,
                            level: level,
                            score: score(rank + 1, 100, recordList[level].percentToQualify),
                            link: record.link,
                        });
                        return;
                    }

                    progressed.push({
                        rank: rank + 1,
                        level: level.name,
                        percent: record.percent,
                        score: score(rank + 1, record.percent, recordList[level].percentToQualify),
                        link: record.link,
                    });
                }
            });
        
    });

    // Wrap in extra Object containing the user and total score
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    // Sort by total score
    return [res.sort((a, b) => b.total - a.total), errs];
}