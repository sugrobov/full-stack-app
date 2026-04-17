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

### Option 1: Run from root directory (recommended)

1. Clone the repository:
```bash
git clone https://github.com/sugrobov/full-stack-app.git
cd full-stack-app
```

2. Install all dependencies (client, server, and root):
```bash
npm run install-all
```
Or install manually:
```bash
npm install
cd client && npm install
cd ../server && npm install
```

3. Start both client and server simultaneously:
```bash
npm start
```
Or start them separately:
```bash
npm run server # starts backend on port 5000
npm run client # starts frontend on port 5173
```

4. Open your browser:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

### Option 2: Run client only (legacy)

1. Navigate to the client directory:
```bash
cd full-stack-app/client
```

2. Install dependencies:
```bash
npm install
```

3. Run the application:
```bash
npm run dev
```

4. Open your browser and go to `http://localhost:5173`

## Database Setup

The backend server requires MySQL to be running. Follow these steps to set up the database:

1. **Install MySQL** if you don't have it already:
- [MySQL Download](https://dev.mysql.com/downloads/mysql/)
- Or use XAMPP/WAMP which includes MySQL

2. **Start MySQL service** and ensure it's running on port 3306

3. **Configure environment variables**:
- Copy the example environment file:
```bash
cp server/.env.example server/.env
```
- Edit `server/.env` with your MySQL credentials

4. **Initialize the database** (optional - tables are created automatically):
```bash
cd server
npm run init-db
```

5. **Default credentials** (if using the .env.example as-is):
- Host: `localhost`
- User: `root`
- Password: (empty)
- Database: `store_db`

**Note**: If you don't need the backend API to function (e.g., just testing the frontend), the server will still start but will show database connection errors. The frontend will work independently.

## Product Images

The application now uses **client-side SVG placeholders** for product images. No external image downloads or archives are required. 

- Product cards and detail pages display colorful SVG tiles with product names.
- The placeholder color is derived from the product ID, ensuring consistent and varied visuals.
- Images are generated entirely on the client side, eliminating network requests and broken image errors.

If you later wish to add real product images:
1. Place your images in the `client/public/images/` folder following the pattern:  
`/images/categoryX/productXXX_imageY.jpg` (or `.png`, `.webp`).
2. Update the `isValidLocalImage` logic in `ProductCard.jsx` and `ProductPage.jsx` to recognize your local paths.
3. Modify `server/init-db.js` to populate the database with your local image URLs.

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
│   └── images/ # Optional: place real product images here
├── src/
│   ├── components/ # React components
│   ├── pages/ # Application pages
│   ├── store/ # Redux store and slices
│   ├── utils/ # Utility functions
│   ├── App.jsx # Main application component
│   └── main.jsx # Entry point
└── vite.config.js # Vite configuration
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