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
    const { answer, hintCount } = JSON.parse(body);
    
    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true"
        },
        multiValueHeaders: {}
    };
    
    const candidateAnswer = massageAnswer(answer);
    const solution = massageAnswer(ANSWERS_MAP[puzzleName]);
    
    if (solution === candidateAnswer) {
        response.body = JSON.stringify({
            correct: true,
            submission: candidateAnswer,
            value: ANSWERS_MAP[puzzleName]
        });
        
        if (origin.startsWith("https")) {
            await statsDb.addCorrect(puzzleName);
        }
    } else if (Object.keys(INTERMEDIATE_MAP[puzzleName]).indexOf(candidateAnswer) !== -1) {
        response.body = JSON.stringify({
            correct: false,
            intermediate: true,
            submission: candidateAnswer,
            value: INTERMEDIATE_MAP[puzzleName][candidateAnswer]
        });

        if (origin.startsWith("https")) {
            await statsDb.addIntermediate(puzzleName);
        }
    } else if (candidateAnswer === "HINT") {
        const hintIndex = hintCount >= HINTS[puzzleName].length ? HINTS[puzzleName].length - 1 : hintCount;
        response.body = JSON.stringify({
            correct:false,
            hint: true,
            submission: candidateAnswer,
            value: HINTS[puzzleName][hintIndex]
        });
        
        if (origin.startsWith("https")) {
            await statsDb.addHint(puzzleName);
        }
    } else {
        response.body = JSON.stringify({
            correct: false,
            submission: candidateAnswer,
            value: candidateAnswer
        });
        
        if (origin.startsWith("https")) {
            await statsDb.addIncorrect(puzzleName, candidateAnswer);
        }
    }

    return response;
};
