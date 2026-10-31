import json
import boto3

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('ShortLinks')

def lambda_handler(event, context):
    try:
        short_code = event['pathParameters']['short_code']

        result = table.get_item(Key={'short_code': short_code})
        item = result.get('Item')

        if not item:
            return response(404, {'error': 'Short URL not found'})

        return response(200, {
            'short_code': short_code,
            'long_url': item['long_url'],
            'created_at': item['created_at'],
            'click_count': int(item.get('click_count', 0)),
            'expires_at': item.get('expires_at', None),
            'clicks': item.get('clicks', [])
        })

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
