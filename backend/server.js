const express = require("express");
const cors = require("cors");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

let db;


(async () => {
  try {
    db = await open({
      filename: path.join(__dirname, "warehouse.db"),
      driver: sqlite3.Database,
    });

  await db.exec(`
        CREATE TABLE IF NOT EXISTS Categories (
            category_id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS Users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT CHECK(role IN ('Warehouse Staff', 'Warehouse Manager')) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Products (
            product_id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_code TEXT UNIQUE,
            model_name TEXT NOT NULL,
            brand TEXT NOT NULL,
            category_id INTEGER,
            description TEXT,
            price REAL DEFAULT 0,
            stock_quantity INTEGER DEFAULT 0,
            min_threshold INTEGER DEFAULT 5,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES Categories(category_id)
        );


        CREATE TABLE IF NOT EXISTS Inventory_Transactions (
            transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            user_id INTEGER,
            type TEXT CHECK(type IN ('Stock-In', 'Stock-Out')) NOT NULL,
            quantity INTEGER NOT NULL,
            notes TEXT,
            transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES Products(product_id),
            FOREIGN KEY (user_id) REFERENCES Users(user_id)
        );

    `);

  console.log("Database Ready!");

    const PORT = 5000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("Database error:", err);
  }
})();



app.get("/api/products", async (req, res) => {
  const { search, category } = req.query;
  let query = `SELECT p.*, c.category_name FROM Products p LEFT JOIN Categories c ON p.category_id = c.category_id WHERE 1=1`;
  const params = [];


  if (search) {
    query += ` AND (p.product_code LIKE ? OR p.model_name LIKE ? OR p.brand LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }


  if (category && category !== "all") {
    query += ` AND c.category_name = ?`;
    params.push(category);
  }

  const products = await db.all(query, params);
  res.json(products);
});

app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    try {
       
        await db.run("BEGIN TRANSACTION");

        
        await db.run("DELETE FROM Inventory_Transactions WHERE product_id = ?", [id]);

        
        const result = await db.run("DELETE FROM Products WHERE product_id = ?", [id]);

        if (result.changes === 0) {
            await db.run("ROLLBACK");
            return res.status(404).json({ error: "ไม่พบสินค้าที่ต้องการลบ" });
        }

        await db.run("COMMIT");
        res.json({ message: "ลบสินค้าและประวัติทั้งหมดถาวรเรียบร้อยแล้ว" });

    } catch (error) {
        
        await db.run("ROLLBACK");
        console.error("Delete Error:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดทางเทคนิคในการลบข้อมูล" });
    }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await db.get(
      "SELECT user_id, fullname, email, role FROM Users WHERE user_id = ?",
      [req.params.id],
    );
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "ไม่พบผู้ใช้งาน" });
    }
  } catch (error) {
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

app.get("/api/categories", async (req, res) => {
  const categories = await db.all("SELECT * FROM Categories");
  res.json(categories);
});

app.post("/api/transactions", async (req, res) => {
  const { product_id, user_id, type, quantity, note } = req.body;
  try {
    await db.run("BEGIN TRANSACTION");

    const existingProduct = await db.get(
      "SELECT product_id, stock_quantity FROM Products WHERE product_id = ?",
      [product_id],
    );
    if (!existingProduct) {
      throw new Error("ไม่มีสินค้าในคลัง");
    }

    await db.run(
      `INSERT INTO Inventory_Transactions (product_id, user_id, type, quantity, notes) VALUES (?, ?, ?, ?, ?)`,
      [product_id, user_id, type, quantity, note || null],
    );

    if (type === "Stock-In") {
      await db.run(
        "UPDATE Products SET stock_quantity = stock_quantity + ? WHERE product_id = ?",
        [quantity, product_id],
      );
    } else if (type === "Stock-Out") {
      const product = await db.get(
        "SELECT stock_quantity FROM Products WHERE product_id = ?",
        [product_id],
      );
      if (product.stock_quantity < quantity)
        throw new Error("สินค้าในสต็อกไม่เพียงพอ");
      await db.run(
        "UPDATE Products SET stock_quantity = stock_quantity - ? WHERE product_id = ?",
        [quantity, product_id],
      );
    }

    await db.run("COMMIT");
    res.status(201).json({ message: "บันทึกรายการสำเร็จ" });
  } catch (error) {
    await db.run("ROLLBACK");
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/transactions/history", async (req, res) => {
  try {
    const { search, type } = req.query;
    let query = `
      SELECT
        it.transaction_id,
        it.type,
        it.quantity,
        it.notes,
        it.transaction_date,
        p.model_name,
        p.brand,
        p.product_code,
        u.fullname AS operator_name
      FROM Inventory_Transactions it
      JOIN Products p ON p.product_id = it.product_id
      LEFT JOIN Users u ON u.user_id = it.user_id
      WHERE 1=1
    `;
    const params = [];

    if (type === "Stock-In" || type === "Stock-Out") {
      query += ` AND it.type = ?`;
      params.push(type);
    }

    if (search) {
      query += `
        AND (
          p.model_name LIKE ?
          OR p.brand LIKE ?
          OR p.product_code LIKE ?
          OR COALESCE(u.fullname, '') LIKE ?
          OR COALESCE(it.notes, '') LIKE ?
        )
      `;
      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    query += ` ORDER BY it.transaction_date DESC, it.transaction_id DESC`;

    const rows = await db.all(query, params);
    res.json(rows);
  } catch (error) {
    console.error("History Fetch Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงประวัติการเคลื่อนไหว" });
  }
});

app.get("/api/transactions/recent", async (req, res) => {
  const rows = await db.all(`
        SELECT it.*, p.model_name, p.brand, p.product_code 
        FROM Inventory_Transactions it
        JOIN Products p ON p.product_id = it.product_id
        ORDER BY it.transaction_date DESC
        LIMIT 10
    `);
  res.json(rows);
});

app.post("/api/register", async (req, res) => {
  const { fullname, email, password, role } = req.body;
  try {
    const result = await db.run(
      `INSERT INTO Users (fullname, email, password, role) VALUES (?, ?, ?, ?)`,
      [fullname, email, password, role],
    );
    res
      .status(201)
      .json({ message: "สมัครสมาชิกสำเร็จ", userId: result.lastID });
  } catch (error) {
    res.status(400).json({
      error: error.message.includes("UNIQUE")
        ? "อีเมลนี้ถูกใช้งานแล้ว"
        : "เกิดข้อผิดพลาด",
    });
  }
});


app.get("/api/products-detail/:id", async (req, res) => {
  try {
    const product = await db.get(`
      SELECT p.*, c.category_name 
      FROM Products p 
      LEFT JOIN Categories c ON p.category_id = c.category_id 
      WHERE p.product_id = ?`, [req.params.id]);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { product_code, model_name, brand, category_id, category_name, description, price, min_threshold } = req.body;

  try {
    await db.run("BEGIN TRANSACTION");
    let finalCatId = category_id;

    
    if (!finalCatId && category_name) {
      const existing = await db.get("SELECT category_id FROM Categories WHERE category_name = ?", [category_name]);
      if (existing) {
        finalCatId = existing.category_id;
      } else {
        const result = await db.run("INSERT INTO Categories (category_name) VALUES (?)", [category_name]);
        finalCatId = result.lastID;
      }
    }

    await db.run(`
      UPDATE Products SET 
        product_code = ?, model_name = ?, brand = ?, category_id = ?, description = ?, price = ?, min_threshold = ?
      WHERE product_id = ?`,
      [product_code, model_name, brand, finalCatId, description, price, min_threshold, id]
    );

    await db.run("COMMIT");
    res.json({ message: "อัปเดตสำเร็จ" });
  } catch (err) {
    await db.run("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    
    const user = await db.get(
      "SELECT user_id, fullname, email, role FROM Users WHERE email = ? AND password = ?",
      [email, password],
    );

    if (user) {
      res.json({
        message: "Login successful",
        user: {
          id: user.user_id,
          name: user.fullname,
          role: user.role,
        },
      });
    } else {
      res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

app.get("/api/reports/inventory-summary", async (req, res) => {
  try {
    
    const summary = await db.all(`
        SELECT 
            p.product_id, 
            p.product_code, 
            p.model_name, 
            p.brand, 
            p.stock_quantity, 
            (p.price * p.stock_quantity) as total_value,
            p.created_at
        FROM Products p
        WHERE DATE(p.created_at) >= DATE('now', '-1 month')
        ORDER BY p.created_at DESC
    `);
    res.json(summary);
  } catch (error) {
    console.error("Summary Report Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน" });
  }
});



app.get("/api/notifications/low-stock", async (req, res) => {
  try {
    const items = await db.all(`
            SELECT p.product_id, p.model_name, p.brand, p.stock_quantity, p.min_threshold, c.category_name, p.product_code
            FROM Products p
            LEFT JOIN Categories c ON p.category_id = c.category_id
            WHERE p.stock_quantity <= p.min_threshold
        `);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.post("/api/products", async (req, res) => {
  const {
    product_code,
    model_name,
    brand,
    category_id,
    category_name,
    description,
    price,
    stock_quantity,
    min_threshold,
  } = req.body;

  try {
    await db.run("BEGIN TRANSACTION");

    let finalCategoryId = category_id;

    
    if (!finalCategoryId && category_name) {
      
      const existingCat = await db.get(
        "SELECT category_id FROM Categories WHERE category_name = ?",
        [category_name.trim()]
      );

      if (existingCat) {
        finalCategoryId = existingCat.category_id;
      } else {
        
        const resultCat = await db.run(
          "INSERT INTO Categories (category_name) VALUES (?)",
          [category_name.trim()]
        );
        finalCategoryId = resultCat.lastID;
      }
    }

    
    const result = await db.run(
      `INSERT INTO Products (
        product_code, 
        model_name, 
        brand, 
        category_id, 
        description, 
        price, 
        stock_quantity, 
        min_threshold
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_code,
        model_name,
        brand.trim(), // บันทึกชื่อแบรนด์ที่พิมพ์มาได้ทันที
        finalCategoryId,
        description,
        price || 0,
        stock_quantity || 0,
        min_threshold || 5,
      ]
    );

    await db.run("COMMIT");
    res.status(201).json({ message: "เพิ่มสินค้าสำเร็จ", productId: result.lastID });

  } catch (error) {
    await db.run("ROLLBACK");
    console.error("Insert Product Error:", error);
    
    if (error.message.includes("UNIQUE constraint failed: Products.product_code")) {
      res.status(400).json({ error: "รหัสสินค้า (Product Code) นี้มีอยู่ในระบบแล้ว" });
    } else {
      res.status(400).json({ error: "ข้อมูลไม่ถูกต้องหรือเกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
    }
  }
});

app.get("/api/notifications/summary", async (req, res) => {
  const totalProducts = await db.get("SELECT COUNT(*) as cnt FROM Products");
  const totalValue = await db.get(
    "SELECT SUM(price * stock_quantity) as val FROM Products",
  );
  const lowCount = await db.get(
    "SELECT COUNT(*) as cnt FROM Products WHERE stock_quantity <= min_threshold",
  );
  const today = new Date().toISOString().slice(0, 10);
  const transactionsToday = await db.get(
    `SELECT COUNT(*) as cnt FROM Inventory_Transactions WHERE DATE(transaction_date) = ?`,
    [today],
  );

  res.json({
    totalProducts: totalProducts.cnt,
    totalValue: totalValue.val || 0,
    lowCount: lowCount.cnt,
    transactionsToday: transactionsToday.cnt,
  });
});

app.get("/api/transactions/monthly-summary", async (req, res) => {
  const months = Math.max(1, Number(req.query.months) || 1);
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const fromDate = startDate.toISOString().slice(0, 10);

  const rows = await db.all(
    `
        SELECT type, COALESCE(SUM(quantity), 0) AS total_quantity
        FROM Inventory_Transactions
        WHERE DATE(transaction_date) >= ?
        GROUP BY type
        `,
    [fromDate],
  );

  const summary = {
    stockIn: 0,
    stockOut: 0,
    fromDate,
    toDate: new Date().toISOString().slice(0, 10),
  };

  rows.forEach((row) => {
    if (row.type === "Stock-In") summary.stockIn = row.total_quantity;
    if (row.type === "Stock-Out") summary.stockOut = row.total_quantity;
  });

  res.json(summary);
});
