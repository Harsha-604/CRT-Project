import json
import boto3
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('ShortLinks')

def lambda_handler(event, context):
    try:
        short_code = event['pathParameters']['short_code']

        result = table.get_item(Key={'short_code': short_code})
        item = result.get('Item')

        if not item:
            return response(404, {'error': 'Short URL not found'})

        if item.get('expires_at'):
            expiry = datetime.fromisoformat(item['expires_at'])
            if datetime.now(timezone.utc) > expiry:
                return response(410, {'error': 'This link has expired'})

        click = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'ip': event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown'),
            'user_agent': event.get('headers', {}).get('User-Agent', 'unknown')
        }

        table.update_item(
            Key={'short_code': short_code},
            UpdateExpression='SET click_count = click_count + :inc, clicks = list_append(clicks, :click)',
            ExpressionAttributeValues={':inc': 1, ':click': [click]}
        )

        return {
            'statusCode': 301,
            'headers': {
                'Location': item['long_url'],
                'Access-Control-Allow-Origin': '*'
            },
            'body': ''
        }

    except Exception as e:
        return response(500, {'error': str(e)})

def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body)
    }
