import json
import boto3
import string
import random
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('ShortLinks')

def generate_short_code(length=6):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        long_url = body.get('long_url')
        custom_alias = body.get('custom_alias', '').strip()
        expires_at = body.get('expires_at', '')

        if not long_url:
            return response(400, {'error': 'long_url is required'})

        if custom_alias:
            existing = table.get_item(Key={'short_code': custom_alias})
            if 'Item' in existing:
                return response(409, {'error': 'Alias already taken'})
            short_code = custom_alias
        else:
            short_code = generate_short_code()
            while 'Item' in table.get_item(Key={'short_code': short_code}):
                short_code = generate_short_code()

        item = {
            'short_code': short_code,
            'long_url': long_url,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'click_count': 0,
            'clicks': []
        }

        if custom_alias:
            item['custom_alias'] = custom_alias
        if expires_at:
            item['expires_at'] = expires_at

        table.put_item(Item=item)

        return response(200, {
            'short_code': short_code,
            'short_url': f'https://khfzkzvrxc.execute-api.ap-south-1.amazonaws.com/prod/{short_code}',
            'long_url': long_url
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
