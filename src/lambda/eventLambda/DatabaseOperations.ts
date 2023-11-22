import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

export interface IDatabaseOperations {
    putItem(item: any): Promise<void>;
    scanItems(): Promise<any[]>;
}

// This class is introduced for testability and prevents the need to mock the entire DynamoDB client.
// This class won't be tested automatically and should contain the minimum amount of logic possible.
export class DatabaseOperations implements IDatabaseOperations {
    private readonly tableName = process.env.EVENT_SOURCE_TABLE_NAME || '';
    private readonly dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });

    async putItem(item: OrderEvent): Promise<void> {
        await this.dynamo.send(new PutCommand({
            TableName: this.tableName,
            Item: item
        }));
    }

    async scanItems(): Promise<any[]> {
        const result = await this.dynamo.send(new ScanCommand({ TableName: this.tableName }));
        return result.Items || [];
    }
}