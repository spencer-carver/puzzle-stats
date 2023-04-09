const db = require("./db");
const { anynomizeUUID } = require("./anynomize-user");

const DATABASE = {
    tableName: "puzzleStats",
    partitionKey: "puzzleName",
    value: "stats"
};

function generateParams(puzzleName, stats) {
    const QUERY_TYPE = stats ? "Item" : "Key";

    const params = {
        [QUERY_TYPE]: {
            [DATABASE.partitionKey]: { S: puzzleName }
        },
        TableName: DATABASE.tableName
    };

    if (stats) {
        params[QUERY_TYPE][DATABASE.value] = stats;
    }

    return params;
}

function formatPuzzleStats(record) {
    return {
        hints: record?.stats?.M?.hints?.N ? parseInt(record.stats.M.hints.N) : 0,
        intermediates: record?.stats?.M?.intermediates?.N  ? parseInt(record.stats.M.intermediates.N) : 0,
        incorrect: record?.stats?.M?.incorrect?.N  ? parseInt(record.stats.M.incorrect.N) : 0,
        correct: record?.stats?.M?.correct?.N  ? parseInt(record.stats.M.correct.N) : 0,
        answers: record?.stats?.M?.answers?.M ? Object.keys(record?.stats?.M?.answers?.M).reduce((answerMap, answer) => ({
            ...answerMap,
            [answer]: parseInt(record.stats.M.answers.M[answer].N)
        }), {}) : {},
        firstSolve: record?.stats?.M?.firstSolve?.M ? {
            timestamp: parseInt(record.stats.M.firstSolve.M.timestamp.N),
            user: anynomizeUUID(record.stats.M.firstSolve.M.user.S)
        } : {},
    };
}

async function queryAllStats() {
    const records = await db.getAll({ TableName: DATABASE.tableName });

    return records.reduce((statMap, { puzzleName, stats }) => ({
        ...statMap,
        [puzzleName.S]: formatPuzzleStats({ stats })
    }), {});
}

async function queryPuzzleStats(puzzleName) {
    const record = await db.queryItem(generateParams(puzzleName));

    return formatPuzzleStats(record);
}

async function addHint(puzzleName) {
    let record = await db.queryItem(generateParams(puzzleName));

    if (!record) {
        record = { stats: { M: { hints: { N: "1" } } } };
    } else if (!record.stats.M.hints) {
        record = { stats: { M: { ...record.stats.M, hints: { N: "1" } } } };
    } else {
        record = { stats: { M: { ...record.stats.M, hints: { N: `${ parseInt(record.stats.M.hints.N) + 1 }` } } } };
    }

    return db.insertItem(generateParams(puzzleName, record.stats));
}

async function addIntermediate(puzzleName) {
    let record = await db.queryItem(generateParams(puzzleName));

    if (!record) {
        record = { stats: { M: { intermediates: { N: "1" } } } };
    } else if (!record.stats.M.intermediates) {
        record = { stats: { M: { ...record.stats.M, intermediates: { N: "1" } } } };
    } else {
        record = { stats: { M: {
            ...record.stats.M,
            intermediates: { N: `${ parseInt(record.stats.M.intermediates.N) + 1 }` }
        } } };
    }

    return db.insertItem(generateParams(puzzleName, record.stats));
}

async function addIncorrect(puzzleName, candidateAnswer) {
    let record = await db.queryItem(generateParams(puzzleName));

    if (!record) {
        record = { stats: { M: {
            incorrect: { N: "1" },
            answers: { M: { [candidateAnswer]: { N: "1" } } }
        } } };
    } else if (!record.stats.M.incorrect) {
        record = { stats: { M: {
            ...record.stats.M,
            incorrect: { N: "1" },
            answers: { M: { [candidateAnswer]: { N: "1" } } }
        } } };
    } else {
        record = { stats: { M: {
            ...record.stats.M,
            incorrect: { N: `${ parseInt(record.stats.M.incorrect.N) + 1 }` },
            answers: { M: {
                ...record.stats.M.answers.M,
                [candidateAnswer]: { N: `${ parseInt(record.stats.M.answers.M?.[candidateAnswer].N || 0) + 1 }` }
            } }
        } } };
    }

    return db.insertItem(generateParams(puzzleName, record.stats));
}

async function addCorrect(puzzleName, uuid) {
    let record = await db.queryItem(generateParams(puzzleName));

    if (!record) {
        record = { stats: { M: {
            correct: { N: "1" },
            firstSolve: { M : {
                timestamp: { N: `${ (new Date()).getTime() }` },
                user: { S: uuid }
            } }
        } } };
    } else if (!record.stats.M.correct) {
        record = { stats: { M: {
            ...record.stats.M,
            correct: { N: "1" },
            firstSolve: { M : {
                timestamp: { N: `${ (new Date()).getTime() }` },
                user: { S: uuid }
            } }
        } } };
    } else {
        record = { stats: { M: {
            ...record.stats.M,
            correct: { N: `${ parseInt(record.stats.M.correct.N) + 1 }` }
        } } };
    }

    return db.insertItem(generateParams(puzzleName, record.stats));
}

module.exports = {
    queryAllStats,
    queryPuzzleStats,
    addHint,
    addIntermediate,
    addIncorrect,
    addCorrect
};
