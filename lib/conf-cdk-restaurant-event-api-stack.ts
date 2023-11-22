import {RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {AuthorizationType, Cors, EndpointType, LambdaRestApi} from "aws-cdk-lib/aws-apigateway";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {AttributeType, BillingMode, StreamViewType, Table} from "aws-cdk-lib/aws-dynamodb";
import {Certificate, CertificateValidation} from "aws-cdk-lib/aws-certificatemanager";
import {HostedZone} from "aws-cdk-lib/aws-route53";

export class ConfCdkRestaurantEventApiStack extends Stack {
    // This property is public because we need to point our Distribution to it (in the frontend-stack)
    public eventLambdaApi: LambdaRestApi;

    private eventDatabase: Table;
    private eventLambda: Function;
    private apiCertificate: Certificate;

    constructor(scope: Construct, id: string, props: StackProps, subdomain: string) {
        super(scope, id, props);

        const hostedZone = HostedZone.fromLookup(this, 'cloud101FrontendHostedZone', {
            domainName: 'cloud101.nl'
        });

        this.eventDatabase = new Table(this, subdomain + 'EventDatabase', {
            tableName: subdomain + 'EventDatabase',
            partitionKey: {
                name: 'eventId',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'timestamp',
                type: AttributeType.STRING,
            },
            billingMode: BillingMode.PAY_PER_REQUEST,
            deletionProtection: false,
            stream: StreamViewType.NEW_IMAGE,
        });

        this.eventLambda = new Function(this, subdomain + 'EventLambda', {
            functionName: subdomain + 'EventLambda',
            description: `Receives events from the API Gateway and stores in DynamodB. Deployed at ${new Date().toISOString()}`,
            code: Code.fromAsset(`src/lambda/eventLambda`),
            runtime: Runtime.NODEJS_18_X,
            handler: 'index.handler',
            environment: {
                EVENT_SOURCE_TABLE_NAME: this.eventDatabase.tableName,
            }
        });

        this.eventDatabase.grantReadWriteData(this.eventLambda);

        this.apiCertificate = new Certificate(this, subdomain + 'EventCertificate', {
            domainName: subdomain + '.cloud101.nl',
            certificateName: subdomain + 'EventCertificate',
            validation: CertificateValidation.fromDns(hostedZone),
        });

        this.eventLambdaApi = new LambdaRestApi(this, subdomain + 'EventLambdaApi', {
            handler: this.eventLambda,
            proxy: true,
            domainName: {
                domainName: subdomain + '.cloud101.nl',
                endpointType: EndpointType.REGIONAL,
                certificate: this.apiCertificate
            },
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS, // Add other allowed origins if needed
                allowMethods: Cors.ALL_METHODS, // Add other allowed methods if needed
                allowHeaders: [ '*' ], // Add other allowed headers if needed
                allowCredentials: true
            },
            defaultMethodOptions: {
                authorizationType: AuthorizationType.NONE
                // Todo: authorizer: CognitoUserPoolsAuthorizer
            }
        });

        // These will throw nullpointer exceptions until you implemented everything.
        this.eventLambdaApi.applyRemovalPolicy(RemovalPolicy.DESTROY);
        this.eventDatabase.applyRemovalPolicy(RemovalPolicy.DESTROY);
        this.eventLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);
        this.apiCertificate.applyRemovalPolicy(RemovalPolicy.DESTROY);
    }
}
