# Online Store

This is a full-featured online store built with React, Redux, and Vite.

## Project Description

The online store includes the following features:
- Product catalog browsing with category and price filtering
- Pagination
- Adding products to cart
- Managing product quantities in cart
- Favorites
- Product details view with image switching capability

## Installation and Setup

1. Clone the repository:
   ```
   git clone https://github.com/sugrobov/full-stack-app.git
   ```

2. Navigate to the client directory:
   ```
   cd full-stack-app/client
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Run the application:
   ```
   npm run dev
   ```

5. Open your browser and go to `http://localhost:5173`

## Product Images

Product images are not included in the Git repository due to their size. You can generate images in two ways:

### Method 1: Using Python script (recommended)

1. Make sure you have Python 3 and the Pillow library installed:
   ```
   pip install Pillow
   ```

2. Run the image generation script:
   ```
   python scripts/generate-images.py
   ```

### Method 2: Using Node.js script

1. Run the image generation script:
   ```
   node scripts/generate-images-node.js
   ```

### Method 3: Downloading image archives

Images are divided into 25 archives by categories:

1. Download the image archives:
   - [Category 1](archives/category1.zip) (22.9 MB)
   - [Category 2](archives/category2.zip) (25.4 MB)
   - [Category 3](archives/category3.zip) (21.6 MB)
   - [Category 4](archives/category4.zip) (18.9 MB)
   - [Category 5](archives/category5.zip) (24.4 MB)
   - [Category 6](archives/category6.zip) (23.6 MB)
   - [Category 7](archives/category7.zip) (21.2 MB)
   - [Category 8](archives/category8.zip) (25.3 MB)
   - [Category 9](archives/category9.zip) (20.2 MB)
   - [Category 10](archives/category10.zip) (22.5 MB)
   - [Category 11](archives/category11.zip) (26.9 MB)
   - [Category 12](archives/category12.zip) (23.7 MB)
   - [Category 13](archives/category13.zip) (21.9 MB)
   - [Category 14](archives/category14.zip) (23.5 MB)
   - [Category 15](archives/category15.zip) (20.1 MB)
   - [Category 16](archives/category16.zip) (25.9 MB)
   - [Category 17](archives/category17.zip) (26.5 MB)
   - [Category 18](archives/category18.zip) (17.9 MB)
   - [Category 19](archives/category19.zip) (23.4 MB)
   - [Category 20](archives/category20.zip) (24.3 MB)
   - [Category 21](archives/category21.zip) (26.2 MB)
   - [Category 22](archives/category22.zip) (2.0 MB)
   - [Category 23](archives/category23.zip) (22.7 MB)
   - [Category 24](archives/category24.zip) (25.6 MB)
   - [Category 25](archives/category25.zip) (23.1 MB)

2. Extract each archive to the `client/public/images` folder:
   ```
   client/public/images/
   ├── category1/
   │   ├── product101_image1.ppm
   │   ├── product101_image2.ppm
   │   └── ...
   ├── category2/
   │   ├── product201_image1.ppm
   │   └── ...
   └── ...
   ```

3. After extracting all archives, restart the application:
   ```
   npm run dev
   ```

## Deployment

### Netlify Deployment

This project is configured for easy deployment to Netlify:

1. Connect your GitHub repository to Netlify
2. Set the build command to: `npm run build`
3. Set the publish directory to: `dist`
4. Deploy the site

The `netlify.toml` configuration file is already included in the project for automatic configuration.

For future backend integration, you can set up environment variables in Netlify to point to your API endpoints.

## Project Structure

```
client/
├── public/
│   └── images/          # Product images (not included in Git)
├── src/
│   ├── components/     # React components
│   ├── pages/          # Application pages
│   ├── store/          # Redux store and slices
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main application component
│   └── main.jsx        # Entry point
└── vite.config.js     # Vite configuration
```

## Main Components

- `App.jsx` - Main application component with navigation
- `HomePage.jsx` - Home page with product catalog
- `ProductPage.jsx` - Product details page
- `CartPage.jsx` - Shopping cart page
- `ProductCard.jsx` - Product card component
- `Breadcrumb.jsx` - Breadcrumb navigation component
- `Filters.jsx` - Filter component

## Redux Store

- `productsSlice.js` - Product data management
- `cartSlice.js` - Cart management
- `favoritesSlice.js` - Favorites management

## Technologies

- React 18
- Redux Toolkit
- React Router
- Tailwind CSS
- Vite

## License

MIT