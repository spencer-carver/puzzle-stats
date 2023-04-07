const { isAllowed, STAGING_API_DOMAIN } = require("./private-helpers");
const statsDb = require("./statsDb");

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

    const { puzzleName } = pathParameters;
    const { operation, answer } = JSON.parse(body);

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
        case "correct":
            await statsDb.addCorrect(puzzleName);
        case "hint":
            await statsDb.addHint(puzzleName);
        case "intermediate":
            await statsDb.addIntermediate(puzzleName);
        case "incorrect":
            await statsDb.addIncorrect(puzzleName, answer);
        default: {
            response.statusCode = 404;

            response.body = JSON.stringify({ error: "unknown operation" });
        }
    }

    return response;
};
