import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

export const otopRoutes = new Hono();

// OTOP Products Endpoints

// Get all products
otopRoutes.get("/products", async (c) => {
  try {
    const products = await kv.get("otop_products") || [];
    return c.json(products);
  } catch (error) {
    console.error('Get OTOP products error:', error);
    return c.json({ error: 'Failed to fetch products', details: error.message }, 500);
  }
});

// Get single product
otopRoutes.get("/products/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const products = await kv.get("otop_products") || [];
    const product = products.find((p: any) => p.id === id);
    
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }
    
    return c.json(product);
  } catch (error) {
    console.error('Get OTOP product error:', error);
    return c.json({ error: 'Failed to fetch product', details: error.message }, 500);
  }
});

// Create product
otopRoutes.post("/products", async (c) => {
  try {
    const body = await c.req.json();
    const products = await kv.get("otop_products") || [];
    
    const newProduct = {
      id: `otop_${Date.now()}`,
      name: body.name,
      category: body.category,
      price: body.price,
      producer: body.producer,
      description: body.description || '',
      stockLevel: body.stockLevel || 0,
      status: body.status || 'Draft',
      submittedDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    products.push(newProduct);
    await kv.set("otop_products", products);
    
    return c.json({ success: true, product: newProduct }, 201);
  } catch (error) {
    console.error('Create OTOP product error:', error);
    return c.json({ error: 'Failed to create product', details: error.message }, 500);
  }
});

// Update product
otopRoutes.put("/products/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const products = await kv.get("otop_products") || [];
    
    const index = products.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return c.json({ error: 'Product not found' }, 404);
    }
    
    products[index] = {
      ...products[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set("otop_products", products);
    
    return c.json({ success: true, product: products[index] });
  } catch (error) {
    console.error('Update OTOP product error:', error);
    return c.json({ error: 'Failed to update product', details: error.message }, 500);
  }
});

// Delete product
otopRoutes.delete("/products/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const products = await kv.get("otop_products") || [];
    
    const filteredProducts = products.filter((p: any) => p.id !== id);
    
    if (filteredProducts.length === products.length) {
      return c.json({ error: 'Product not found' }, 404);
    }
    
    await kv.set("otop_products", filteredProducts);
    
    return c.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete OTOP product error:', error);
    return c.json({ error: 'Failed to delete product', details: error.message }, 500);
  }
});

// OTOP Categories Endpoints

// Get all categories
otopRoutes.get("/categories", async (c) => {
  try {
    const categories = await kv.get("otop_categories") || [];
    return c.json(categories);
  } catch (error) {
    console.error('Get OTOP categories error:', error);
    return c.json({ error: 'Failed to fetch categories', details: error.message }, 500);
  }
});

// Create category
otopRoutes.post("/categories", async (c) => {
  try {
    const body = await c.req.json();
    const categories = await kv.get("otop_categories") || [];
    
    const newCategory = {
      id: `category_${Date.now()}`,
      name: body.name,
      active: body.active !== undefined ? body.active : true,
      count: 0,
      createdAt: new Date().toISOString(),
    };
    
    categories.push(newCategory);
    await kv.set("otop_categories", categories);
    
    return c.json({ success: true, category: newCategory }, 201);
  } catch (error) {
    console.error('Create OTOP category error:', error);
    return c.json({ error: 'Failed to create category', details: error.message }, 500);
  }
});

// Update category
otopRoutes.put("/categories/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const categories = await kv.get("otop_categories") || [];
    
    const index = categories.findIndex((cat: any) => cat.id === id);
    if (index === -1) {
      return c.json({ error: 'Category not found' }, 404);
    }
    
    categories[index] = {
      ...categories[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set("otop_categories", categories);
    
    return c.json({ success: true, category: categories[index] });
  } catch (error) {
    console.error('Update OTOP category error:', error);
    return c.json({ error: 'Failed to update category', details: error.message }, 500);
  }
});

// Delete category
otopRoutes.delete("/categories/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const categories = await kv.get("otop_categories") || [];
    
    const filteredCategories = categories.filter((cat: any) => cat.id !== id);
    
    if (filteredCategories.length === categories.length) {
      return c.json({ error: 'Category not found' }, 404);
    }
    
    await kv.set("otop_categories", filteredCategories);
    
    return c.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete OTOP category error:', error);
    return c.json({ error: 'Failed to delete category', details: error.message }, 500);
  }
});
