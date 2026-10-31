import json
import boto3
import qrcode
import base64
from io import BytesIO

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('ShortLinks')

def lambda_handler(event, context):
    try:
        short_code = event['pathParameters']['short_code']

        result = table.get_item(Key={'short_code': short_code})
        item = result.get('Item')

        if not item:
            return response(404, {'error': 'Short URL not found'})

        short_url = f'https://khfzkzvrxc.execute-api.ap-south-1.amazonaws.com/prod/{short_code}'

        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(short_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color='black', back_color='white')

        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'short_code': short_code,
                'qr_code': img_base64
            })
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
