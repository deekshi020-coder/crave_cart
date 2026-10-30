import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { query } from '../db/pool.js';

const router = Router();

// Cache or fetch live context of top restaurants and dishes in Chennai
async function getCatalogSummary() {
  try {
    const res = await query(`
      SELECT 
        m.id,
        m.name,
        m.price,
        m.is_veg,
        m.description,
        r.id as restaurant_id,
        r.name as restaurant_name,
        r.cuisine_type,
        r.address as restaurant_address,
        c.name as category_name
      FROM menu_items m
      JOIN restaurants r ON m.restaurant_id = r.id
      JOIN categories c ON m.category_id = c.id
      WHERE m.is_available = true AND r.is_active = true
      ORDER BY r.id, m.id
      LIMIT 60;
    `);
    return res.rows;
  } catch (err: any) {
    console.warn('Failed to fetch catalog summary for AI:', err.message);
    return [];
  }
}

// POST /api/ai/concierge - Smart Food Concierge & Dish Recommendation
router.post('/concierge', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, chatHistory = [], preferences = {} } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const catalog = await getCatalogSummary();
    const catalogJson = JSON.stringify(catalog.map((c) => ({
      id: c.id,
      name: c.name,
      price: Number(c.price),
      isVeg: c.is_veg,
      restaurantId: c.restaurant_id,
      restaurantName: c.restaurant_name,
      cuisine: c.cuisine_type,
      category: c.category_name,
      area: c.restaurant_address,
    })));

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback if API key is not yet set
      const matching = catalog.filter((item) =>
        prompt.toLowerCase().split(' ').some((word: string) =>
          word.length > 2 && (item.name.toLowerCase().includes(word) || item.cuisine_type.toLowerCase().includes(word) || item.restaurant_name.toLowerCase().includes(word))
        )
      ).slice(0, 3);

      const itemsToReturn = matching.length > 0 ? matching : catalog.slice(0, 3);

      res.json({
        reply: `Here are great recommendations from Chennai's top dining spots matching your inquiry:`,
        recommendations: itemsToReturn.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          isVeg: item.is_veg,
          restaurantId: item.restaurant_id,
          restaurantName: item.restaurant_name,
          cuisine: item.cuisine_type,
          area: item.restaurant_address,
        })),
        suggestions: [
          'Show me vegetarian tiffin in Mylapore',
          'Find spicy Chettinad biryani in Anna Nagar',
          'Woodfired pizzas in Nungambakkam',
          'Dessert pairings under ₹300',
        ],
      });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are CraveAI, the intelligent food concierge and gastronomic guide for CraveCart in Chennai, Tamil Nadu, India.
You help diners discover exquisite dishes, customize orders, suggest food pairings, handle dietary preferences (pure veg, jain, high protein, spicy, dessert pairings), and navigate 32 Chennai restaurants across Anna Nagar, T. Nagar, Adyar, Mylapore, Sowcarpet, Velachery, and OMR.

Rules:
1. Always base recommendations on the provided CraveCart catalog. Recommend real dishes available in Chennai.
2. Return a JSON object with:
   - "reply": Warm, engaging, conversational advice (2-3 sentences max). Highlight flavors, ingredients, or pairings.
   - "recommendedDishIds": Array of dish IDs (integers) from the catalog matching the user's request (up to 4 items).
   - "followUps": Array of 3 short follow-up prompts the user might click next.
3. Be helpful, concise, and foodie-friendly. Use INR (₹) for prices.`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Available Chennai CraveCart Menu Items:
${catalogJson}

User Inquiry: "${prompt}"
User Preferences: ${JSON.stringify(preferences)}

Respond with a valid JSON object matching:
{
  "reply": "friendly explanation",
  "recommendedDishIds": [1, 2],
  "followUps": ["query 1", "query 2", "query 3"]
}`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',

      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        reply: text,
        recommendedDishIds: [],
        followUps: ['Find biryani in Anna Nagar', 'Dessert pairings', 'Pure veg tiffins in Mylapore'],
      };
    }

    const recIds: number[] = Array.isArray(parsed.recommendedDishIds) ? parsed.recommendedDishIds : [];
    const recommendedItems = catalog
      .filter((item) => recIds.includes(item.id))
      .map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        isVeg: item.is_veg,
        restaurantId: item.restaurant_id,
        restaurantName: item.restaurant_name,
        cuisine: item.cuisine_type,
        area: item.restaurant_address,
      }));

    res.json({
      reply: parsed.reply || 'Here are curated culinary picks for you!',
      recommendations: recommendedItems.length > 0 ? recommendedItems : catalog.slice(0, 3).map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        isVeg: item.is_veg,
        restaurantId: item.restaurant_id,
        restaurantName: item.restaurant_name,
        cuisine: item.cuisine_type,
        area: item.restaurant_address,
      })),
      suggestions: parsed.followUps || [
        'Top rated biryani in Chennai',
        'Pure veg dining in Sowcarpet',
        'What dessert pairs with spicy Chettinad?',
      ],
    });
  } catch (err: any) {
    console.error('AI Concierge error:', err.message);
    res.status(500).json({ error: 'AI Concierge temporarily unavailable: ' + err.message });
  }
});

// POST /api/ai/pairing - Food Pairing Suggestions (e.g. drinks, desserts, sides)
router.post('/pairing', async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemName, category, isVeg } = req.body;
    const catalog = await getCatalogSummary();

    const pairings = catalog.filter((item) => {
      if (category === 'Biryani') {
        return item.category_name === 'Beverages' || item.category_name === 'Desserts & Sweets' || item.name.includes('Lassi');
      }
      if (category === 'Pizza & Italian') {
        return item.category_name === 'Desserts & Sweets' || item.name.includes('Tiramisu') || item.name.includes('Focaccia');
      }
      return item.category_name === 'Beverages' || item.category_name === 'Desserts & Sweets';
    }).slice(0, 3);

    res.json({
      targetItem: itemName,
      pairings: pairings.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        isVeg: p.is_veg,
        restaurantName: p.restaurant_name,
        restaurantId: p.restaurant_id,
      })),
      reason: `Specially paired to balance the bold spices and complement your ${itemName || 'meal'}!`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
