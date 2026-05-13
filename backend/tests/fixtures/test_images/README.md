# Test Images

Place test bookshelf images here for Vision API testing.

## Required Images

1. **bookshelf_horizontal.jpg** - Horizontal bookshelf (books standing normally)
2. **bookshelf_vertical.jpg** - Vertical bookshelf (books spine up)
3. **bookshelf_mixed.jpg** - Mixed orientation
4. **single_book.jpg** - Single book cover

## Where to Get Test Images

### Option 1: Your Own Photos
Take photos of your bookshelf with your phone

### Option 2: Unsplash (Free)
Search for "bookshelf" on https://unsplash.com/

### Option 3: Google Images
Search for "bookshelf" with usage rights filter

## Image Requirements

- **Format:** JPG or PNG
- **Size:** < 10MB
- **Quality:** Clear, well-lit
- **Content:** Book spines/covers with visible titles

## Testing

```bash
cd backend
python -m scripts.test_vision_service --image tests/fixtures/test_images/bookshelf_horizontal.jpg
```

## Note

These images are for testing only. Do not commit copyrighted images to git.
