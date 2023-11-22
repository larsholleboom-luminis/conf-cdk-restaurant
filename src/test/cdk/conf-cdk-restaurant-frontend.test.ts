import {App, Stack} from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {ConfCdkRestaurantFrontendStack} from "../../../lib/conf-cdk-restaurant-frontend-stack";
import {MockStack} from "./mocks/stack";
import {mockEnv} from "./mocks/env";

describe('Testing the front-end stack', () => {
    let app: App;
    let mockStack: MockStack;

    let stackUnderTest: Stack;
    let template: Template;

    beforeAll(() => {
        app = new App();
        mockStack = new MockStack(app);

        stackUnderTest = new ConfCdkRestaurantFrontendStack(app, 'TestStack', {
            eventApi: mockStack.mockApi,
            confCdkRestaurantDistributionCertificate: mockStack.mockCertificate,
            env: mockEnv
        }, 'subdomain');

        template = Template.fromStack(stackUnderTest)
    });

    test('S3 Bucket Created', () => {
        template.hasResource('AWS::S3::Bucket', {});
    });

    test('CloudFront Distribution Created', () => {
        template.hasResource('AWS::CloudFront::Distribution', {});
    });

    test('Route53 A Record Created for CloudFront Distribution', () => {
        template.hasResourceProperties('AWS::Route53::RecordSet', {
            Type: 'A',
        });
    });

});