
from PIL import Image, ImageDraw

def create_icon():
    # Create a 256x256 image with transparent background
    img = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Draw a blue shield-like shape
    d.ellipse((28, 28, 228, 228), fill=(0, 120, 215), outline=(255, 255, 255), width=8)
    
    # Draw a white pulse line / cross
    d.rectangle((108, 68, 148, 188), fill=(255, 255, 255))
    d.rectangle((68, 108, 188, 148), fill=(255, 255, 255))
    
    # Save as ICO
    img.save('icon.ico', format='ICO', sizes=[(256, 256)])

if __name__ == '__main__':
    create_icon()
