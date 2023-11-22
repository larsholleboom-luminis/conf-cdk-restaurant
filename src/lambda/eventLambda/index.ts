import {APIGatewayEvent} from 'aws-lambda';
import {DatabaseOperations, IDatabaseOperations} from "./DatabaseOperations";

export class RestaurantEventHandler {
    private readonly database: IDatabaseOperations;

    // For testing purposes, we use dependency injection and an easier to mock middleware class for DynamoDB.
    constructor(database: IDatabaseOperations) {
        this.database = database;
    }

    async handler(request: APIGatewayEvent) {
        const headers = {
            "Access-Control-Allow-Origin": "*", // Or specify the desired origin
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE", // Or any other methods you want to allow
            "Access-Control-Allow-Headers": "Content-Type, Authorization", // Specify desired headers
            'Content-Type': 'application/json'
        };

        try {
            if (request.httpMethod === "POST") {
                if (!request.body) throw new Error('Expected a restaurantEvent, but no data received');
                const restaurantEvent: OrderEvent = JSON.parse(request.body).event;

                await this.database.putItem(restaurantEvent);

                return {
                    statusCode: 200,
                    body: `{ "result": "Executed ${restaurantEvent?.eventType} with id ${restaurantEvent?.eventId} at ${restaurantEvent.timestamp}"}`,
                    headers
                };
            } else if (request.httpMethod === "GET") {
                const items = await this.database.scanItems();
                return {
                    statusCode: 200,
                    body: JSON.stringify(items),
                    headers
                };
            }

            throw new Error('Unsupported HTTP method');
        } catch (err: any) {
            return {
                statusCode: 400,
                body: JSON.stringify(err),
                headers
            };
        }
    }
}

export const handler = (request: APIGatewayEvent) => {
    const database = new DatabaseOperations();
    const eventHandler = new RestaurantEventHandler(database);
    return eventHandler.handler(request);
};