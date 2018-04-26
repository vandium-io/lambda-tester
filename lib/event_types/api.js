const Tester = require( './tester' );

const utils = require( '../utils' );

class APITester extends Tester {

    constructor() {

        super();

        this._event = {

            resource: '/',
            path: '/',
            httpMethod: 'GET',
            headers: null,
            queryStringParameters: null,
            pathParameters: null,
            stageVariables: null,
            
            requestContext: {

                resourcePath: '/',
                apiId: '00aaa0a00a',
                accountId: "999999999999",
                resourceId: "5kwokute99",
                stage: null,
                requestId: "test-invoke-request",

                identity: {

                    cognitoIdentityPoolId: null,
                    accountId: "999999999999",
                    cognitoIdentityId: null,
                    caller: "999999999999",
                    apiKey: "test-invoke-api-key",
                    sourceIp: "1.2.3.4",
                    accessKey: "ASIAJ7WA3PXZVP6WUPZQ",
                    cognitoAuthenticationType: null,
                    cognitoAuthenticationProvider: null,
                    userArn: "arn:aws:iam::999999999999:root",
                    userAgent: "Apache-HttpClient/4.5.x (Java/1.8.0_102)",
                    user: "999999999999"
                }
            },
            body: null,
            isBase64Encoded: false
        };
    }

    httpMethod( value ) {

        return this.putEventValue( 'httpMethod', value );
    }

    resource( value ) {

        this.putEventValue( 'resource', value );
        this.putEventValue( 'path', value );
        this.putEventValue( 'requestContext.resourcePath', value );

        return this;
    }

    path( value ) {

        return this.putEventValue( 'path', value );
    }

    headers( value ) {

        return this.putEventValue( 'headers', value );
    }

    queryStringParameters( value ) {

        return this.putEventValue( 'queryStringParameters', value );
    }

    pathParameters( value ) {

        return this.putEventValue( 'pathParameters', value );
    }

    body( body = {}, base64Encoded = false ) {

        if( body ) {

            if( body instanceof Buffer ) {

                body = body.toString( 'base64' );
                base64Encoded = true;
            }
            else {

                if( utils.isObject( body ) ) {

                    body = JSON.stringify( body );
                }
                else {

                    body = body.toString();
                }
            }
        }

        this.putEventValue( 'body', body );
        this.putEventValue( 'isBase64Encoded', base64Encoded );

        return this;
    }

    apiId( id ) {

        return this.putEventValue( 'requestContext.apiId', id );
    }

    base64Encoded( encoded = true ) {

        return this.putEventValue( 'isBase64Encoded', encoded );
    }
}

module.exports = APITester;
