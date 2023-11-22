#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {ConfCdkRestaurantFrontendStack} from '../lib/conf-cdk-restaurant-frontend-stack';
import {ConfCdkRestaurantGlobalStack} from "../lib/conf-cdk-restaurant.global-stack";
import {ConfCdkPipeline} from "../lib/conf-cdk-pipeline-stack";

const app = new cdk.App();

new ConfCdkPipeline(
    app,
    'Pipeline',
    {env: {region: 'us-west-2', account: '531843824238'}}
);