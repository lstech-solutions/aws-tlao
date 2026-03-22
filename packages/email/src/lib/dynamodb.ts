import * as AWS from 'aws-sdk'

const dynamodb = new AWS.DynamoDB.DocumentClient()
type DocumentKey = AWS.DynamoDB.DocumentClient.Key
type DocumentAttributes = AWS.DynamoDB.DocumentClient.PutItemInputAttributeMap

export class DynamoDBService {
  async put(tableName: string, item: DocumentAttributes): Promise<void> {
    await dynamodb.put({ TableName: tableName, Item: item }).promise()
  }

  async get(tableName: string, key: DocumentKey): Promise<unknown> {
    const result = await dynamodb.get({ TableName: tableName, Key: key }).promise()
    return result.Item
  }

  async query(
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, unknown>,
    indexName?: string,
    limit?: number,
    exclusiveStartKey?: DocumentKey
  ): Promise<{ items: unknown[]; lastEvaluatedKey?: DocumentKey }> {
    const params: AWS.DynamoDB.DocumentClient.QueryInput = {
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    }

    if (indexName) {
      params.IndexName = indexName
    }

    if (limit) {
      params.Limit = limit
    }

    if (exclusiveStartKey) {
      params.ExclusiveStartKey = exclusiveStartKey
    }

    const result = await dynamodb.query(params).promise()
    return {
      items: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
    }
  }

  async update(
    tableName: string,
    key: DocumentKey,
    updateExpression: string,
    expressionAttributeValues: Record<string, unknown>
  ): Promise<unknown> {
    const result = await dynamodb
      .update({
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
      .promise()
    return result.Attributes
  }

  async delete(tableName: string, key: DocumentKey): Promise<void> {
    await dynamodb.delete({ TableName: tableName, Key: key }).promise()
  }
}

export const dynamoDBService = new DynamoDBService()
