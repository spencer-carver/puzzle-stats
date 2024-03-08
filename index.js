const { isAllowed, STAGING_API_DOMAIN } = require("./private-helpers");
const statsDb = require("./statsDb");

function massagePuzzleName(puzzleName) {
    // rounds cause issues here, re-map them.
    if (puzzleName.startsWith("alchemy-")) {
        return `alchemy:${ puzzleName.split("alchemy-")[1] }`;
    }

    if (puzzleName.startsWith("enigmarch-2023-")) {
        return `enigmarch-2023:${ puzzleName.split("enigmarch-2023-")[1] }`;
    }

    if (puzzleName.startsWith("enigmarch-2024-")) {
        return `enigmarch-2024:${ puzzleName.split("enigmarch-2024-")[1] }`;
    }

    return puzzleName;
}

exports.handler = async (event) => {
    console.log(event);
    const {
        httpMethod,
        headers,
        pathParameters,
        requestContext,
        body
    } = event;
    
    const origin = headers.origin || headers.Origin;
    
    if ((!origin && requestContext.domainName !== STAGING_API_DOMAIN) || (origin && !isAllowed(origin))) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: "CORS error" })
        };
    }

    const puzzleName = massagePuzzleName(pathParameters.puzzleName);
    const { operation, answer, uuid } = JSON.parse(body) || {};

    const response = {
        statusCode: 204,
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true"
        },
        multiValueHeaders: {}
    };

    if (operation === "stats" || httpMethod) {
        response.statusCode = 200;

        if (puzzleName === "all") {
            response.body = JSON.stringify(await statsDb.queryAllStats());

            return response;
        }

        response.body = JSON.stringify(await statsDb.queryPuzzleStats(puzzleName));

        return response;
    }

    switch(operation) {
        case "correct": {
            await statsDb.addCorrect(puzzleName, uuid);

            break;
        }
        case "hint": {
            await statsDb.addHint(puzzleName);

            break;
        }
        case "intermediate": {
            await statsDb.addIntermediate(puzzleName);

            break;
        }
        case "incorrect": {
            await statsDb.addIncorrect(puzzleName, answer);

            break;
        }
        default: {
            response.statusCode = 404;

            response.body = JSON.stringify({ error: "unknown operation" });
        }
    }

    return response;
};
