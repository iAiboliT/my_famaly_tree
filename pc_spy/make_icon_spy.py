
from PIL import Image, ImageDraw, ImageFont

def create_icon_spy():
    # Create a slick icon with "SPY" text or a simple symbol
    size = 256
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # 1. Background: Dark circle (Red/Black gradient simulation)
    d.ellipse((10, 10, 246, 246), fill=(30, 30, 30), outline=(200, 50, 50), width=10)
    
    # 2. Add "SPY" text (very simple pixel font simulation)
    # Using simple rectangles for letters because fonts are tricky in restricted envs
    
    # S
    d.rectangle((60, 80, 100, 100), fill=(255, 255, 255))
    d.rectangle((60, 80, 80, 120), fill=(255, 255, 255))
    d.rectangle((60, 120, 100, 140), fill=(255, 255, 255))
    d.rectangle((80, 140, 100, 180), fill=(255, 255, 255))
    d.rectangle((60, 160, 100, 180), fill=(255, 255, 255))

    # P
    d.rectangle((110, 80, 150, 100), fill=(255, 255, 255))
    d.rectangle((110, 80, 130, 180), fill=(255, 255, 255))
    d.rectangle((130, 80, 150, 140), fill=(255, 255, 255))
    d.rectangle((110, 120, 150, 140), fill=(255, 255, 255))

    # Y
    d.rectangle((160, 80, 180, 120), fill=(255, 255, 255))
    d.rectangle((200, 80, 220, 120), fill=(255, 255, 255))
    d.rectangle((160, 120, 220, 140), fill=(255, 255, 255))
    d.rectangle((180, 140, 200, 180), fill=(255, 255, 255))
    
    img.save('icon_spy.ico', format='ICO', sizes=[(256, 256)])

if __name__ == '__main__':
    create_icon_spy()
