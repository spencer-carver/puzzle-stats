const { isAllowed, STAGING_API_DOMAIN } = require("./private-helpers");
const statsDb = require("./statsDb");

exports.handler = async (event) => {
    console.log(event);
    const {
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

    switch(operation) {
        case "correct": {
            await statsDb.addCorrect(puzzleName);

            return response;
        }
        case "hint": {
            await statsDb.addHint(puzzleName);

            return response;
        }
        case "intermediate": {
            await statsDb.addIntermediate(puzzleName);

            return response;
        }
        case "incorrect": {
            await statsDb.addIncorrect(puzzleName, answer);

            return response;
        }
        default: {
            // todo
            response.statusCode = 200;
            response.body = JSON.stringify(await statsDb.queryPuzzleStats(puzzleName));

            return response;
        }
    }
};
